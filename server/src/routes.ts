import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyticsService } from "./services/analytics";
import { getQuestionHelp, explainAnswer } from "./services/ai";
import { emailService } from "./services/email-service";
import { authService } from "./services/auth-service";
import { adminAuthService } from "./services/admin-auth-service";
import { adminUserService } from "./services/admin-user-management";
import { tokenAdminAuth } from "./services/token-admin-auth";
import { extractClientInfo } from "./middleware/admin-auth";
import {
  enforceFreemiumLimit,
  recordFreemiumQuestionView,
  checkFreemiumStatus,
} from "./middleware/freemium";
import { seoService } from "./services/seo-service";
import { recaptchaService } from "./services/recaptcha-service";
import { trendingService } from "./services/trending-service";
import { sitemapService } from "./services/sitemap-service";
import { geolocationService } from "./services/geolocation-service";
import {
  parseId,
  parseOptionalId,
  parseOptionalUUID,
  sanitizeString,
  validatePassword,
} from "./security/input-sanitizer";
import { z } from "zod";
import { validateEmail } from "./services/auth-service";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { logAdminAction } from "./middleware/auth";
import {
  insertSubjectSchema,
  insertExamSchema,
  insertQuestionSchema,
  insertExamSessionSchema,
  insertCommentSchema,
  insertDetailedAnswerSchema,
  insertExamAnalyticsSchema,
  insertUserSchema,
  insertCategorySchema,
  insertSubcategorySchema,
  insertUploadSchema,
} from "../../shared/schema";

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
declare module "express" {
  interface Request {
    adminSession?: import("./services/enterprise-admin-session-manager").AdminSession;
    sessionId?: string;
  }
}

// Exchange authorization code for user information
async function exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo> {
  try {
    console.log("🔄 Exchanging OAuth code for tokens...");

    // Determine the correct redirect URI based on environment
    const redirectUri =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000/api/auth/google/callback"
        : `https://${
            process.env.REPL_SLUG || "app"
          }.replit.app/api/auth/google/callback`;

    console.log("🔗 Using redirect URI:", redirectUri);

    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Token exchange failed:", errorText);
      throw new Error(
        `Token exchange failed: ${tokenResponse.status} - ${errorText}`
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();
    console.log("✅ Tokens received successfully");

    // Step 2: Get user info using access token
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error("❌ User info fetch failed:", userResponse.status);
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    const userInfo: GoogleUserInfo = await userResponse.json();
    console.log("✅ User info retrieved:", {
      email: userInfo.email,
      name: userInfo.name,
    });

    return userInfo;
  } catch (error) {
    console.error("❌ OAuth code exchange error:", error);
    throw new Error("Failed to authenticate with Google");
  }
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * API Routes Configuration for Brainliest Platform
 *
 * Route Structure:
 * - /api/auth/* - Authentication endpoints (login, register, OAuth)
 * - /api/admin/* - Admin panel endpoints with token verification
 * - /api/subjects/* - Subject management (slug-based routing)
 * - /api/exams/* - Exam management (slug-based routing)
 * - /api/questions/* - Question management (ID-based routing for cards)
 * - /api/categories/* - Category management (slug-based routing)
 * - /api/subcategories/* - Subcategory management (slug-based routing)
 * - /api/analytics/* - Analytics and performance tracking
 * - /api/trending/* - Trending subjects and certifications
 * - /api/sitemap/* - SEO sitemap generation
 * - /api/stats/* - Platform statistics
 *
 * Navigation Logic:
 * - Subjects/Exams/Categories: Use slug-based routing for SEO optimization
 * - Questions: Use ID-based routing for question cards and navigation
 * - All admin routes require proper JWT token verification
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Freemium status endpoint - FIXED: Removed duplicate from line 2324

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection by fetching one subject
      await storage.getSubjects();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        version: "1.0.0",
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "Database connection failed",
      });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post(
    "/api/categories",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const validation = insertCategorySchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid category data",
            errors: validation.error.errors,
          });
        }
        const category = await storage.createCategory(validation.data);
        res.status(201).json(category);
      } catch (error) {
        console.error("Failed to create category:", error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  );

  app.put(
    "/api/categories/:slug",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug as string);
        const validation = insertCategorySchema.partial().safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid category data",
            errors: validation.error.errors,
          });
        }
        const category = await storage.updateCategory(slug, validation.data);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
      } catch (error) {
        console.error("Failed to update category:", error);
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  );

  app.delete(
    "/api/categories/:slug",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug as string);
        const deleted = await storage.deleteCategory(slug);
        if (!deleted) {
          return res.status(404).json({ message: "Category not found" });
        }
        res.status(204).send();
      } catch (error) {
        console.error("Failed to delete category:", error);
        res.status(500).json({ message: "Failed to delete category" });
      }
    }
  );

  // Subcategory routes
  app.get("/api/subcategories", async (req, res) => {
    try {
      const subcategories = await storage.getSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error("Failed to fetch subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  // Get subcategory by slug
  app.get("/api/subcategories/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const subcategory = await storage.getSubcategory(slug);
      if (!subcategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      res.status(500).json({ error: "Failed to fetch subcategory" });
    }
  });

  app.post(
    "/api/subcategories",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const validation = insertSubcategorySchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid subcategory data",
            errors: validation.error.errors,
          });
        }
        const subcategory = await storage.createSubcategory(validation.data);
        res.status(201).json(subcategory);
      } catch (error) {
        console.error("Failed to create subcategory:", error);
        res.status(500).json({ message: "Failed to create subcategory" });
      }
    }
  );

  app.put(
    "/api/subcategories/:slug",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug as string);
        const validation = insertSubcategorySchema
          .partial()
          .safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid subcategory data",
            errors: validation.error.errors,
          });
        }
        const subcategory = await storage.updateSubcategory(
          slug,
          validation.data
        );
        if (!subcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }
        res.json(subcategory);
      } catch (error) {
        console.error("Failed to update subcategory:", error);
        res.status(500).json({ message: "Failed to update subcategory" });
      }
    }
  );

  app.delete(
    "/api/subcategories/:slug",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug as string);
        const deleted = await storage.deleteSubcategory(slug);
        if (!deleted) {
          return res.status(404).json({ message: "Subcategory not found" });
        }
        res.status(204).send();
      } catch (error) {
        console.error("Failed to delete subcategory:", error);
        res.status(500).json({ message: "Failed to delete subcategory" });
      }
    }
  );

  // Admin relationship management - assign subcategory to category
  app.post(
    "/api/admin/relationships/subcategory-to-category",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { subcategorySlug, categorySlug } = req.body;

        if (!subcategorySlug || !categorySlug) {
          return res.status(400).json({
            message: "Both subcategorySlug and categorySlug are required",
          });
        }

        // Verify both exist
        const subcategory = await storage.getSubcategory(subcategorySlug);
        const category = await storage.getCategory(categorySlug);

        if (!subcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }

        // Update the subcategory's category relationship
        const updatedSubcategory = await storage.updateSubcategory(
          subcategorySlug,
          {
            categorySlug: categorySlug,
          }
        );

        res.json({
          success: true,
          message: "Subcategory assigned to category successfully",
          subcategory: updatedSubcategory,
        });
      } catch (error) {
        console.error("Error assigning subcategory to category:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin relationship management - assign subject to category/subcategory
  app.post(
    "/api/admin/relationships/subject-to-category",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { subjectSlug, categorySlug, subcategorySlug } = req.body;

        if (!subjectSlug || (!categorySlug && !subcategorySlug)) {
          return res.status(400).json({
            message:
              "subjectSlug and either categorySlug or subcategorySlug are required",
          });
        }

        // Verify subject exists
        const subject = await storage.getSubject(subjectSlug);
        if (!subject) {
          return res.status(404).json({ message: "Subject not found" });
        }

        // Verify category/subcategory exists
        if (categorySlug) {
          const category = await storage.getCategory(categorySlug);
          if (!category) {
            return res.status(404).json({ message: "Category not found" });
          }
        }

        if (subcategorySlug) {
          const subcategory = await storage.getSubcategory(subcategorySlug);
          if (!subcategory) {
            return res.status(404).json({ message: "Subcategory not found" });
          }
        }

        // Update the subject's category/subcategory relationship
        const updatedSubject = await storage.updateSubject(subjectSlug, {
          categorySlug: categorySlug || null,
          subcategorySlug: subcategorySlug || null,
        });

        res.json({
          success: true,
          message: "Subject assigned to category/subcategory successfully",
          subject: updatedSubject,
        });
      } catch (error) {
        console.error(
          "Error assigning subject to category/subcategory:",
          error
        );
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin relationship management - assign exam to subject
  app.post(
    "/api/admin/relationships/exam-to-subject",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { examSlug, subjectSlug } = req.body;

        if (!examSlug || !subjectSlug) {
          return res
            .status(400)
            .json({ message: "Both examSlug and subjectSlug are required" });
        }

        // Verify both exist
        const exam = await storage.getExam(examSlug);
        const subject = await storage.getSubject(subjectSlug);

        if (!exam) {
          return res.status(404).json({ message: "Exam not found" });
        }
        if (!subject) {
          return res.status(404).json({ message: "Subject not found" });
        }

        // Update the exam's subject relationship
        const updatedExam = await storage.updateExam(examSlug, {
          subjectSlug: subjectSlug,
        });

        res.json({
          success: true,
          message: "Exam assigned to subject successfully",
          exam: updatedExam,
        });
      } catch (error) {
        console.error("Error assigning exam to subject:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get hierarchical relationships overview
  app.get(
    "/api/admin/relationships/overview",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const categories = await storage.getCategories();
        const subcategories = await storage.getSubcategories();
        const subjects = await storage.getSubjects();
        const exams = await storage.getExams();

        // Build hierarchical structure
        const hierarchicalData = categories.map((category) => ({
          ...category,
          subcategories: subcategories
            .filter((sub) => sub.categorySlug === category.slug)
            .map((subcategory) => ({
              ...subcategory,
              subjects: subjects
                .filter((subj) => subj.subcategorySlug === subcategory.slug)
                .map((subject) => ({
                  ...subject,
                  exams: exams.filter(
                    (exam) => exam.subjectSlug === subject.slug
                  ),
                })),
            })),
          directSubjects: subjects
            .filter(
              (subj) =>
                subj.categorySlug === category.slug && !subj.subcategorySlug
            )
            .map((subject) => ({
              ...subject,
              exams: exams.filter((exam) => exam.subjectSlug === subject.slug),
            })),
        }));

        res.json({
          hierarchicalData,
          counts: {
            categories: categories.length,
            subcategories: subcategories.length,
            subjects: subjects.length,
            exams: exams.length,
          },
        });
      } catch (error) {
        console.error("Error fetching relationship overview:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Subject routes - specific routes first to prevent shadowing
  // Subject slug-based route
  app.get("/api/subjects/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug || typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid subject slug" });
      }
      const subject = await storage.getSubjectBySlug(slug);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // New backend slug-based route: /api/subjects/by-slug/:slug
  app.get("/api/subjects/by-slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug || typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid subject slug" });
      }
      const subject = await storage.getSubjectBySlug(slug);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.get("/api/subjects", async (req, res) => {
    try {
      const subcategorySlug = req.query.subcategorySlug as string;
      const subjects = subcategorySlug
        ? await storage
            .getSubjects()
            .then((subjects) =>
              subjects.filter((s) => s.subcategorySlug === subcategorySlug)
            )
        : await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, "subject ID");
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

  app.post(
    "/api/subjects",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const validation = insertSubjectSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid subject data",
            errors: validation.error.errors,
          });
        }
        const subject = await storage.createSubject(validation.data);
        res.status(201).json(subject);
      } catch (error) {
        res.status(500).json({ message: "Failed to create subject" });
      }
    }
  );

  app.put(
    "/api/subjects/:id",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const id = parseId(req.params.id, "subject ID");
        if (isNaN(id) || id <= 0) {
          return res.status(400).json({ message: "Invalid subject ID" });
        }
        const validation = insertSubjectSchema.partial().safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid subject data",
            errors: validation.error.errors,
          });
        }
        const subject = await storage.updateSubject(id, validation.data);
        if (!subject) {
          return res.status(404).json({ message: "Subject not found" });
        }
        res.json(subject);
      } catch (error) {
        res.status(500).json({ message: "Failed to update subject" });
      }
    }
  );

  // Exam routes with dynamic question counts
  app.get("/api/exams", async (req, res) => {
    try {
      const subjectSlug = req.query.subjectSlug as string;
      const exams = subjectSlug
        ? await storage.getExamsBySubject(subjectSlug)
        : await storage.getExams();

      // CRITICAL FIX: Add dynamic question counts to all exams
      console.log(`Fetching question counts for ${exams.length} exams...`);
      const examsWithCounts = await Promise.all(
        exams.map(async (exam) => {
          const actualQuestionCount = await storage.getQuestionCountByExam(
            exam.slug
          );
          console.log(`Exam ${exam.slug}: ${actualQuestionCount} questions`);
          return {
            ...exam,
            questionCount: actualQuestionCount,
          };
        })
      );

      console.log(
        `Returning ${examsWithCounts.length} exams with updated question counts`
      );
      res.json(examsWithCounts);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  // Get exams by subcategory
  app.get("/api/exams/subcategory/:subcategorySlug", async (req, res) => {
    try {
      const { subcategorySlug } = req.params;
      const exams = await storage.getExamsBySubcategory(subcategorySlug);
      // Dynamically calculate question count for each exam
      const examsWithQuestionCount = await Promise.all(
        exams.map(async (exam) => {
          const actualQuestionCount = await storage.getQuestionCountByExam(
            exam.slug
          );
          return {
            ...exam,
            questionCount: actualQuestionCount,
          };
        })
      );
      res.json(examsWithQuestionCount);
    } catch (error) {
      console.error("Error fetching exams by subcategory:", error);
      res.status(500).json({ error: "Failed to fetch exams by subcategory" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, "exam ID");
      const exam = await storage.getExamById(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Count actual questions dynamically
      const actualQuestionCount = await storage.getQuestionCountByExamId(id);

      res.json({
        ...exam,
        questionCount: actualQuestionCount,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  // Exam slug-based route
  app.get("/api/exams/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug || typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid exam slug" });
      }
      const exam = await storage.getExamBySlug(slug);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  // New backend slug-based route: /api/exams/by-slug/:slug with dynamic question count
  app.get("/api/exams/by-slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      if (!slug || typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid exam slug" });
      }
      const exam = await storage.getExamBySlug(slug);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Count actual questions dynamically
      const actualQuestionCount = await storage.getQuestionCountByExam(slug);

      res.json({
        ...exam,
        questionCount: actualQuestionCount,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post(
    "/api/exams",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const validation = insertExamSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid exam data",
            errors: validation.error.errors,
          });
        }
        const exam = await storage.createExam(validation.data);
        res.status(201).json(exam);
      } catch (error) {
        res.status(500).json({ message: "Failed to create exam" });
      }
    }
  );

  // Question routes
  app.get("/api/questions", checkFreemiumStatus(), async (req, res) => {
    try {
      // Schema-first validation for query parameters
      const querySchema = z
        .object({
          examSlug: z
            .string()
            .regex(
              /^[a-z0-9-]+$/,
              "Exam slug must be lowercase letters, numbers, or hyphens"
            )
            .optional(),
          examId: z
            .string()
            .regex(/^\d+$/, "Exam ID must be a positive integer")
            .optional(),
        })
        .refine((data) => !data.examSlug || !data.examId, {
          message: "Cannot specify both examSlug and examId",
        });

      let validatedQuery;
      try {
        validatedQuery = querySchema.parse(req.query);
      } catch (validationError) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: validationError.errors,
        });
      }

      let questions;
      if (validatedQuery.examSlug) {
        // Schema-validated and sanitized examSlug
        const cleanSlug = sanitizeString(validatedQuery.examSlug);
        questions = await storage.getQuestionsByExam(cleanSlug);
      } else if (validatedQuery.examId) {
        // Legacy support for examId with validation
        const examId = parseId(validatedQuery.examId);
        questions = await storage.getQuestionsByExam(examId.toString());
      } else {
        // No filter, return all questions
        questions = await storage.getQuestions();
      }

      // Add freemium session info to response for frontend
      const responseData = {
        questions,
        freemiumSession: req.freemiumSession,
      };

      res.json(responseData);
    } catch (error) {
      console.error("Questions API error:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get(
    "/api/questions/:id",
    enforceFreemiumLimit(),
    recordFreemiumQuestionView(),
    async (req, res) => {
      try {
        const id = parseId(req.params.id, "question ID");
        const question = await storage.getQuestion(id);
        if (!question) {
          return res.status(404).json({ message: "Question not found" });
        }

        // Add freemium session info to response
        const responseData = {
          ...question,
          freemiumSession: req.freemiumSession,
        };

        res.json(responseData);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch question" });
      }
    }
  );

  app.post(
    "/api/questions",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const validation = insertQuestionSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid question data",
            errors: validation.error.errors,
          });
        }
        const question = await storage.createQuestion(validation.data);
        res.status(201).json(question);
      } catch (error) {
        res.status(500).json({ message: "Failed to create question" });
      }
    }
  );

  app.put(
    "/api/questions/:id",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const id = parseId(req.params.id, "question ID");
        const validation = insertQuestionSchema.partial().safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            message: "Invalid question data",
            errors: validation.error.errors,
          });
        }
        const question = await storage.updateQuestion(id, validation.data);
        if (!question) {
          return res.status(404).json({ message: "Question not found" });
        }
        res.json(question);
      } catch (error) {
        res.status(500).json({ message: "Failed to update question" });
      }
    }
  );

  app.delete(
    "/api/questions/all",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const questions = await storage.getQuestions();
        for (const question of questions) {
          await storage.deleteQuestion(question.id);
        }
        res.json({
          message: "All questions deleted successfully",
          count: questions.length,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete all questions" });
      }
    }
  );

  app.delete(
    "/api/questions/:id",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
      try {
        const id = parseId(req.params.id, "question ID");
        const deleted = await storage.deleteQuestion(id);
        if (!deleted) {
          return res.status(404).json({ message: "Question not found" });
        }
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete question" });
      }
    }
  );

  // Bulk question operations for CSV import - ADMIN PROTECTED
  app.post(
    "/api/questions/bulk",
    tokenAdminAuth.createAuthMiddleware(),
    logAdminAction,
    async (req, res) => {
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
          total: questions.length,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to import questions" });
      }
    }
  );

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
      const performanceTrends = await analyticsService.getPerformanceTrends(
        userName
      );

      // Calculate additional metrics
      const totalTimeSpent = examAnalytics.reduce(
        (sum, exam) => sum + (exam.timeSpent || 0),
        0
      );
      const averageTimePerQuestion =
        answerHistory.length > 0 ? totalTimeSpent / answerHistory.length : 0;

      // Calculate accuracy by difficulty
      const difficultyAnalysis = answerHistory.reduce((acc, answer) => {
        const difficulty = answer.difficulty || "Unknown";
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
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.post("/api/analytics/record-answer", async (req, res) => {
    try {
      const validation = insertDetailedAnswerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid answer data",
          errors: validation.error.errors,
        });
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
        return res.status(400).json({
          message: "Invalid exam analytics data",
          errors: validation.error.errors,
        });
      }
      const analytics = await analyticsService.createExamAnalytics(
        validation.data
      );

      // Update user profile
      await analyticsService.createOrUpdateUserProfile(req.body.userName, {
        score: req.body.score,
        totalQuestions: req.body.totalQuestions,
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

  app.get(
    "/api/analytics/study-recommendations/:userName",
    async (req, res) => {
      try {
        const { userName } = req.params;
        const recommendations = await analyticsService.getStudyRecommendations(
          userName
        );
        res.json(recommendations);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch study recommendations" });
      }
    }
  );

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
        timestamp: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Contact form submitted successfully",
        id: Math.random().toString(36).substr(2, 9), // Generate simple ID
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
        return res.status(400).json({
          message: "Invalid session data",
          errors: validation.error.errors,
        });
      }
      const session = await storage.createExamSession(validation.data);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, "session ID");
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
      const id = parseId(req.params.id, "session ID");
      const validation = insertExamSessionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid session data",
          errors: validation.error.errors,
        });
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
      const questionId = parseOptionalUUID(req.query.questionId as string);
      const comments = questionId
        ? await storage.getCommentsByQuestion(questionId)
        : await storage.getComments();
      res.json(comments);
    } catch (error) {
      console.error("Comments API error:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validation = insertCommentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid comment data",
          errors: validation.error.errors,
        });
      }
      const comment = await storage.createComment(validation.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, "comment ID");
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

      const help = await getQuestionHelp(
        question.text,
        question.options,
        subjectName
      );
      res.json({ help });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI help" });
    }
  });

  app.post("/api/ai/explain-answer", async (req, res) => {
    try {
      const { questionId, userAnswer } = req.body;
      console.log(
        `AI explanation request for question ${questionId}, user answer: ${userAnswer}`
      );

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Get subject by slug (not ID)
      const subject = await storage.getSubjectBySlug(question.subjectSlug);
      const subjectName = subject?.name || "certification";

      console.log(`Generating explanation for ${subjectName} question`);

      const explanation = await explainAnswer(
        question.text,
        question.options,
        question.correctAnswer,
        userAnswer,
        subjectName
      );

      console.log(`Generated explanation: ${explanation.substring(0, 100)}...`);
      res.json({ explanation });
    } catch (error) {
      console.error("AI explanation error:", error);
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
        website: "https://johndoe.com",
      };
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/settings/profile", async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        bio,
        location,
        dateOfBirth,
        website,
      } = req.body;

      // Here you would update the user profile in the database
      res.json({
        message: "Profile updated successfully",
        success: true,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/settings/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters long" });
      }

      // Here you would verify current password and update to new password
      res.json({
        message: "Password changed successfully",
        success: true,
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
        practiceReminders: true,
      };
      res.json(notifications);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/settings/notifications", async (req, res) => {
    try {
      // Here you would update notification preferences in the database
      res.json({
        message: "Notification settings updated successfully",
        success: true,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update notification settings" });
    }
  });

  app.post("/api/settings/export-data", async (req, res) => {
    try {
      // Here you would generate and send export data
      res.json({
        message:
          "Data export requested. You will receive an email with download link.",
        success: true,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.delete("/api/settings/delete-account", async (req, res) => {
    try {
      // Here you would mark account for deletion
      res.json({
        message:
          "Account deletion requested. Your account will be deleted within 24 hours.",
        success: true,
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
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        isBanned:
          isBanned === "true" ? true : isBanned === "false" ? false : undefined,
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
      const id = parseId(req.params.id, "user ID");
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
        return res.status(400).json({
          message: "Invalid user data",
          errors: validation.error.errors,
        });
      }
      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id, "user ID");
      const validation = insertUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid user data",
          errors: validation.error.errors,
        });
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
      const id = parseId(req.params.id, "user ID");
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
      const id = parseId(req.params.id, "user ID");
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
      const id = parseId(req.params.id, "user ID");
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
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        isBanned:
          isBanned === "true" ? true : isBanned === "false" ? false : undefined,
        search: search as string,
      };

      const users = await storage.getUsersWithFilters(filters);

      // Convert to CSV format
      const csvHeader =
        "ID,Email,Username,First Name,Last Name,Role,Active,Banned,Ban Reason,Last Login,Last Login IP,Registration IP,Created At,Updated At\n";
      const csvRows = users
        .map((user) => {
          const formatDate = (date: Date | null) =>
            date ? date.toISOString() : "";
          return [
            user.id,
            user.email,
            user.username,
            user.firstName || "",
            user.lastName || "",
            user.role,
            user.isActive,
            user.isBanned,
            user.banReason || "",
            formatDate(user.lastLoginAt),
            user.lastLoginIp || "",
            user.registrationIp || "",
            formatDate(user.createdAt),
            formatDate(user.updatedAt),
          ]
            .map((field) => `"${field}"`)
            .join(",");
        })
        .join("\n");

      const csv = csvHeader + csvRows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
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
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Admin authentication required" });
      }

      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(
        token
      );

      if (!valid || !adminUser) {
        return res.status(401).json({ message: "Invalid admin token" });
      }

      // Extract user data from request
      const { email, role, password, firstName, lastName, username } = req.body;

      // Validate required fields
      if (!email || !role || !password) {
        return res.status(400).json({
          message:
            "Missing required fields: email, role, and password are required",
        });
      }

      // Get client IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

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
        message: "User created successfully",
        user: newUser,
      });
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({
        message: error.message || "Failed to create user",
        success: false,
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
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Admin authentication required" });
      }

      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(
        token
      );

      if (!valid || !adminUser) {
        return res.status(401).json({ message: "Invalid admin token" });
      }

      // Get user ID from params
      const userId = parseId(req.params.id, "user ID");

      // Extract update data from request
      const {
        email,
        role,
        password,
        firstName,
        lastName,
        isActive,
        isBanned,
        banReason,
      } = req.body;

      // Get client IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      // Update user via admin service
      const updatedUser = await adminUserService.updateUser(
        userId,
        {
          email,
          role,
          password,
          firstName,
          lastName,
          isActive,
          isBanned,
          banReason,
        },
        adminUser.id,
        adminUser.email,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(500).json({
        message: error.message || "Failed to update user",
        success: false,
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
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Admin authentication required" });
      }

      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(
        token
      );

      if (!valid || !adminUser) {
        return res.status(401).json({ message: "Invalid admin token" });
      }

      // Get user ID from params
      const userId = parseId(req.params.id, "user ID");

      // Get client IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

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
      console.error("Admin delete user error:", error);
      res.status(500).json({
        message: error.message || "Failed to delete user",
        success: false,
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
      if (!authHeader?.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ message: "Admin authentication required" });
      }

      const token = authHeader.substring(7);
      const { valid, user: adminUser } = await adminAuthService.verifyToken(
        token
      );

      if (!valid || !adminUser) {
        return res.status(401).json({ message: "Invalid admin token" });
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
          total: logs.length,
        },
      });
    } catch (error) {
      console.error("Admin audit logs error:", error);
      res.status(500).json({
        message: "Failed to fetch audit logs",
        success: false,
      });
    }
  });

  // Geolocation API endpoints
  app.get("/api/geolocation/ip/:ip", async (req, res) => {
    try {
      const ip = req.params.ip;

      // Validate IP format (basic validation)
      if (!ip || ip === "undefined" || ip === "null") {
        return res.status(400).json({
          message: "Valid IP address is required",
          ip: ip,
        });
      }

      // Get location data using geolocation service
      const location = await geolocationService.getLocationForIP(ip);

      res.json({
        success: true,
        location,
        formatted: geolocationService.formatLocation(location),
        flag: geolocationService.getCountryFlag(location.countryCode),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Geolocation error:", error);
      res.status(500).json({
        message: "Failed to get location data",
        success: false,
      });
    }
  });

  app.post("/api/geolocation/bulk", async (req, res) => {
    try {
      const { ips } = req.body;

      if (!Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({
          message: "Array of IP addresses is required",
          example: { ips: ["192.168.1.1", "8.8.8.8"] },
        });
      }

      // Limit to 50 IPs per request to prevent abuse
      if (ips.length > 50) {
        return res.status(400).json({
          message: "Maximum 50 IP addresses allowed per request",
        });
      }

      // Get location data for all IPs
      const locations = await geolocationService.getLocationsForIPs(ips);

      // Format response
      const results = Array.from(locations.entries()).map(([ip, location]) => ({
        ip,
        location,
        formatted: geolocationService.formatLocation(location),
        flag: geolocationService.getCountryFlag(location.countryCode),
      }));

      res.json({
        success: true,
        results,
        total: results.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Bulk geolocation error:", error);
      res.status(500).json({
        message: "Failed to get bulk location data",
        success: false,
      });
    }
  });

  app.get("/api/geolocation/stats", async (req, res) => {
    try {
      const stats = geolocationService.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Geolocation stats error:", error);
      res.status(500).json({
        message: "Failed to get geolocation stats",
        success: false,
      });
    }
  });

  // Enhanced user endpoints with location data
  app.get("/api/users/with-locations", async (req, res) => {
    try {
      const { role, isActive, isBanned, search } = req.query;
      const filters = {
        role: role as string,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        isBanned:
          isBanned === "true" ? true : isBanned === "false" ? false : undefined,
        search: search as string,
      };

      // Get users
      const users = await storage.getUsersWithFilters(filters);

      // Extract unique IP addresses
      const loginIPs = users
        .map((user) => user.lastLoginIp)
        .filter((ip) => ip && ip !== "::1" && ip !== "127.0.0.1");

      const registrationIPs = users
        .map((user) => user.registrationIp)
        .filter((ip) => ip && ip !== "::1" && ip !== "127.0.0.1");

      const allIPs = [...new Set([...loginIPs, ...registrationIPs])];

      // Get location data for all unique IPs
      const locations =
        allIPs.length > 0
          ? await geolocationService.getLocationsForIPs(allIPs)
          : new Map();

      // Enhanced users with location data
      const usersWithLocations = users.map((user) => ({
        ...user,
        locationData: {
          lastLogin: user.lastLoginIp
            ? {
                ip: user.lastLoginIp,
                location: locations.get(user.lastLoginIp),
                formatted: locations.get(user.lastLoginIp)
                  ? geolocationService.formatLocation(
                      locations.get(user.lastLoginIp)!
                    )
                  : "Unknown",
                flag: locations.get(user.lastLoginIp)
                  ? geolocationService.getCountryFlag(
                      locations.get(user.lastLoginIp)!.countryCode
                    )
                  : "🌍",
              }
            : null,
          registration: user.registrationIp
            ? {
                ip: user.registrationIp,
                location: locations.get(user.registrationIp),
                formatted: locations.get(user.registrationIp)
                  ? geolocationService.formatLocation(
                      locations.get(user.registrationIp)!
                    )
                  : "Unknown",
                flag: locations.get(user.registrationIp)
                  ? geolocationService.getCountryFlag(
                      locations.get(user.registrationIp)!.countryCode
                    )
                  : "🌍",
              }
            : null,
        },
      }));

      res.json(usersWithLocations);
    } catch (error) {
      console.error("Users with locations error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch users with location data" });
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
        return res
          .status(500)
          .json({ message: "Failed to send verification code" });
      }

      res.json({
        message: "Verification code sent successfully",
        success: true,
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
        return res
          .status(400)
          .json({ message: "No verification code found for this email" });
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(email);
        return res
          .status(400)
          .json({ message: "Verification code has expired" });
      }

      if (storedData.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Code is valid, remove it
      verificationCodes.delete(email);

      // Extract username from email (simple approach)
      const username = email.split("@")[0];

      // Try to find existing user
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          email,
          username,
          firstName: null,
          lastName: null,
          role: "user",
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
        },
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
      const { email, password, username, firstName, lastName, recaptchaToken } =
        req.body;

      // Debug: Log the incoming request body (without password for security)
      console.log("Registration request body:", {
        email,
        firstName,
        lastName,
        username,
        hasPassword: !!password,
        hasRecaptcha: !!recaptchaToken,
      });

      // Validate required fields
      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Email and password are required" });
      }

      // Validate first and last name for signup
      if (!firstName || !lastName) {
        console.log("Missing name fields:", { firstName, lastName });
        return res.status(400).json({
          success: false,
          message: "First name and last name are required",
        });
      }

      // Validate email format
      if (!validateEmail(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }

      // Validate password strength
      try {
        validatePassword(password);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error?.message || "Password validation failed",
        });
      }

      // Log reCAPTCHA token presence (without logging the actual token for security)
      console.log(
        "Registration with reCAPTCHA:",
        recaptchaToken ? "Token present" : "No token"
      );

      // Verify reCAPTCHA token if present
      if (recaptchaToken) {
        try {
          const recaptchaResult = await recaptchaService.verifyToken(
            recaptchaToken,
            "signup"
          );
          if (!recaptchaResult.success) {
            console.warn(
              "reCAPTCHA verification failed for registration:",
              recaptchaResult["error-codes"]
            );
            return res.status(400).json({
              success: false,
              message: "reCAPTCHA verification failed. Please try again.",
            });
          }
          console.log(
            `reCAPTCHA verified for registration: score ${recaptchaResult.score}`
          );
        } catch (error) {
          console.error("reCAPTCHA verification error:", error);
          // Continue without reCAPTCHA if service fails
          console.log(
            "Continuing registration without reCAPTCHA due to service error"
          );
        }
      }

      const result = await authService.register(
        email,
        password,
        firstName,
        lastName,
        req.ip,
        req.get("User-Agent")
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
        return res
          .status(400)
          .json({ success: false, message: "Email and password are required" });
      }

      // Validate email format
      if (!validateEmail(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }

      // Log reCAPTCHA token presence (without logging the actual token for security)
      console.log(
        "Login with reCAPTCHA:",
        recaptchaToken ? "Token present" : "No token"
      );

      // Verify reCAPTCHA token if present
      if (recaptchaToken) {
        try {
          const recaptchaResult = await recaptchaService.verifyToken(
            recaptchaToken,
            "login"
          );
          if (!recaptchaResult.success) {
            console.warn(
              "reCAPTCHA verification failed for login:",
              recaptchaResult["error-codes"]
            );
            return res.status(400).json({
              success: false,
              message: "reCAPTCHA verification failed. Please try again.",
            });
          }
          console.log(
            `reCAPTCHA verified for login: score ${recaptchaResult.score}`
          );
        } catch (error) {
          console.error("reCAPTCHA verification error:", error);
          // Continue without reCAPTCHA if service fails
          console.log(
            "Continuing login without reCAPTCHA due to service error"
          );
        }
      }

      const result = await authService.login(
        email,
        password,
        req.ip,
        req.get("User-Agent")
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
      console.log("🚀 Starting Google OAuth flow...");

      // Determine the correct redirect URI based on environment
      const redirectUri =
        process.env.NODE_ENV === "development"
          ? "http://localhost:5000/api/auth/google/callback"
          : `https://${
              process.env.REPL_SLUG || "app"
            }.replit.app/api/auth/google/callback`;

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "select_account",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      console.log("🔗 Redirecting to Google OAuth:", authUrl);

      res.redirect(authUrl);
    } catch (error) {
      console.error("❌ OAuth start error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to start OAuth flow" });
    }
  });

  // OAuth Google callback - handles the authorization code from Google
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, error } = req.query;

      console.log("🔍 Google OAuth callback received:", {
        code: code ? "present" : "missing",
        error,
      });

      if (error) {
        console.error("❌ Google OAuth error:", error);
        return res.redirect(
          `${
            process.env.NODE_ENV === "development"
              ? "http://localhost:5000"
              : `https://${process.env.REPL_SLUG || "app"}.replit.app`
          }?error=oauth_error&message=${encodeURIComponent(error as string)}`
        );
      }

      if (!code) {
        console.error("❌ No authorization code received");
        return res.redirect(
          `${
            process.env.NODE_ENV === "development"
              ? "http://localhost:5000"
              : `https://${process.env.REPL_SLUG || "app"}.replit.app`
          }?error=oauth_error&message=No+authorization+code+received`
        );
      }

      // Exchange authorization code for tokens
      const googleUser = await exchangeCodeForUserInfo(code as string);

      // Process OAuth login through existing auth service
      const result = await authService.oauthLogin(
        "google",
        googleUser.id,
        googleUser.email,
        googleUser.given_name,
        googleUser.family_name,
        googleUser.picture,
        req.ip,
        req.get("User-Agent")
      );

      if (result.success && result.accessToken) {
        console.log("✅ Google OAuth login successful");

        // Set session cookie with JWT token
        res.cookie("session", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        console.error("❌ OAuth login failed:", result.message);

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
                <p>${result.message || "Login failed"}</p>
                <p>You can close this window and try again.</p>
              </div>
              <script>
                // Notify parent window of error
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'GOOGLE_AUTH_ERROR',
                    error: '${result.message || "Login failed"}'
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
      const {
        email,
        googleId,
        firstName,
        lastName,
        profileImage,
        recaptchaToken,
      } = req.body;

      // Log reCAPTCHA token presence (without logging the actual token for security)
      console.log(
        "Google OAuth with reCAPTCHA:",
        recaptchaToken ? "Token present" : "No token"
      );

      // Verify reCAPTCHA token if present
      if (recaptchaToken) {
        const recaptchaResult = await recaptchaService.verifyToken(
          recaptchaToken,
          "google_oauth"
        );
        if (!recaptchaResult.success) {
          console.warn(
            "reCAPTCHA verification failed for Google OAuth:",
            recaptchaResult["error-codes"]
          );
          return res.status(400).json({
            success: false,
            message: "reCAPTCHA verification failed. Please try again.",
          });
        }
        console.log(
          `reCAPTCHA verified for Google OAuth: score ${recaptchaResult.score}`
        );
      }

      const result = await authService.oauthLogin(
        "google",
        googleId,
        email,
        firstName,
        lastName,
        profileImage,
        req.ip,
        req.get("User-Agent")
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
      res
        .status(500)
        .json({ success: false, message: "Email verification failed" });
    }
  });

  // Request password reset
  app.post("/api/auth/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;

      const result = await authService.requestPasswordReset(
        email,
        req.ip,
        req.get("User-Agent")
      );

      res.json(result);
    } catch (error) {
      console.error("Password reset request error:", error);
      res
        .status(500)
        .json({ success: false, message: "Password reset request failed" });
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
      res
        .status(500)
        .json({ success: false, message: "Password reset failed" });
    }
  });

  // Verify token and get user (Authorization header)
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authorization header required",
        });
      }

      const token = authHeader.substring(7);
      const result = await authService.verifyToken(token);
      res.json(result);
    } catch (error) {
      console.error("Token verification error:", error);
      res
        .status(500)
        .json({ valid: false, message: "Token verification failed" });
    }
  });

  // Verify token and get user (request body)
  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      const { token } = req.body;
      const result = await authService.verifyToken(token);
      res.json(result);
    } catch (error) {
      console.error("Token verification error:", error);
      res
        .status(500)
        .json({ valid: false, message: "Token verification failed" });
    }
  });

  // Refresh token (Authorization header)
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authorization header required",
        });
      }

      const token = authHeader.substring(7);
      const result = await authService.refreshToken(token);
      res.json(result);
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ success: false, message: "Token refresh failed" });
    }
  });

  // Refresh token (request body)
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

  // ==================== ADMIN AUTHENTICATION ROUTES (TOKEN-ONLY SYSTEM) ====================

  // Token-only admin login - NO COOKIES
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required for admin access",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Use token-only admin auth service (NO COOKIES)
      const result = await tokenAdminAuth.login(email, password);

      // Return token in response body only (no cookies)
      res.json(result);
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        message: "Admin authentication system error",
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
          message: "No admin token provided",
        });
      }

      const verification = await tokenAdminAuth.verifyToken(token);

      if (verification.valid) {
        res.json({
          valid: true,
          user: verification.user,
          message: "Admin token valid",
        });
      } else {
        res.status(401).json({
          valid: false,
          expired: verification.expired,
          message: verification.expired
            ? "Admin session expired"
            : "Invalid admin token",
        });
      }
    } catch (error) {
      console.error("Admin token verification error:", error);
      res.status(500).json({
        valid: false,
        message: "Token verification error",
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
        message: "Logout system error",
      });
    }
  });

  // ==================== CLEAN TOKEN-ONLY ADMIN SYSTEM ====================

  // Token verification endpoint
  app.get(
    "/api/admin/token/verify",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        console.log("🔍 Route handler: adminUser =", (req as any).adminUser);
        const adminUser = (req as any).adminUser;

        if (!adminUser) {
          return res.status(401).json({
            success: false,
            message: "Admin user not found in request",
          });
        }

        res.json({
          success: true,
          user: adminUser,
          message: "Admin authenticated successfully",
        });
      } catch (error) {
        console.error("Session status error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to retrieve session status",
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
        message: "Logout failed",
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
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        emailServiceWorking: false,
        resendConfigured: !!process.env.RESEND_API_KEY,
      });
    }
  });

  // Audit Log endpoints
  app.get(
    "/api/audit-logs",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const auditLogs = await storage.getAuditLogs();
        res.json(auditLogs);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    }
  );

  app.get(
    "/api/audit-logs/:id",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const id = parseId(req.params.id, "audit log ID");
        const auditLog = await storage.getAuditLog(id);
        if (!auditLog) {
          return res.status(404).json({ message: "Audit log not found" });
        }
        res.json(auditLog);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch audit log" });
      }
    }
  );

  // This route is deprecated - use /api/admin/auth/login instead

  // Unified CSV endpoints
  app.get(
    "/api/csv/unified-template",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { CSVService } = await import("./services/csv-service");
        const csvService = new CSVService(storage);

        const csvContent = await csvService.generateUnifiedTemplate();

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="brainliest_complete_platform_template.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Unified CSV template generation error:", error);
        res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Template generation failed",
        });
      }
    }
  );

  app.get(
    "/api/csv/unified-export",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { CSVService } = await import("./services/csv-service");
        const csvService = new CSVService(storage);

        const csvContent = await csvService.exportUnifiedData();

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="brainliest_complete_platform_export.csv"'
        );
        res.send(csvContent);
      } catch (error) {
        console.error("Unified CSV export error:", error);
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : "Export failed",
        });
      }
    }
  );

  app.post(
    "/api/csv/unified-import",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { CSVService } = await import("./services/csv-service");
        const csvService = new CSVService(storage);

        const csvContent = req.body.csvContent;

        if (!csvContent) {
          return res.status(400).json({
            success: false,
            message: "CSV content is required",
          });
        }

        const result = await csvService.importUnifiedData(csvContent);
        res.json(result);
      } catch (error) {
        console.error("Unified CSV import error:", error);
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : "Import failed",
        });
      }
    }
  );

  // CSV Import/Export endpoints
  app.get(
    "/api/csv/template/:entityType",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { CSVService } = await import("./services/csv-service");
        const csvService = new CSVService(storage);

        const entityType = req.params.entityType as any;
        const csvContent = await csvService.generateTemplate(entityType);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${entityType}_template.csv"`
        );
        res.send(csvContent);
      } catch (error) {
        console.error("CSV template generation error:", error);
        res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Template generation failed",
        });
      }
    }
  );

  app.get(
    "/api/csv/export/:entityType",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { CSVService } = await import("./services/csv-service");
        const csvService = new CSVService(storage);

        const entityType = req.params.entityType as any;
        const includeRelationshipNames = req.query.includeNames === "true";
        const includeMetadata = req.query.includeMetadata === "true";

        const csvContent = await csvService.exportData(entityType, {
          includeRelationshipNames,
          includeMetadata,
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${entityType}_export.csv"`
        );
        res.send(csvContent);
      } catch (error) {
        console.error("CSV export error:", error);
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : "Export failed",
        });
      }
    }
  );

  app.post(
    "/api/csv/import/:entityType",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { CSVService } = await import("./services/csv-service");
        const csvService = new CSVService(storage);

        const entityType = req.params.entityType as any;
        const csvContent = req.body.csvContent;

        if (!csvContent) {
          return res.status(400).json({
            success: false,
            message: "CSV content is required",
          });
        }

        const result = await csvService.importData(entityType, csvContent);

        if (result.success) {
          res.json(result);
        } else {
          res.status(400).json(result);
        }
      } catch (error) {
        console.error("CSV import error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Import failed",
          totalRows: 0,
          processedRows: 0,
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          errors: [],
        });
      }
    }
  );

  // JSON Import/Export endpoints
  app.get(
    "/api/json/template",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { JSONService } = await import("./services/json-service");
        const jsonService = new JSONService(storage);

        const templateData = jsonService.generateTemplate();
        const jsonContent = jsonService.formatJSONForDownload(templateData, {
          prettyFormat: true,
        });

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="brainliest_template.json"'
        );
        res.send(jsonContent);
      } catch (error) {
        console.error("JSON template generation error:", error);
        res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Template generation failed",
        });
      }
    }
  );

  app.get(
    "/api/json/export/:subjectSlug",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { JSONService } = await import("./services/json-service");
        const jsonService = new JSONService(storage);

        const subjectSlug = req.params.subjectSlug;
        if (!subjectSlug || typeof subjectSlug !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid subject slug",
          });
        }

        const exportData = await jsonService.exportSubjectToJSON(subjectSlug, {
          includeMetadata: true,
          prettyFormat: true,
        });

        const jsonContent = jsonService.formatJSONForDownload(exportData, {
          prettyFormat: true,
        });

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="subject_${subjectSlug}_export.json"`
        );
        res.send(jsonContent);
      } catch (error) {
        console.error("JSON export error:", error);
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : "Export failed",
        });
      }
    }
  );

  app.post(
    "/api/json/import",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const { JSONService } = await import("./services/json-service");
        const jsonService = new JSONService(storage);

        let jsonData = req.body;

        // Enhanced logging and data structure handling
        console.log("JSON Import - Raw request body type:", typeof jsonData);
        console.log(
          "JSON Import - Raw request body keys:",
          Object.keys(jsonData || {})
        );

        if (!jsonData) {
          console.log("JSON Import - Error: No JSON data provided");
          return res.status(400).json({
            success: false,
            message: "JSON data is required",
            debug: "Request body is empty or null",
          });
        }

        // Handle nested structure from frontend: { jsonData: actualData }
        if (jsonData.jsonData) {
          console.log(
            "JSON Import - Detected nested jsonData structure, extracting..."
          );
          jsonData = jsonData.jsonData;

          // After extraction, ensure the data has the proper wrapper structure
          // The validation function expects { subject: {...} } format
          if (!jsonData.subject && jsonData.name) {
            console.log(
              "JSON Import - Restructuring extracted data to add subject wrapper"
            );
            jsonData = { subject: jsonData };
          }
        }

        // Log the actual data structure being processed
        console.log("JSON Import - Processing data structure:");
        console.log("- Has subject:", !!jsonData.subject);
        console.log("- Subject type:", typeof jsonData.subject);
        if (jsonData.subject) {
          console.log("- Subject name:", jsonData.subject.name);
          console.log(
            "- Subject exams count:",
            Array.isArray(jsonData.subject.exams)
              ? jsonData.subject.exams.length
              : "not array"
          );
        }

        const result = await jsonService.processJSONImport(jsonData);

        // Enhanced logging for validation errors
        if (!result.success && result.errors.length > 0) {
          console.log("JSON Import - Validation errors found:");
          result.errors.forEach((error, index) => {
            console.log(
              `  ${index + 1}. Path: ${error.path}, Field: ${
                error.field
              }, Message: ${error.message}`
            );
            console.log(`     Value: ${JSON.stringify(error.value)}`);
          });
        }

        if (result.success) {
          console.log("JSON Import - Success:", result.message);
          res.json(result);
        } else {
          console.log("JSON Import - Failed:", result.message);
          res.status(400).json(result);
        }
      } catch (error) {
        console.error("JSON import error:", error);
        res.status(500).json({
          success: false,
          subjectId: undefined,
          examIds: [],
          questionIds: [],
          createdCounts: { subjects: 0, exams: 0, questions: 0 },
          errors: [
            {
              path: "import",
              field: "general",
              value: null,
              message: error instanceof Error ? error.message : "Import failed",
            },
          ],
          message: "Import process failed",
        });
      }
    }
  );

  // Freemium API routes
  app.get("/api/freemium/status", checkFreemiumStatus(), async (req, res) => {
    try {
      const sessionInfo = req.freemiumSession;
      if (!sessionInfo) {
        return res
          .status(500)
          .json({ error: "Failed to get freemium session info" });
      }
      res.json(sessionInfo);
    } catch (error) {
      console.error("Error fetching freemium status:", error);
      res.status(500).json({ error: "Failed to fetch freemium status" });
    }
  });

  // Statistics API routes
  app.get("/api/stats", async (req, res) => {
    try {
      const [subjectCount, examCount, questionCount] = await Promise.all([
        storage.getSubjectCount(),
        storage.getExamCount(),
        storage.getQuestionCount(),
      ]);

      const stats = {
        subjects: subjectCount,
        exams: examCount,
        questions: questionCount,
        successRate: 95, // This could be calculated from user sessions in the future
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Trending API routes
  app.get("/api/trending/certifications", async (req, res) => {
    try {
      const trending = await trendingService.getTrendingCertifications();
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending certifications:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch trending certifications" });
    }
  });

  app.post("/api/tracking/interaction", async (req, res) => {
    try {
      const { subjectId, interactionType, userId, sessionId } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

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
      console.error("Error tracking interaction:", error);
      res.status(500).json({ error: "Failed to track interaction" });
    }
  });

  // SEO API routes
  app.post("/api/seo/generate", async (req, res) => {
    try {
      const { type, title, description, content, url, category, subject } =
        req.body;

      const seoData = await seoService.generatePageSEO({
        type,
        title,
        description,
        content,
        url,
        category,
        subject,
      });

      res.json(seoData);
    } catch (error) {
      console.error("SEO generation error:", error);
      res.status(500).json({
        error: "Failed to generate SEO data",
        message: error instanceof Error ? error.message : "Unknown error",
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
        category,
      });

      res.json(faqs);
    } catch (error) {
      console.error("FAQ generation error:", error);
      res.status(500).json({
        error: "Failed to generate FAQs",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/seo/structured-data", async (req, res) => {
    try {
      const { question, faqs, type = "question" } = req.body;

      let structuredData = [];

      if (type === "question" && question) {
        structuredData = seoService.generateQuestionStructuredData(
          question,
          faqs || []
        );
      } else if (type === "category") {
        structuredData = seoService.generateCategoryStructuredData(
          req.body.category
        );
      } else if (type === "breadcrumbs") {
        structuredData = [
          seoService.generateBreadcrumbStructuredData(req.body.breadcrumbs),
        ];
      }

      res.json(structuredData);
    } catch (error) {
      console.error("Structured data generation error:", error);
      res.status(500).json({
        error: "Failed to generate structured data",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/seo/keywords", async (req, res) => {
    try {
      const { name, description, category } = req.body;

      const keywords = await seoService.generateSubjectKeywords({
        name,
        description,
        category,
      });

      res.json(keywords);
    } catch (error) {
      console.error("Keyword generation error:", error);
      res.status(500).json({
        error: "Failed to generate keywords",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Dynamic sitemap generation endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const xml = await sitemapService.generateXmlSitemap();
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (req, res) => {
    try {
      const robots = sitemapService.generateRobotsTxt();
      res.set("Content-Type", "text/plain");
      res.send(robots);
    } catch (error) {
      console.error("Robots.txt generation error:", error);
      res.status(500).send("Error generating robots.txt");
    }
  });

  // ==================== UPLOAD MANAGEMENT ROUTES ====================

  // Configure multer for file uploads
  const storage_config = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
      } catch (error) {
        cb(error, uploadsDir);
      }
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      cb(null, `${basename}-${uniqueSuffix}${ext}`);
    },
  });

  // File filter for image uploads
  const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  };

  const upload = multer({
    storage: storage_config,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter,
  });

  // Upload a new file
  app.post(
    "/api/admin/uploads",
    tokenAdminAuth.createAuthMiddleware(),
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const user = req.user as { id: number; email: string };

        const uploadData = {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileType: req.file.mimetype.split("/")[0], // 'image', 'video', etc.
          uploadPath: `/uploads/${req.file.filename}`,
          uploadedBy: user.id,
          isActive: true,
        };

        const upload = await storage.createUpload(uploadData);

        res.json({
          success: true,
          upload: {
            id: upload.id,
            fileName: upload.fileName,
            originalName: upload.originalName,
            uploadPath: upload.uploadPath,
            fileType: upload.fileType,
            fileSize: upload.fileSize,
            createdAt: upload.createdAt,
          },
        });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Upload failed" });
      }
    }
  );

  // Get all uploads with pagination
  app.get(
    "/api/admin/uploads",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const fileType = req.query.fileType as string;
        const offset = (page - 1) * limit;

        const result = await storage.getUploadsPaginated(
          offset,
          limit,
          fileType
        );

        res.json({
          uploads: result.uploads,
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        });
      } catch (error) {
        console.error("Get uploads error:", error);
        res.status(500).json({ message: "Failed to retrieve uploads" });
      }
    }
  );

  // Get specific upload
  app.get(
    "/api/admin/uploads/:id",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const id = parseId(req.params.id);
        const upload = await storage.getUpload(id);

        if (!upload) {
          return res.status(404).json({ message: "Upload not found" });
        }

        res.json(upload);
      } catch (error) {
        console.error("Get upload error:", error);
        res.status(500).json({ message: "Failed to retrieve upload" });
      }
    }
  );

  // Update upload (mainly for activation/deactivation)
  app.patch(
    "/api/admin/uploads/:id",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const id = parseId(req.params.id);
        const { isActive } = req.body;

        const upload = await storage.updateUpload(id, { isActive });

        if (!upload) {
          return res.status(404).json({ message: "Upload not found" });
        }

        res.json(upload);
      } catch (error) {
        console.error("Update upload error:", error);
        res.status(500).json({ message: "Failed to update upload" });
      }
    }
  );

  // Delete upload
  app.delete(
    "/api/admin/uploads/:id",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const id = parseId(req.params.id);
        const upload = await storage.getUpload(id);

        if (!upload) {
          return res.status(404).json({ message: "Upload not found" });
        }

        // Delete file from disk
        const filePath = path.join(process.cwd(), "public", upload.uploadPath);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn("Failed to delete file:", error);
        }

        const success = await storage.deleteUpload(id);

        if (success) {
          res.json({ message: "Upload deleted successfully" });
        } else {
          res.status(500).json({ message: "Failed to delete upload" });
        }
      } catch (error) {
        console.error("Delete upload error:", error);
        res.status(500).json({ message: "Failed to delete upload" });
      }
    }
  );

  // ==================== ICON ASSIGNMENT ROUTES ====================

  // Update subject icon
  app.patch(
    "/api/admin/subjects/:slug/icon",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug);
        const { icon } = req.body;

        if (!icon) {
          return res.status(400).json({ message: "Icon is required" });
        }

        const subject = await storage.updateSubject(slug, { icon });

        if (!subject) {
          return res.status(404).json({ message: "Subject not found" });
        }

        res.json({ message: "Subject icon updated successfully", subject });
      } catch (error) {
        console.error("Update subject icon error:", error);
        res.status(500).json({ message: "Failed to update subject icon" });
      }
    }
  );

  // Update exam icon
  app.patch(
    "/api/admin/exams/:slug/icon",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug);
        const { icon } = req.body;

        if (!icon) {
          return res.status(400).json({ message: "Icon is required" });
        }

        const exam = await storage.updateExam(slug, { icon });

        if (!exam) {
          return res.status(404).json({ message: "Exam not found" });
        }

        res.json({ message: "Exam icon updated successfully", exam });
      } catch (error) {
        console.error("Update exam icon error:", error);
        res.status(500).json({ message: "Failed to update exam icon" });
      }
    }
  );

  // Update category icon
  app.patch(
    "/api/admin/categories/:slug/icon",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug);
        const { icon } = req.body;

        if (!icon) {
          return res.status(400).json({ message: "Icon is required" });
        }

        const category = await storage.updateCategory(slug, { icon });

        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category icon updated successfully", category });
      } catch (error) {
        console.error("Update category icon error:", error);
        res.status(500).json({ message: "Failed to update category icon" });
      }
    }
  );

  // Update subcategory icon
  app.patch(
    "/api/admin/subcategories/:slug/icon",
    tokenAdminAuth.createAuthMiddleware(),
    async (req, res) => {
      try {
        const slug = sanitizeString(req.params.slug);
        const { icon } = req.body;

        if (!icon) {
          return res.status(400).json({ message: "Icon is required" });
        }

        const subcategory = await storage.updateSubcategory(slug, { icon });

        if (!subcategory) {
          return res.status(404).json({ message: "Subcategory not found" });
        }

        res.json({
          message: "Subcategory icon updated successfully",
          subcategory,
        });
      } catch (error) {
        console.error("Update subcategory icon error:", error);
        res.status(500).json({ message: "Failed to update subcategory icon" });
      }
    }
  );

  // ==================== END UPLOAD MANAGEMENT ====================

  // Test Email route for Titan Email testing
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email address is required",
        });
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      console.log(`📧 Sending test email to: ${email}`);

      // Send test email using the email service
      const emailSent = await emailService.sendTestEmail(email);

      if (emailSent) {
        console.log(`✅ Test email sent successfully to ${email}`);
        res.json({
          success: true,
          message: `Test email sent successfully to ${email}`,
          service: "Titan Mail",
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`❌ Failed to send test email to ${email}`);
        res.status(500).json({
          success: false,
          message:
            "Failed to send test email. Please check Titan Email configuration.",
          service: "Titan Mail",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({
        success: false,
        message: "Test email failed: " + (error.message || "Unknown error"),
        service: "Titan Mail",
        timestamp: new Date().toISOString(),
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
