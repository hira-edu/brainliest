import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyticsService } from "./analytics";
import { getQuestionHelp, explainAnswer } from "./ai";
import { emailService } from "./email-service";
import { authService } from "./auth-service";
import { adminAuthService } from "./admin-auth-service";
import { adminUserService } from './admin-user-management';
import { tokenAdminAuth } from './token-admin-auth';
import { requireNewAdminAuth, logNewAdminAction, extractClientInfo } from "./middleware/admin-auth";
import { enforceFreemiumLimit, recordFreemiumQuestionView, checkFreemiumStatus } from "./middleware/freemium";
import { seoService } from "./seo-service";
import { recaptchaService } from "./recaptcha-service";
import { trendingService } from "./trending-service";
import { geolocationService } from "./geolocation-service";
import { parseId, parseOptionalId, validateEmail, validatePassword } from "./utils/validation";
import { sanitizeInput, sanitizeRequestBody, checkRateLimit } from './security/input-sanitizer';
import { logAdminAction, createAuditMiddleware } from './security/admin-audit';
import { 
  insertSubjectSchema, 
  insertExamSchema, 
  insertQuestionSchema,
  insertExamSessionSchema,
  insertCommentSchema,
  insertDetailedAnswerSchema,
  insertExamAnalyticsSchema,
  insertUserSchema
} from "@shared/schema";

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// Extend Request interface for enterprise session management
declare module 'express' {
  interface Request {
    adminSession?: import('./enterprise-admin-session-manager').AdminSession;
    sessionId?: string;
  }
}

// Exchange authorization code for user information
async function exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo> {
  try {
    console.log('🔄 Exchanging OAuth code for tokens...');
    
    // Determine the correct redirect URI based on environment
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000/api/auth/google/callback'
      : `https://${process.env.REPL_SLUG || 'app'}.replit.app/api/auth/google/callback`;
    
    console.log('🔗 Using redirect URI:', redirectUri);
    
    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();
    console.log('✅ Tokens received successfully');

    // Step 2: Get user info using access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('❌ User info fetch failed:', userResponse.status);
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    const userInfo: GoogleUserInfo = await userResponse.json();
    console.log('✅ User info retrieved:', { email: userInfo.email, name: userInfo.name });

    return userInfo;
  } catch (error) {
    console.error('❌ OAuth code exchange error:', error);
    throw new Error('Failed to authenticate with Google');
  }
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Freemium status endpoint
  app.get("/api/freemium/status", checkFreemiumStatus(), async (req, res) => {
    try {
      res.json({
        freemiumSession: req.freemiumSession,
        isAuthenticated: false, // This would be true if user is logged in
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get freemium status" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection by fetching one subject
      await storage.getSubjects();
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        database: "connected",
        version: "1.0.0"
      });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed"
      });
    }
  });

  // Note: Categories are hardcoded in frontend, no backend routes needed

  // Note: Subcategories are hardcoded in frontend, no backend routes needed

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'subject ID');
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }
      const subject = await storage.getSubject(id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.post("/api/subjects", requireNewAdminAuth, logNewAdminAction('CREATE_SUBJECT'), async (req, res) => {
    try {
      const validation = insertSubjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid subject data", errors: validation.error.errors });
      }
      const subject = await storage.createSubject(validation.data);
      res.status(201).json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // Exam routes
  app.get("/api/exams", async (req, res) => {
    try {
      const subjectId = parseOptionalId(req.query.subjectId as string);
      const exams = subjectId 
        ? await storage.getExamsBySubject(subjectId)
        : await storage.getExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'exam ID');
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", requireNewAdminAuth, logNewAdminAction('CREATE_EXAM'), async (req, res) => {
    try {
      const validation = insertExamSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid exam data", errors: validation.error.errors });
      }
      const exam = await storage.createExam(validation.data);
      res.status(201).json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  // Question routes
  app.get("/api/questions", checkFreemiumStatus(), async (req, res) => {
    try {
      const examId = parseOptionalId(req.query.examId as string);
      const questions = examId 
        ? await storage.getQuestionsByExam(examId)
        : await storage.getQuestions();
      
      // Add freemium session info to response for frontend
      const responseData = {
        questions,
        freemiumSession: req.freemiumSession
      };
      
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", enforceFreemiumLimit(), recordFreemiumQuestionView(), async (req, res) => {
    try {
      const id = parseId(req.params.id, 'question ID');
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Add freemium session info to response
      const responseData = {
        ...question,
        freemiumSession: req.freemiumSession
      };
      
      res.json(responseData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", requireNewAdminAuth, logNewAdminAction('CREATE_QUESTION'), async (req, res) => {
    try {
      const validation = insertQuestionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid question data", errors: validation.error.errors });
      }
      const question = await storage.createQuestion(validation.data);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireNewAdminAuth, logNewAdminAction('UPDATE_QUESTION'), async (req, res) => {
    try {
      const id = parseId(req.params.id, 'question ID');
      const validation = insertQuestionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid question data", errors: validation.error.errors });
      }
      const question = await storage.updateQuestion(id, validation.data);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/all", requireNewAdminAuth, logNewAdminAction('DELETE_ALL_QUESTIONS'), async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      for (const question of questions) {
        await storage.deleteQuestion(question.id);
      }
      res.json({ message: "All questions deleted successfully", count: questions.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete all questions" });
    }
  });

  app.delete("/api/questions/:id", requireNewAdminAuth, logNewAdminAction('DELETE_QUESTION'), async (req, res) => {
    try {
      const id = parseId(req.params.id, 'question ID');
      const deleted = await storage.deleteQuestion(id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Bulk question operations for CSV import - ADMIN PROTECTED
  app.post("/api/questions/bulk", requireNewAdminAuth, logNewAdminAction('BULK_CREATE_QUESTIONS'), async (req, res) => {
    try {
      const { questions } = req.body;
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Invalid questions data" });
      }

      const createdQuestions = [];
      for (const questionData of questions) {
        const validation = insertQuestionSchema.safeParse(questionData);
        if (validation.success) {
          try {
            const question = await storage.createQuestion(validation.data);
            createdQuestions.push(question);
          } catch (error) {
            console.error("Failed to create question:", error);
          }
        }
      }

      res.status(201).json({ 
        message: `Successfully imported ${createdQuestions.length} questions`,
        created: createdQuestions.length,
        total: questions.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to import questions" });
    }
  });



  // Analytics routes
  app.get("/api/analytics/overview/:userName", async (req, res) => {
    try {
      const { userName } = req.params;
      
      // Get user profile
      const userProfile = await analyticsService.getUserProfile(userName);
      
      // Get exam analytics
      const examAnalytics = await analyticsService.getExamAnalytics(userName);
      
      // Get answer history for detailed analysis
      const answerHistory = await analyticsService.getAnswerHistory(userName);
      
      // Get performance trends
      const performanceTrends = await analyticsService.getPerformanceTrends(userName);
      
      // Calculate additional metrics
      const totalTimeSpent = examAnalytics.reduce((sum, exam) => sum + (exam.timeSpent || 0), 0);
      const averageTimePerQuestion = answerHistory.length > 0 ? totalTimeSpent / answerHistory.length : 0;
      
      // Calculate accuracy by difficulty
      const difficultyAnalysis = answerHistory.reduce((acc, answer) => {
        const difficulty = answer.difficulty || 'Unknown';
        if (!acc[difficulty]) {
          acc[difficulty] = { correct: 0, total: 0 };
        }
        acc[difficulty].total++;
        if (answer.isCorrect) acc[difficulty].correct++;
        return acc;
      }, {} as Record<string, { correct: number; total: number }>);

      res.json({
        userProfile,
        examAnalytics,
        answerHistory,
        performanceTrends,
        metrics: {
          totalTimeSpent,
          averageTimePerQuestion,
          difficultyAnalysis,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.post("/api/analytics/record-answer", async (req, res) => {
    try {
      const validation = insertDetailedAnswerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid answer data", errors: validation.error.errors });
      }
      const answer = await analyticsService.recordAnswer(validation.data);
      res.status(201).json(answer);
    } catch (error) {
      res.status(500).json({ message: "Failed to record answer" });
    }
  });

  app.post("/api/analytics/exam-completed", async (req, res) => {
    try {
      const validation = insertExamAnalyticsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid exam analytics data", errors: validation.error.errors });
      }
      const analytics = await analyticsService.createExamAnalytics(validation.data);
      
      // Update user profile
      await analyticsService.createOrUpdateUserProfile(req.body.userName, {
        score: req.body.score,
        totalQuestions: req.body.totalQuestions
      });
      
      res.status(201).json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to record exam completion" });
    }
  });

  app.get("/api/analytics/performance-trends/:userName", async (req, res) => {
    try {
      const { userName } = req.params;
      const trends = await analyticsService.getPerformanceTrends(userName);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance trends" });
    }
  });

  app.get("/api/analytics/study-recommendations/:userName", async (req, res) => {
    try {
      const { userName } = req.params;
      const recommendations = await analyticsService.getStudyRecommendations(userName);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch study recommendations" });
    }
  });

  // Contact form route
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, category, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !category || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // In a real application, you would:
      // 1. Save to database
      // 2. Send email notification to support team
      // 3. Send confirmation email to user
      // For now, we'll just log and return success
      
      console.log("Contact form submission:", {
        name,
        email,
        subject,
        category,
        message,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({ 
        message: "Contact form submitted successfully",
        id: Math.random().toString(36).substr(2, 9) // Generate simple ID
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // User Session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const validation = insertExamSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid session data", errors: validation.error.errors });
      }
      const session = await storage.createExamSession(validation.data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'session ID');
      const session = await storage.getExamSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'session ID');
      const validation = insertExamSessionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid session data", errors: validation.error.errors });
      }
      const session = await storage.updateExamSession(id, validation.data);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Comment routes
  app.get("/api/comments", async (req, res) => {
    try {
      const questionId = parseOptionalId(req.query.questionId as string);
      const comments = questionId 
        ? await storage.getCommentsByQuestion(questionId)
        : await storage.getComments();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validation = insertCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: validation.error.errors });
      }
      const comment = await storage.createComment(validation.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'comment ID');
      const deleted = await storage.deleteComment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // AI Help routes
  app.post("/api/ai/question-help", async (req, res) => {
    try {
      const { questionId } = req.body;
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const subject = await storage.getSubject(question.subjectId);
      const subjectName = subject?.name || "certification";

      const help = await getQuestionHelp(question.text, question.options, subjectName);
      res.json({ help });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI help" });
    }
  });

  app.post("/api/ai/explain-answer", async (req, res) => {
    try {
      const { questionId, userAnswer } = req.body;
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const subject = await storage.getSubject(question.subjectId);
      const subjectName = subject?.name || "certification";

      const explanation = await explainAnswer(
        question.text, 
        question.options, 
        question.correctAnswer, 
        userAnswer, 
        subjectName
      );
      res.json({ explanation });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI explanation" });
    }
  });

  // Settings API endpoints
  app.get("/api/settings/profile", async (req, res) => {
    try {
      // Mock user profile data
      const profile = {
        firstName: "John",
        lastName: "Doe", 
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        bio: "Passionate about learning and professional development.",
        location: "San Francisco, CA",
        dateOfBirth: "1990-01-15",
        website: "https://johndoe.com"
      };
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/settings/profile", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, bio, location, dateOfBirth, website } = req.body;
      
      // Here you would update the user profile in the database
      res.json({ 
        message: "Profile updated successfully",
        success: true 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/settings/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      // Here you would verify current password and update to new password
      res.json({ 
        message: "Password changed successfully",
        success: true 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/settings/notifications", async (req, res) => {
    try {
      const notifications = {
        emailNotifications: true,
        pushNotifications: true,
        examReminders: true,
        progressUpdates: true,
        marketingEmails: false,
        weeklyDigest: true,
        practiceReminders: true
      };
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/settings/notifications", async (req, res) => {
    try {
      // Here you would update notification preferences in the database
      res.json({ 
        message: "Notification settings updated successfully",
        success: true 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  app.post("/api/settings/export-data", async (req, res) => {
    try {
      // Here you would generate and send export data
      res.json({ 
        message: "Data export requested. You will receive an email with download link.",
        success: true 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.delete("/api/settings/delete-account", async (req, res) => {
    try {
      // Here you would mark account for deletion
      res.json({ 
        message: "Account deletion requested. Your account will be deleted within 24 hours.",
        success: true 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process account deletion" });
    }
  });

  // User Management routes
  app.get("/api/users", async (req, res) => {
    try {
      const { role, isActive, isBanned, search } = req.query;
      const filters = {
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isBanned: isBanned === 'true' ? true : isBanned === 'false' ? false : undefined,
        search: search as string,
      };
      
      const users = await storage.getUsersWithFilters(filters);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'user ID');
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.errors });
      }
      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'user ID');
      const validation = insertUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.errors });
      }
      const user = await storage.updateUser(id, validation.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'user ID');
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/users/:id/ban", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'user ID');
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ message: "Ban reason is required" });
      }
      const success = await storage.banUser(id, reason);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User banned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post("/api/users/:id/unban", async (req, res) => {
    try {
      const id = parseId(req.params.id, 'user ID');
      const success = await storage.unbanUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  app.get("/api/users/export/csv", async (req, res) => {
    try {
      const { role, isActive, isBanned, search } = req.query;
      const filters = {
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isBanned: isBanned === 'true' ? true : isBanned === 'false' ? false : undefined,
        search: search as string,
      };
      
      const users = await storage.getUsersWithFilters(filters);
      
      // Convert to CSV format
      const csvHeader = "ID,Email,Username,First Name,Last Name,Role,Active,Banned,Ban Reason,Last Login,Last Login IP,Registration IP,Created At,Updated At\n";
      const csvRows = users.map(user => {
        const formatDate = (date: Date | null) => date ? date.toISOString() : '';
        return [
          user.id,
          user.email,
          user.username,
          user.firstName || '',
          user.lastName || '',
          user.role,
          user.isActive,
          user.isBanned,
          user.banReason || '',
          formatDate(user.lastLoginAt),
          user.lastLoginIp || '',
          user.registrationIp || '',
          formatDate(user.createdAt),
          formatDate(user.updatedAt)
        ].map(field => `"${field}"`).join(',');
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export users" });
    }
  });

  // ADMIN USER MANAGEMENT ROUTES - Enterprise-grade admin controls
  // Secure admin-only routes with separate authentication
  
  /**
   * Create new user (Admin-only endpoint)
   * POST /api/admin/users
   */
  app.post("/api/admin/users", async (req, res) => {
    try {
      // Extract admin token and verify
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }
      
      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(token);
      
      if (!valid || !adminUser) {
        return res.status(401).json({ message: 'Invalid admin token' });
      }
      
      // Extract user data from request
      const { email, role, password, firstName, lastName, username } = req.body;
      
      // Validate required fields
      if (!email || !role || !password) {
        return res.status(400).json({ 
          message: 'Missing required fields: email, role, and password are required' 
        });
      }
      
      // Get client IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Create user via admin service
      const newUser = await adminUserService.createUser(
        { email, role, password, firstName, lastName, username },
        adminUser.id,
        adminUser.email,
        ipAddress,
        userAgent
      );
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: newUser
      });
      
    } catch (error) {
      console.error('Admin create user error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to create user',
        success: false
      });
    }
  });
  
  /**
   * Update existing user (Admin-only endpoint)
   * PUT /api/admin/users/:id
   */
  app.put("/api/admin/users/:id", async (req, res) => {
    try {
      // Extract admin token and verify
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }
      
      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(token);
      
      if (!valid || !adminUser) {
        return res.status(401).json({ message: 'Invalid admin token' });
      }
      
      // Get user ID from params
      const userId = parseId(req.params.id, 'user ID');
      
      // Extract update data from request
      const { email, role, password, firstName, lastName, isActive, isBanned, banReason } = req.body;
      
      // Get client IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Update user via admin service
      const updatedUser = await adminUserService.updateUser(
        userId,
        { email, role, password, firstName, lastName, isActive, isBanned, banReason },
        adminUser.id,
        adminUser.email,
        ipAddress,
        userAgent
      );
      
      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to update user',
        success: false
      });
    }
  });
  
  /**
   * Delete user (Admin-only endpoint)
   * DELETE /api/admin/users/:id
   */
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      // Extract admin token and verify
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }
      
      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(token);
      
      if (!valid || !adminUser) {
        return res.status(401).json({ message: 'Invalid admin token' });
      }
      
      // Get user ID from params
      const userId = parseId(req.params.id, 'user ID');
      
      // Get client IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Delete user via admin service
      const result = await adminUserService.deleteUser(
        userId,
        adminUser.id,
        adminUser.email,
        ipAddress,
        userAgent
      );
      
      res.json(result);
      
    } catch (error) {
      console.error('Admin delete user error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to delete user',
        success: false
      });
    }
  });
  
  /**
   * Get admin audit logs (Admin-only endpoint)
   * GET /api/admin/audit-logs
   */
  app.get("/api/admin/audit-logs", async (req, res) => {
    try {
      // Extract admin token and verify
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }
      
      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(token);
      
      if (!valid || !adminUser) {
        return res.status(401).json({ message: 'Invalid admin token' });
      }
      
      // Get pagination parameters
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get audit logs
      const logs = await adminUserService.getAdminAuditLogs(limit, offset);
      
      res.json({
        success: true,
        logs,
        pagination: {
          limit,
          offset,
          total: logs.length
        }
      });
      
    } catch (error) {
      console.error('Admin audit logs error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch audit logs',
        success: false
      });
    }
  });

  // Geolocation API endpoints
  app.get("/api/geolocation/ip/:ip", async (req, res) => {
    try {
      const ip = req.params.ip;
      
      // Validate IP format (basic validation)
      if (!ip || ip === 'undefined' || ip === 'null') {
        return res.status(400).json({ 
          message: "Valid IP address is required",
          ip: ip
        });
      }

      // Get location data using geolocation service
      const location = await geolocationService.getLocationForIP(ip);
      
      res.json({
        success: true,
        location,
        formatted: geolocationService.formatLocation(location),
        flag: geolocationService.getCountryFlag(location.countryCode),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      res.status(500).json({ 
        message: "Failed to get location data",
        success: false
      });
    }
  });

  app.post("/api/geolocation/bulk", async (req, res) => {
    try {
      const { ips } = req.body;
      
      if (!Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({ 
          message: "Array of IP addresses is required",
          example: { ips: ["192.168.1.1", "8.8.8.8"] }
        });
      }

      // Limit to 50 IPs per request to prevent abuse
      if (ips.length > 50) {
        return res.status(400).json({ 
          message: "Maximum 50 IP addresses allowed per request"
        });
      }

      // Get location data for all IPs
      const locations = await geolocationService.getLocationsForIPs(ips);
      
      // Format response
      const results = Array.from(locations.entries()).map(([ip, location]) => ({
        ip,
        location,
        formatted: geolocationService.formatLocation(location),
        flag: geolocationService.getCountryFlag(location.countryCode)
      }));
      
      res.json({
        success: true,
        results,
        total: results.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Bulk geolocation error:', error);
      res.status(500).json({ 
        message: "Failed to get bulk location data",
        success: false
      });
    }
  });

  app.get("/api/geolocation/stats", async (req, res) => {
    try {
      const stats = geolocationService.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Geolocation stats error:', error);
      res.status(500).json({ 
        message: "Failed to get geolocation stats",
        success: false
      });
    }
  });

  // Enhanced user endpoints with location data
  app.get("/api/users/with-locations", async (req, res) => {
    try {
      const { role, isActive, isBanned, search } = req.query;
      const filters = {
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isBanned: isBanned === 'true' ? true : isBanned === 'false' ? false : undefined,
        search: search as string,
      };
      
      // Get users
      const users = await storage.getUsersWithFilters(filters);
      
      // Extract unique IP addresses
      const loginIPs = users
        .map(user => user.lastLoginIp)
        .filter(ip => ip && ip !== '::1' && ip !== '127.0.0.1');
      
      const registrationIPs = users
        .map(user => user.registrationIp)
        .filter(ip => ip && ip !== '::1' && ip !== '127.0.0.1');
      
      const allIPs = [...new Set([...loginIPs, ...registrationIPs])];
      
      // Get location data for all unique IPs
      const locations = allIPs.length > 0 
        ? await geolocationService.getLocationsForIPs(allIPs)
        : new Map();
      
      // Enhanced users with location data
      const usersWithLocations = users.map(user => ({
        ...user,
        locationData: {
          lastLogin: user.lastLoginIp ? {
            ip: user.lastLoginIp,
            location: locations.get(user.lastLoginIp),
            formatted: locations.get(user.lastLoginIp) 
              ? geolocationService.formatLocation(locations.get(user.lastLoginIp)!)
              : 'Unknown',
            flag: locations.get(user.lastLoginIp)
              ? geolocationService.getCountryFlag(locations.get(user.lastLoginIp)!.countryCode)
              : '🌍'
          } : null,
          registration: user.registrationIp ? {
            ip: user.registrationIp,
            location: locations.get(user.registrationIp),
            formatted: locations.get(user.registrationIp)
              ? geolocationService.formatLocation(locations.get(user.registrationIp)!)
              : 'Unknown',
            flag: locations.get(user.registrationIp)
              ? geolocationService.getCountryFlag(locations.get(user.registrationIp)!.countryCode)
              : '🌍'
          } : null
        }
      }));
      
      res.json(usersWithLocations);
    } catch (error) {
      console.error('Users with locations error:', error);
      res.status(500).json({ message: "Failed to fetch users with location data" });
    }
  });

  // Authentication routes
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Generate verification code
      const code = generateVerificationCode();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store code temporarily
      verificationCodes.set(email, { code, expires });

      // Send email
      const emailSent = await emailService.sendAuthenticationCode(email, code);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification code" });
      }

      res.json({ 
        message: "Verification code sent successfully",
        success: true
      });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      // Check if code exists and hasn't expired
      const storedData = verificationCodes.get(email);
      if (!storedData) {
        return res.status(400).json({ message: "No verification code found for this email" });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(email);
        return res.status(400).json({ message: "Verification code has expired" });
      }

      if (storedData.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Code is valid, remove it
      verificationCodes.delete(email);

      // Extract username from email (simple approach)
      const username = email.split('@')[0];

      // Try to find existing user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email,
          username,
          firstName: null,
          lastName: null,
          role: 'user',
          isActive: true,
        });
      }

      res.json({ 
        message: "Authentication successful",
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Clean up expired codes periodically
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(verificationCodes.entries());
    for (const [email, data] of entries) {
      if (now > data.expires) {
        verificationCodes.delete(email);
      }
    }
  }, 5 * 60 * 1000); // Clean up every 5 minutes

  // ==================== ENHANCED AUTHENTICATION ROUTES ====================
  
  // Register with email/password
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, username, firstName, lastName, recaptchaToken } = req.body;
      
      // Debug: Log the incoming request body (without password for security)
      console.log('Registration request body:', {
        email,
        firstName,
        lastName,
        username,
        hasPassword: !!password,
        hasRecaptcha: !!recaptchaToken
      });
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }
      
      // Validate first and last name for signup
      if (!firstName || !lastName) {
        console.log('Missing name fields:', { firstName, lastName });
        return res.status(400).json({ success: false, message: "First name and last name are required" });
      }
      
      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      
      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ success: false, message: passwordValidation.errors[0] });
      }
      
      // Log reCAPTCHA token presence (without logging the actual token for security)
      console.log('Registration with reCAPTCHA:', recaptchaToken ? 'Token present' : 'No token');
      
      const result = await authService.register(
        email, 
        password, 
        firstName,
        lastName,
        req.ip,
        req.get('User-Agent')
      );
      
      res.json(result);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, recaptchaToken } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }
      
      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      
      // Log reCAPTCHA token presence (without logging the actual token for security)
      console.log('Login with reCAPTCHA:', recaptchaToken ? 'Token present' : 'No token');
      
      const result = await authService.login(
        email, 
        password, 
        req.ip, 
        req.get('User-Agent')
      );
      
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  // Google OAuth initiate flow
  app.get("/api/auth/google/start", (req, res) => {
    try {
      console.log('🚀 Starting Google OAuth flow...');
      
      // Determine the correct redirect URI based on environment
      const redirectUri = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000/api/auth/google/callback'
        : `https://${process.env.REPL_SLUG || 'app'}.replit.app/api/auth/google/callback`;
      
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account'
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      console.log('🔗 Redirecting to Google OAuth:', authUrl);
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('❌ OAuth start error:', error);
      res.status(500).json({ success: false, message: 'Failed to start OAuth flow' });
    }
  });

  // OAuth Google callback - handles the authorization code from Google
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, error } = req.query;
      
      console.log('🔍 Google OAuth callback received:', { code: code ? 'present' : 'missing', error });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        return res.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `https://${process.env.REPL_SLUG || 'app'}.replit.app`}?error=oauth_error&message=${encodeURIComponent(error as string)}`);
      }
      
      if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : `https://${process.env.REPL_SLUG || 'app'}.replit.app`}?error=oauth_error&message=No+authorization+code+received`);
      }
      
      // Exchange authorization code for tokens
      const googleUser = await exchangeCodeForUserInfo(code as string);
      
      // Process OAuth login through existing auth service
      const result = await authService.oauthLogin(
        'google',
        googleUser.id,
        googleUser.email,
        googleUser.given_name,
        googleUser.family_name,
        googleUser.picture,
        req.ip,
        req.get('User-Agent')
      );
      
      if (result.success && result.accessToken) {
        console.log('✅ Google OAuth login successful');
        
        // Set session cookie with JWT token
        res.cookie('session', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Send HTML page that notifies parent window and closes popup
        res.setHeader("Content-Type", "text/html");
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #f5f5f5; 
                }
                .success { color: #4CAF50; }
              </style>
            </head>
            <body>
              <div class="success">
                <h2>✅ Authentication Successful!</h2>
                <p>You can close this window.</p>
              </div>
              <script>
                // Notify parent window and close popup
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    user: ${JSON.stringify(googleUser)}
                  }, window.location.origin);
                }
                setTimeout(() => window.close(), 1000);
              </script>
            </body>
          </html>
        `);
      } else {
        console.error('❌ OAuth login failed:', result.message);
        
        // Send HTML page that notifies parent window of error
        res.setHeader("Content-Type", "text/html");
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Authentication Failed</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #f5f5f5; 
                }
                .error { color: #f44336; }
              </style>
            </head>
            <body>
              <div class="error">
                <h2>❌ Authentication Failed</h2>
                <p>${result.message || 'Login failed'}</p>
                <p>You can close this window and try again.</p>
              </div>
              <script>
                // Notify parent window of error
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_ERROR',
                    error: '${result.message || 'Login failed'}'
                  }, window.location.origin);
                }
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      
      // Send HTML page that notifies parent window of error
      res.setHeader("Content-Type", "text/html");
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f5f5f5; 
              }
              .error { color: #f44336; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Authentication Error</h2>
              <p>An unexpected error occurred during authentication.</p>
              <p>You can close this window and try again.</p>
            </div>
            <script>
              // Notify parent window of error
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_ERROR',
                  error: 'Authentication failed. Please try again.'
                }, window.location.origin);
              }
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  });

  // OAuth Google login (legacy endpoint for direct user data)
  app.post("/api/auth/oauth/google", async (req, res) => {
    try {
      const { email, googleId, firstName, lastName, profileImage, recaptchaToken } = req.body;
      
      // Log reCAPTCHA token presence (without logging the actual token for security)
      console.log('Google OAuth with reCAPTCHA:', recaptchaToken ? 'Token present' : 'No token');
      
      const result = await authService.oauthLogin(
        'google',
        googleId,
        email,
        firstName,
        lastName,
        profileImage,
        req.ip,
        req.get('User-Agent')
      );
      
      res.json(result);
    } catch (error) {
      console.error("OAuth login error:", error);
      res.status(500).json({ success: false, message: "OAuth login failed" });
    }
  });

  // Verify email
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      res.json(result);
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ success: false, message: "Email verification failed" });
    }
  });

  // Request password reset
  app.post("/api/auth/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      const result = await authService.requestPasswordReset(
        email, 
        req.ip, 
        req.get('User-Agent')
      );
      
      res.json(result);
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ success: false, message: "Password reset request failed" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ success: false, message: "Password reset failed" });
    }
  });

  // Verify token and get user
  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      const { token } = req.body;
      const result = await authService.verifyToken(token);
      res.json(result);
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ valid: false, message: "Token verification failed" });
    }
  });

  // Refresh token
  app.post("/api/auth/refresh-token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ success: false, message: "Token refresh failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const { token } = req.body;
      const result = await authService.logout(token);
      res.json(result);
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ success: false, message: "Logout failed" });
    }
  });

  // Logout all sessions
  app.post("/api/auth/logout-all", async (req, res) => {
    try {
      const { userId } = req.body;
      const result = await authService.logoutAll(userId);
      res.json(result);
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({ success: false, message: "Logout all failed" });
    }
  });

  // ==================== END ENHANCED AUTHENTICATION ====================

  // ==================== ADMIN AUTHENTICATION ROUTES (TOKEN-ONLY) ====================
  
  // Admin login - completely cookie-free authentication
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required for admin access" 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid email format" 
        });
      }
      
      // Use new token-only admin auth service
      const result = await tokenAdminAuth.login(email, password);
      
      // Return token in response body only (no cookies)
      res.json(result);
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Admin authentication system error" 
      });
    }
  });
  
  // Admin token verification (token-only)
  app.get("/api/admin/auth/verify", async (req, res) => {
    try {
      // Extract token from Authorization header only
      const token = tokenAdminAuth.extractTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({
          valid: false,
          message: "No admin token provided"
        });
      }
      
      const verification = await tokenAdminAuth.verifyToken(token);
      
      if (verification.valid) {
        res.json({
          valid: true,
          user: verification.user,
          message: "Admin token valid"
        });
      } else {
        res.status(401).json({
          valid: false,
          expired: verification.expired,
          message: verification.expired ? "Admin session expired" : "Invalid admin token"
        });
      }
    } catch (error) {
      console.error("Admin token verification error:", error);
      res.status(500).json({ 
        valid: false, 
        message: "Token verification error" 
      });
    }
  });
  
  // Admin logout (token-only)
  app.post("/api/admin/auth/logout", async (req, res) => {
    try {
      // Token-only logout (client discards token)
      const result = await tokenAdminAuth.logout();
      
      res.json(result);
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Logout system error" 
      });
    }
  });
  
  // Get authorized admin emails (for reference only)
  app.get("/api/admin/auth/authorized-emails", requireNewAdminAuth, async (req, res) => {
    try {
      const emails = adminAuthService.getAuthorizedEmails();
      res.json({
        success: true,
        authorizedEmails: emails,
        message: "Authorized admin emails retrieved"
      });
    } catch (error) {
      console.error("Get authorized emails error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve authorized emails" 
      });
    }
  });
  
  // ==================== TOKEN-ONLY ADMIN AUTHENTICATION ====================
  
  // Token-only admin login
  app.post("/api/admin/token/login", async (req, res) => {
    try {
      const { email, password, recaptchaToken } = req.body;
      
      const result = await tokenAdminAuth.login(email, password);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed"
      });
    }
  });

  // Token verification endpoint
  app.get("/api/admin/token/verify", 
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        console.log('🔍 Route handler: adminUser =', (req as any).adminUser);
        const adminUser = (req as any).adminUser;
        
        if (!adminUser) {
          return res.status(401).json({
            success: false,
            message: "Admin user not found in request"
          });
        }
        
        res.json({
          success: true,
          user: adminUser,
          message: "Admin authenticated successfully"
        });
      } catch (error) {
        console.error("Session status error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to retrieve session status"
        });
      }
    }
  );

  // Token-only admin logout (client-side operation)
  app.post("/api/admin/token/logout", async (req, res) => {
    try {
      const result = await tokenAdminAuth.logout();
      res.json(result);
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }
  });

  // ==================== END TOKEN-ONLY ADMIN AUTHENTICATION ====================
  
  // ==================== END ADMIN AUTHENTICATION ====================

  // Email service test endpoint
  app.get("/api/email-test", async (req, res) => {
    try {
      const testResult = await emailService.testConnection();
      res.json({ 
        success: true,
        emailServiceWorking: testResult,
        resendConfigured: !!process.env.RESEND_API_KEY,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailServiceWorking: false,
        resendConfigured: !!process.env.RESEND_API_KEY
      });
    }
  });

  // Audit Log endpoints
  app.get("/api/audit-logs", requireNewAdminAuth, async (req, res) => {
    try {
      const auditLogs = await storage.getAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/:id", requireNewAdminAuth, async (req, res) => {
    try {
      const id = parseId(req.params.id, 'audit log ID');
      const auditLog = await storage.getAuditLog(id);
      if (!auditLog) {
        return res.status(404).json({ message: "Audit log not found" });
      }
      res.json(auditLog);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  // This route is deprecated - use /api/admin/auth/login instead

  // Unified CSV endpoints
  app.get("/api/csv/unified-template", requireNewAdminAuth, async (req, res) => {
    try {
      const { UnifiedCSVService } = await import('./unified-csv-service.js');
      const csvService = new UnifiedCSVService(storage);
      
      const csvContent = await csvService.generateUnifiedTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="brainliest_complete_platform_template.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error('Unified CSV template generation error:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Template generation failed' 
      });
    }
  });

  app.get("/api/csv/unified-export", requireNewAdminAuth, async (req, res) => {
    try {
      const { UnifiedCSVService } = await import('./unified-csv-service.js');
      const csvService = new UnifiedCSVService(storage);
      
      const csvContent = await csvService.exportUnifiedData();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="brainliest_complete_platform_export.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error('Unified CSV export error:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Export failed' 
      });
    }
  });

  app.post("/api/csv/unified-import", requireNewAdminAuth, async (req, res) => {
    try {
      const { UnifiedCSVService } = await import('./unified-csv-service.js');
      const csvService = new UnifiedCSVService(storage);
      
      const csvContent = req.body.csvContent;
      
      if (!csvContent) {
        return res.status(400).json({ 
          success: false, 
          message: 'CSV content is required' 
        });
      }

      const result = await csvService.importUnifiedData(csvContent);
      res.json(result);
    } catch (error) {
      console.error('Unified CSV import error:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Import failed' 
      });
    }
  });

  // CSV Import/Export endpoints
  app.get("/api/csv/template/:entityType", requireNewAdminAuth, async (req, res) => {
    try {
      const { CSVService } = await import('./csv-service');
      const csvService = new CSVService(storage);
      
      const entityType = req.params.entityType as any;
      const csvContent = await csvService.generateTemplate(entityType);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}_template.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('CSV template generation error:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Template generation failed' 
      });
    }
  });

  app.get("/api/csv/export/:entityType", requireNewAdminAuth, async (req, res) => {
    try {
      const { CSVService } = await import('./csv-service');
      const csvService = new CSVService(storage);
      
      const entityType = req.params.entityType as any;
      const includeRelationshipNames = req.query.includeNames === 'true';
      const includeMetadata = req.query.includeMetadata === 'true';
      
      const csvContent = await csvService.exportData(entityType, {
        includeRelationshipNames,
        includeMetadata
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entityType}_export.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Export failed' 
      });
    }
  });

  app.post("/api/csv/import/:entityType", requireNewAdminAuth, async (req, res) => {
    try {
      const { CSVService } = await import('./csv-service');
      const csvService = new CSVService(storage);
      
      const entityType = req.params.entityType as any;
      const csvContent = req.body.csvContent;
      
      if (!csvContent) {
        return res.status(400).json({ 
          success: false, 
          message: 'CSV content is required' 
        });
      }

      const result = await csvService.importData(entityType, csvContent);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Import failed',
        totalRows: 0,
        processedRows: 0,
        createdCount: 0,
        updatedCount: 0,
        deletedCount: 0,
        errors: []
      });
    }
  });

  // Freemium API routes
  app.get("/api/freemium/status", checkFreemiumStatus(), async (req, res) => {
    try {
      const sessionInfo = req.freemiumSession;
      if (!sessionInfo) {
        return res.status(500).json({ error: "Failed to get freemium session info" });
      }
      res.json(sessionInfo);
    } catch (error) {
      console.error('Error fetching freemium status:', error);
      res.status(500).json({ error: "Failed to fetch freemium status" });
    }
  });

  // Statistics API routes
  app.get("/api/stats", async (req, res) => {
    try {
      const [subjectCount, examCount, questionCount] = await Promise.all([
        storage.getSubjectCount(),
        storage.getExamCount(), 
        storage.getQuestionCount()
      ]);

      const stats = {
        subjects: subjectCount,
        exams: examCount,
        questions: questionCount,
        successRate: 95 // This could be calculated from user sessions in the future
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Trending API routes
  app.get("/api/trending/certifications", async (req, res) => {
    try {
      const trending = await trendingService.getTrendingCertifications();
      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending certifications:', error);
      res.status(500).json({ error: "Failed to fetch trending certifications" });
    }
  });

  app.post("/api/tracking/interaction", async (req, res) => {
    try {
      const { subjectId, interactionType, userId, sessionId } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      await trendingService.trackInteraction({
        subjectId,
        interactionType,
        userId,
        sessionId,
        ipAddress,
        userAgent,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking interaction:', error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  });

  // SEO API routes
  app.post("/api/seo/generate", async (req, res) => {
    try {
      const { type, title, description, content, url, category, subject } = req.body;
      
      const seoData = await seoService.generatePageSEO({
        type,
        title,
        description,
        content,
        url,
        category,
        subject
      });
      
      res.json(seoData);
    } catch (error) {
      console.error('SEO generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate SEO data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/seo/faqs", async (req, res) => {
    try {
      const { text, options, explanation, subject, category } = req.body;
      
      const faqs = await seoService.generateQuestionFAQs({
        text,
        options,
        explanation,
        subject,
        category
      });
      
      res.json(faqs);
    } catch (error) {
      console.error('FAQ generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate FAQs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/seo/structured-data", async (req, res) => {
    try {
      const { question, faqs, type = 'question' } = req.body;
      
      let structuredData = [];
      
      if (type === 'question' && question) {
        structuredData = seoService.generateQuestionStructuredData(question, faqs || []);
      } else if (type === 'category') {
        structuredData = seoService.generateCategoryStructuredData(req.body.category);
      } else if (type === 'breadcrumbs') {
        structuredData = [seoService.generateBreadcrumbStructuredData(req.body.breadcrumbs)];
      }
      
      res.json(structuredData);
    } catch (error) {
      console.error('Structured data generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate structured data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/seo/keywords", async (req, res) => {
    try {
      const { name, description, category } = req.body;
      
      const keywords = await seoService.generateSubjectKeywords({
        name,
        description,
        category
      });
      
      res.json(keywords);
    } catch (error) {
      console.error('Keyword generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate keywords',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Sitemap generation endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      const exams = await storage.getExams();
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://brainliest.com' 
        : `http://localhost:${process.env.PORT || 5000}`;
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/subjects</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add subject pages
      subjects.forEach(subject => {
        sitemap += `
  <url>
    <loc>${baseUrl}/subject/${subject.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      // Add exam pages
      exams.forEach(exam => {
        sitemap += `
  <url>
    <loc>${baseUrl}/exam/${exam.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

      // Add static pages
      const staticPages = ['/analytics', '/contact', '/terms', '/privacy', '/our-story'];
      staticPages.forEach(page => {
        sitemap += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
      });

      sitemap += '\n</urlset>';

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
