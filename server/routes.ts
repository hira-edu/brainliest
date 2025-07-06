import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyticsService } from "./analytics";
import { getQuestionHelp, explainAnswer } from "./ai";
import { 
  insertSubjectSchema, 
  insertExamSchema, 
  insertQuestionSchema,
  insertUserSessionSchema,
  insertCommentSchema,
  insertDetailedAnswerSchema,
  insertExamAnalyticsSchema,
  insertUserSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const id = parseInt(req.params.id);
      const subject = await storage.getSubject(id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
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
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
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
      const id = parseInt(req.params.id);
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", async (req, res) => {
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
  app.get("/api/questions", async (req, res) => {
    try {
      const examId = req.query.examId ? parseInt(req.query.examId as string) : undefined;
      const questions = examId 
        ? await storage.getQuestionsByExam(examId)
        : await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
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

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete("/api/questions/all", async (req, res) => {
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

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuestion(id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Bulk question operations for CSV import
  app.post("/api/questions/bulk", async (req, res) => {
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

  app.delete("/api/questions/all", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      let deletedCount = 0;
      
      for (const question of questions) {
        const success = await storage.deleteQuestion(question.id);
        if (success) deletedCount++;
      }

      res.json({ 
        message: `Successfully deleted ${deletedCount} questions`,
        deleted: deletedCount,
        total: questions.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete all questions" });
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
      const validation = insertUserSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid session data", errors: validation.error.errors });
      }
      const session = await storage.createUserSession(validation.data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getUserSession(id);
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
      const id = parseInt(req.params.id);
      const validation = insertUserSessionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid session data", errors: validation.error.errors });
      }
      const session = await storage.updateUserSession(id, validation.data);
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
      const questionId = req.query.questionId ? parseInt(req.query.questionId as string) : undefined;
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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

  const httpServer = createServer(app);
  return httpServer;
}
