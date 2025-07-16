// Vercel serverless function wrapper for Express app
import express from "express";
import cors from "cors";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { count, eq, and } from "drizzle-orm";
import * as schema from "../shared/schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

// Database setup with enhanced error handling
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "❌ POSTGRES_URL or DATABASE_URL environment variable is required"
  );
  throw new Error(
    "POSTGRES_URL or DATABASE_URL environment variable is required"
  );
}

// PostgreSQL connection for Supabase with connection pooling
const sql = postgres(databaseUrl, {
  ssl: "require",
  max: 1, // Serverless functions should use single connections
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(sql, { schema });

console.log("🔌 PostgreSQL connection initialized for Vercel deployment");

// Admin JWT configuration
const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_JWT_SECRET environment variable is required in production"
      );
    }
    const devSecret = crypto.randomBytes(64).toString("hex");
    console.warn(
      "⚠️  Using auto-generated JWT secret for development. Set ADMIN_JWT_SECRET for production."
    );
    return devSecret;
  })();

const ADMIN_JWT_EXPIRY = "8h";
const AUTHORIZED_ADMIN_EMAILS = process.env.AUTHORIZED_ADMIN_EMAILS
  ? process.env.AUTHORIZED_ADMIN_EMAILS.split(",").map((email) => email.trim())
  : [
      "admin@brainliest.com",
      "super.admin@brainliest.com",
      "platform.admin@brainliest.com",
    ];

// Generate admin JWT token
function generateAdminToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: true,
      type: "admin",
    },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRY }
  );
}

// Verify admin JWT token
function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await db.select().from(schema.subjects).limit(1);
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Get all subjects
app.get("/api/subjects", async (req, res) => {
  try {
    console.log("🔍 Fetching subjects from database...");
    const subcategorySlug = req.query.subcategorySlug;

    let query = db
      .select({
        slug: schema.subjects.slug,
        name: schema.subjects.name,
        description: schema.subjects.description,
        icon: schema.subjects.icon,
        color: schema.subjects.color,
        categorySlug: schema.subjects.categorySlug,
        subcategorySlug: schema.subjects.subcategorySlug,
        examCount: schema.subjects.examCount,
        questionCount: schema.subjects.questionCount,
        isActive: schema.subjects.isActive,
        createdAt: schema.subjects.createdAt,
        updatedAt: schema.subjects.updatedAt,
      })
      .from(schema.subjects);

    if (subcategorySlug) {
      query = query.where(eq(schema.subjects.subcategorySlug, subcategorySlug));
    }

    const subjects = await query;
    console.log(`✅ Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (error) {
    console.error("🔴 Database error in /api/subjects:", error);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
});

// Get subject by slug
app.get("/api/subjects/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const subjects = await db
      .select()
      .from(schema.subjects)
      .where(eq(schema.subjects.slug, slug));
    if (subjects.length === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subjects[0]);
  } catch (error) {
    console.error("🔴 Database error in /api/subjects/by-slug:", error);
    res.status(500).json({ message: "Failed to fetch subject" });
  }
});

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.select().from(schema.categories);
    res.json(categories);
  } catch (error) {
    console.error("🔴 Database error in /api/categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Get category by slug
app.get("/api/categories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug));
    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(categories[0]);
  } catch (error) {
    console.error("🔴 Database error in /api/categories/:slug:", error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
});

// Get all subcategories
app.get("/api/subcategories", async (req, res) => {
  try {
    const subcategories = await db.select().from(schema.subcategories);
    res.json(subcategories);
  } catch (error) {
    console.error("🔴 Database error in /api/subcategories:", error);
    res.status(500).json({ message: "Failed to fetch subcategories" });
  }
});

// Get subcategory by slug
app.get("/api/subcategories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const subcategories = await db
      .select()
      .from(schema.subcategories)
      .where(eq(schema.subcategories.slug, slug));
    if (subcategories.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.json(subcategories[0]);
  } catch (error) {
    console.error("🔴 Database error in /api/subcategories/:slug:", error);
    res.status(500).json({ message: "Failed to fetch subcategory" });
  }
});

// Get all exams
app.get("/api/exams", async (req, res) => {
  try {
    const subjectSlug = req.query.subjectSlug;

    let query = db
      .select({
        slug: schema.exams.slug,
        subjectSlug: schema.exams.subjectSlug,
        title: schema.exams.title,
        description: schema.exams.description,
        icon: schema.exams.icon,
        questionCount: schema.exams.questionCount,
        duration: schema.exams.duration,
        difficulty: schema.exams.difficulty,
        isActive: schema.exams.isActive,
      })
      .from(schema.exams);

    if (subjectSlug) {
      query = query.where(eq(schema.exams.subjectSlug, subjectSlug));
    }

    const exams = await query;

    // Get actual question counts for each exam
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await db
          .select({ count: count() })
          .from(schema.questions)
          .where(eq(schema.questions.examSlug, exam.slug));
        return {
          ...exam,
          questionCount: questionCount[0].count,
        };
      })
    );

    res.json(examsWithCounts);
  } catch (error) {
    console.error("🔴 Database error in /api/exams:", error);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
});

// Get exam by slug
app.get("/api/exams/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const exams = await db
      .select()
      .from(schema.exams)
      .where(eq(schema.exams.slug, slug));
    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Get actual question count
    const questionCount = await db
      .select({ count: count() })
      .from(schema.questions)
      .where(eq(schema.questions.examSlug, slug));

    res.json({
      ...exams[0],
      questionCount: questionCount[0].count,
    });
  } catch (error) {
    console.error("🔴 Database error in /api/exams/by-slug:", error);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
});

// Get exams by subcategory
app.get("/api/exams/subcategory/:subcategorySlug", async (req, res) => {
  try {
    const { subcategorySlug } = req.params;
    const exams = await db
      .select({
        slug: schema.exams.slug,
        subjectSlug: schema.exams.subjectSlug,
        title: schema.exams.title,
        description: schema.exams.description,
        icon: schema.exams.icon,
        questionCount: schema.exams.questionCount,
        duration: schema.exams.duration,
        difficulty: schema.exams.difficulty,
        isActive: schema.exams.isActive,
      })
      .from(schema.exams)
      .innerJoin(
        schema.subjects,
        eq(schema.exams.subjectSlug, schema.subjects.slug)
      )
      .where(eq(schema.subjects.subcategorySlug, subcategorySlug));

    // Get actual question counts for each exam
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await db
          .select({ count: count() })
          .from(schema.questions)
          .where(eq(schema.questions.examSlug, exam.slug));
        return {
          ...exam,
          questionCount: questionCount[0].count,
        };
      })
    );

    res.json(examsWithCounts);
  } catch (error) {
    console.error("🔴 Database error in /api/exams/subcategory:", error);
    res.status(500).json({ message: "Failed to fetch exams by subcategory" });
  }
});

// Get all questions
app.get("/api/questions", async (req, res) => {
  try {
    const examSlug = req.query.examSlug;

    let query = db
      .select({
        id: schema.questions.id,
        text: schema.questions.text,
        options: schema.questions.options,
        correctAnswer: schema.questions.correctAnswer,
        allowMultipleAnswers: schema.questions.allowMultipleAnswers,
        explanation: schema.questions.explanation,
        difficulty: schema.questions.difficulty,
        domain: schema.questions.domain,
        order: schema.questions.order,
        subjectSlug: schema.questions.subjectSlug,
        examSlug: schema.questions.examSlug,
      })
      .from(schema.questions);

    if (examSlug) {
      query = query.where(eq(schema.questions.examSlug, examSlug));
    }

    const questions = await query;
    res.json({ questions });
  } catch (error) {
    console.error("🔴 Database error in /api/questions:", error);
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

// Get question comments
app.get("/api/comments", async (req, res) => {
  try {
    const questionId = req.query.questionId;

    let query = db
      .select({
        id: schema.comments.id,
        questionId: schema.comments.questionId,
        authorName: schema.comments.authorName,
        content: schema.comments.content,
        createdAt: schema.comments.createdAt,
        isApproved: schema.comments.isApproved,
        updatedAt: schema.comments.updatedAt,
      })
      .from(schema.comments)
      .orderBy(schema.comments.createdAt);

    if (questionId) {
      query = query.where(eq(schema.comments.questionId, questionId));
    }

    const comments = await query;
    res.json(comments);
  } catch (error) {
    console.error("🔴 Database error in /api/comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Get statistics
app.get("/api/stats", async (req, res) => {
  try {
    const [subjectCount, examCount, questionCount] = await Promise.all([
      db.select({ count: count() }).from(schema.subjects),
      db.select({ count: count() }).from(schema.exams),
      db.select({ count: count() }).from(schema.questions),
    ]);

    res.json({
      subjects: subjectCount[0].count.toString(),
      exams: examCount[0].count.toString(),
      questions: questionCount[0].count.toString(),
      successRate: 95,
    });
  } catch (error) {
    console.error("🔴 Database error in /api/stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// Admin authentication endpoints
app.post("/api/admin/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if email is authorized
    if (!AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Email not authorized for admin access.",
      });
    }

    // Find user in database
    const [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.email, email.toLowerCase()),
          eq(schema.users.role, "admin")
        )
      )
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateAdminToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Admin user creation endpoint
app.post("/api/admin/users", async (req, res) => {
  try {
    // Extract and verify admin token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const token = authHeader.substring(7);
    const verification = verifyAdminToken(token);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token",
      });
    }

    const { email, password, role, firstName, lastName, username } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    // Validate role
    if (!["admin", "moderator", "user"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate username if not provided
    const generatedUsername =
      username || email.split("@")[0] + Math.random().toString(36).substr(2, 4);

    // Create user
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        username: generatedUsername,
        firstName: firstName || "",
        lastName: lastName || "",
        role,
        passwordHash,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return user without password hash
    const { passwordHash: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

// Create default admin user if it doesn't exist
app.post("/api/admin/setup", async (req, res) => {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "admin@brainliest.com"))
      .limit(1);

    if (existingAdmin) {
      return res.json({
        success: true,
        message: "Admin user already exists",
        user: {
          email: existingAdmin.email,
          username: existingAdmin.username,
          role: existingAdmin.role,
        },
      });
    }

    // Create default admin user
    const passwordHash = await bcrypt.hash("Super.Admin.123!@#", 12);

    const [newAdmin] = await db
      .insert(schema.users)
      .values({
        email: "admin@brainliest.com",
        username: "admin",
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        passwordHash,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({
      success: true,
      message: "Default admin user created successfully",
      user: {
        email: newAdmin.email,
        username: newAdmin.username,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set up admin user",
    });
  }
});

// Simple admin login without email authorization (for initial setup)
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user in database
    const [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.email, email.toLowerCase()),
          eq(schema.users.role, "admin")
        )
      )
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateAdminToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Create a new admin user directly (for your use)
app.post("/api/admin/create", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate username
    const username =
      email.split("@")[0] + Math.random().toString(36).substr(2, 4);

    // Create admin user
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        username,
        firstName: firstName || "",
        lastName: lastName || "",
        role: "admin",
        passwordHash,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return user without password hash
    const { passwordHash: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Admin create error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin user",
    });
  }
});

// Default export for Vercel
export default app;
