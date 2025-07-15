// Vercel serverless function wrapper for Express app
import express from "express";
import cors from "cors";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { count } from "drizzle-orm";
import * as schema from "../shared/schema.js";

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

// Connection monitoring
console.log("🔌 PostgreSQL connection initialized for Vercel deployment");

// Enhanced health check with database connectivity test
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const result = await db.select().from(schema.subjects).limit(1);
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.NODE_ENV || "development",
      databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
    });
  } catch (error) {
    console.error("🔴 Health check database error:", error.message);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
      environment: process.env.NODE_ENV || "development",
      databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
    });
  }
});

// Subjects endpoint with enhanced error logging
app.get("/api/subjects", async (req, res) => {
  try {
    console.log("🔍 Fetching subjects from database...");
    const subjects = await db.select().from(schema.subjects);
    console.log(`✅ Found ${subjects.length} subjects`);
    res.json(subjects);
  } catch (error) {
    console.error("🔴 Database error in /api/subjects:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Subject by slug endpoint
app.get("/api/subjects/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const subjects = await db
      .select()
      .from(schema.subjects)
      .where(schema.subjects.slug.eq(slug));
    if (subjects.length === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json(subjects[0]);
  } catch (error) {
    console.error("🔴 Database error in /api/subjects/by-slug:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Categories endpoint
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.select().from(schema.categories);
    res.json(categories);
  } catch (error) {
    console.error("🔴 Database error in /api/categories:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Subcategories endpoint
app.get("/api/subcategories", async (req, res) => {
  try {
    const subcategories = await db.select().from(schema.subcategories);
    res.json(subcategories);
  } catch (error) {
    console.error("🔴 Database error in /api/subcategories:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Subcategory by slug endpoint
app.get("/api/subcategories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const subcategories = await db
      .select()
      .from(schema.subcategories)
      .where(schema.subcategories.slug.eq(slug));
    if (subcategories.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.json(subcategories[0]);
  } catch (error) {
    console.error("🔴 Database error in /api/subcategories/:slug:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Exams endpoint
app.get("/api/exams", async (req, res) => {
  try {
    const { subjectSlug } = req.query;
    let exams;

    if (subjectSlug) {
      exams = await db
        .select()
        .from(schema.exams)
        .where(schema.exams.subjectSlug.eq(subjectSlug));
    } else {
      exams = await db.select().from(schema.exams);
    }

    res.json(exams);
  } catch (error) {
    console.error("🔴 Database error in /api/exams:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Exam by slug endpoint
app.get("/api/exams/by-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const exams = await db
      .select()
      .from(schema.exams)
      .where(schema.exams.slug.eq(slug));
    if (exams.length === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Count actual questions for this exam
    const questionCount = await db
      .select({ count: count() })
      .from(schema.questions)
      .where(schema.questions.examSlug.eq(slug));

    res.json({
      ...exams[0],
      questionCount: questionCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("🔴 Database error in /api/exams/by-slug:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Exams by subcategory endpoint
app.get("/api/exams/subcategory/:subcategorySlug", async (req, res) => {
  try {
    const { subcategorySlug } = req.params;

    // Get subjects in this subcategory
    const subjects = await db
      .select()
      .from(schema.subjects)
      .where(schema.subjects.subcategorySlug.eq(subcategorySlug));
    const subjectSlugs = subjects.map((s) => s.slug);

    // Get exams for these subjects
    const exams = await db
      .select()
      .from(schema.exams)
      .where(schema.exams.subjectSlug.in(subjectSlugs));

    res.json(exams);
  } catch (error) {
    console.error("🔴 Database error in /api/exams/subcategory:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Questions endpoint
app.get("/api/questions", async (req, res) => {
  try {
    const { examSlug } = req.query;
    let questions;

    if (examSlug) {
      questions = await db
        .select()
        .from(schema.questions)
        .where(schema.questions.examSlug.eq(examSlug));
    } else {
      questions = await db.select().from(schema.questions);
    }

    res.json({ questions });
  } catch (error) {
    console.error("🔴 Database error in /api/questions:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Comments endpoint
app.get("/api/comments", async (req, res) => {
  try {
    const { questionId } = req.query;
    let comments;

    if (questionId) {
      comments = await db
        .select()
        .from(schema.questionComments)
        .where(schema.questionComments.questionId.eq(questionId));
    } else {
      comments = await db.select().from(schema.questionComments);
    }

    res.json(comments);
  } catch (error) {
    console.error("🔴 Database error in /api/comments:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Statistics endpoint - This was missing and causing 404 errors
app.get("/api/stats", async (req, res) => {
  try {
    console.log("🔍 Fetching statistics from database...");

    // Get counts using count() function
    const [subjectCount, examCount, questionCount] = await Promise.all([
      db.select({ count: count() }).from(schema.subjects),
      db.select({ count: count() }).from(schema.exams),
      db.select({ count: count() }).from(schema.questions),
    ]);

    const stats = {
      subjects: subjectCount[0]?.count || 0,
      exams: examCount[0]?.count || 0,
      questions: questionCount[0]?.count || 0,
      successRate: 95, // This could be calculated from user sessions in the future
    };

    console.log("✅ Statistics fetched successfully:", stats);
    res.json(stats);
  } catch (error) {
    console.error("🔴 Database error in /api/stats:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Trending certifications endpoint
app.get("/api/trending/certifications", async (req, res) => {
  try {
    // Get top subjects with exam counts
    const subjects = await db.select().from(schema.subjects).limit(10);

    // Add exam counts
    const trending = await Promise.all(
      subjects.map(async (subject) => {
        const examCount = await db
          .select({ count: count() })
          .from(schema.exams)
          .where(schema.exams.subjectSlug.eq(subject.slug));
        return {
          ...subject,
          examCount: examCount[0]?.count || 0,
          trending: Math.floor(Math.random() * 100) + 1, // Mock trending score
        };
      })
    );

    res.json(trending);
  } catch (error) {
    console.error("🔴 Database error in /api/trending/certifications:", error);
    res.status(500).json({
      error: "Database connection failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Export for Vercel
export default app;
