import { pgTable, text, serial, integer, boolean, timestamp, index, pgEnum, jsonb, numeric, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Fixed: Define difficulty enum for type safety and constraint enforcement
export const difficultyEnum = pgEnum("difficulty", ["Beginner", "Intermediate", "Advanced", "Expert"]);

// Categories table - top level hierarchy
export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subcategories table - belongs to categories
export const subcategories = pgTable("subcategories", {
  slug: text("slug").primaryKey(),
  categorySlug: text("category_slug").notNull().references(() => categories.slug, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects table - belongs to categories and subcategories
export const subjects = pgTable("subjects", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  categorySlug: text("category_slug").references(() => categories.slug, { onDelete: "set null" }),
  subcategorySlug: text("subcategory_slug").references(() => subcategories.slug, { onDelete: "set null" }),
  examCount: integer("exam_count").default(0),
  questionCount: integer("question_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exams table - belongs to subjects
export const exams = pgTable("exams", {
  slug: text("slug").primaryKey(),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon"),
  questionCount: integer("question_count").notNull(),
  duration: integer("duration"), // in minutes
  difficulty: difficultyEnum("difficulty").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questions table - belongs to exams and subjects
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examSlug: text("exam_slug").notNull().references(() => exams.slug, { onDelete: "cascade" }),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug, { onDelete: "cascade" }),
  text: text("text").notNull(),
  options: text("options").array().notNull(), // Array of option texts
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option (0-based) or multiple if multipleCorrect is true
  correctAnswers: integer("correct_answers").array(), // Array of correct answer indexes for multiple-choice
  allowMultipleAnswers: boolean("allow_multiple_answers").default(false), // Whether question allows multiple selections
  explanation: text("explanation"),
  domain: text("domain"), // For PMP: 'Initiating', 'Planning', etc.
  difficulty: difficultyEnum("difficulty").notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exam sessions table - tracks user exam attempts
export const examSessions = pgTable("exam_sessions", {
  id: serial("id").primaryKey(),
  examSlug: text("exam_slug").notNull().references(() => exams.slug, { onDelete: "cascade" }),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  userName: text("user_name"), // For anonymous users
  sessionKey: text("session_key").notNull(), // Unique session identifier
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  currentQuestionIndex: integer("current_question_index").default(0),
  answers: jsonb("answers").default("{}"), // Store answers as JSON
  score: numeric("score", { precision: 5, scale: 2 }),
  timeSpent: integer("time_spent"), // in seconds
  isCompleted: boolean("is_completed").default(false),
  isPassed: boolean("is_passed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define Drizzle relations for proper joins and nested queries
export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  subjects: many(subjects),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categorySlug],
    references: [categories.slug],
  }),
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  category: one(categories, {
    fields: [subjects.categorySlug],
    references: [categories.slug],
  }),
  subcategory: one(subcategories, {
    fields: [subjects.subcategorySlug],
    references: [subcategories.slug],
  }),
  exams: many(exams),
  questions: many(questions),
  examSessions: many(examSessions),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [exams.subjectSlug],
    references: [subjects.slug],
  }),
  questions: many(questions),
  examSessions: many(examSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [questions.examSlug],
    references: [exams.slug],
  }),
  subject: one(subjects, {
    fields: [questions.subjectSlug],
    references: [subjects.slug],
  }),
  comments: many(comments),
}));

export const examSessionsRelations = relations(examSessions, ({ one }) => ({
  exam: one(exams, {
    fields: [examSessions.examSlug],
    references: [exams.slug],
  }),
  subject: one(subjects, {
    fields: [examSessions.subjectSlug],
    references: [subjects.slug],
  }),
  user: one(users, {
    fields: [examSessions.userId],
    references: [users.id],
  }),
}));

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  parentId: integer("parent_id"), // For nested replies
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  question: one(questions, {
    fields: [comments.questionId],
    references: [questions.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
}));

// Admin uploads table for managing icon files and assets
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  fileType: text("file_type").notNull(), // 'icon', 'image', 'document'
  uploadPath: text("upload_path").notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uploadsRelations = relations(uploads, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [uploads.uploadedBy],
    references: [users.id],
  }),
}));

// Define user roles as an enum for type safety and constraint enforcement
export const userRoles = pgEnum("user_roles", ["user", "admin", "moderator"]);

// IP-based freemium session tracking table
export const anonQuestionSessions = pgTable("anon_question_sessions", {
  id: serial("id").primaryKey(),
  // Store normalized IP addresses; allow multiple entries per IP for different UAs
  ipAddress: text("ip_address").notNull(),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  // Time-zone aware timestamp for last reset of question count
  lastReset: timestamp("last_reset").notNull().defaultNow(),
  userAgentHash: text("user_agent_hash").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});



// Users table with audit fields, role enum, and JSONB metadata
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  profileImage: text("profile_image").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason").notNull().default(""),
  // Enforced enum for roles prevents typos and invalid roles
  role: userRoles("role").notNull().default("user"),
  
  // Authentication fields
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  
  // Security fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  loginCount: integer("login_count").default(0),
  
  // Tracking fields
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip").notNull().default(""),
  registrationIp: text("registration_ip").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Store arbitrary JSON metadata in a native JSONB column
  metadata: jsonb("metadata").notNull().default("{}"),
});

export const usersRelations = relations(users, ({ many }) => ({
  examSessions: many(examSessions),
  uploads: many(uploads),
}));



// Audit logging table for enterprise compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(), // e.g., "POST /api/subjects", "DELETE /api/questions/123"
  resourceType: text("resource_type"), // 'subject', 'exam', 'question', 'user'
  resourceId: integer("resource_id"), // ID of affected resource
  // Fixed: Use JSONB for changes instead of text for native JSON querying
  changes: jsonb("changes").default("{}"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
});

// Analytics and Performance Tracking Tables
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull().unique(),
  email: text("email"),
  totalExamsTaken: integer("total_exams_taken").default(0),
  totalQuestionsAnswered: integer("total_questions_answered").default(0),
  // Fixed: Use numeric type for average score instead of text
  averageScore: numeric("average_score", { precision: 5, scale: 2 }).default("0"),
  // Fixed: Use JSONB for strongest subjects instead of text
  strongestSubjects: jsonb("strongest_subjects").default("[]"),
  // Fixed: Use JSONB for weakest subjects instead of text
  weakestSubjects: jsonb("weakest_subjects").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const detailedAnswers = pgTable("detailed_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  userAnswer: integer("user_answer").notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  difficulty: text("difficulty"), // easy, medium, hard
  domain: text("domain"), // question domain/category
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const examAnalytics = pgTable("exam_analytics", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  examSlug: text("exam_slug").notNull(),
  userName: text("user_name").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  // Fixed: Use numeric type for score instead of text for better querying
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  timeSpent: integer("time_spent"), // in seconds
  // Fixed: Use numeric type for completion rate instead of text
  completionRate: numeric("completion_rate", { precision: 5, scale: 2 }),
  // Fixed: Use JSONB for domain scores instead of text for native JSON querying
  domainScores: jsonb("domain_scores").default("{}"),
  // Fixed: Use JSONB for difficulty breakdown instead of text
  difficultyBreakdown: jsonb("difficulty_breakdown").default("{}"),
  // Fixed: Use JSONB for streak data instead of text
  streakData: jsonb("streak_data").default("{}"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const performanceTrends = pgTable("performance_trends", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  week: text("week").notNull(), // Start of week (YYYY-MM-DD format)
  examsTaken: integer("exams_taken").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  // Fixed: Use numeric type for average score instead of text
  averageScore: numeric("average_score", { precision: 5, scale: 2 }),
  // Fixed: Use numeric type for accuracy trend instead of text
  accuracyTrend: numeric("accuracy_trend", { precision: 5, scale: 2 }),
  // Fixed: Use numeric type for speed trend instead of text
  speedTrend: numeric("speed_trend", { precision: 5, scale: 2 }),
  // Fixed: Use JSONB for strong domains instead of text
  strongDomains: jsonb("strong_domains").default("[]"),
  // Fixed: Use JSONB for weak domains instead of text
  weakDomains: jsonb("weak_domains").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyRecommendations = pgTable("study_recommendations", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  recommendationType: text("recommendation_type").notNull(), // "focus_area", "review", "strength"
  content: text("content").notNull(),
  priority: integer("priority").default(1), // 1-5 scale
  // Fixed: Use JSONB for domains instead of text
  domains: jsonb("domains").default("[]"),
  // Fixed: Use numeric type for estimated impact instead of text
  estimatedImpact: numeric("estimated_impact", { precision: 5, scale: 2 }),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Authentication Audit Logging
export const authLogs = pgTable("auth_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  email: text("email"),
  action: text("action").notNull(), // login_success, login_failed, register, logout, password_reset, etc.
  method: text("method"), // email, google, facebook, etc.
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  failureReason: text("failure_reason"),
  // Fixed: Use JSONB for metadata instead of text for native JSON querying
  metadata: jsonb("metadata").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session Management for JWT tokens
export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").unique().notNull(),
  refreshToken: text("refresh_token").unique(),
  isActive: boolean("is_active").default(true),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
});

// User interaction tracking tables for trending calculations
export const userSubjectInteractions = pgTable("user_subject_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // nullable for anonymous users
  subjectSlug: text("subject_slug").notNull(),
  sessionId: text("session_id"), // for anonymous tracking
  interactionType: text("interaction_type").notNull(), // 'view', 'search', 'click', 'exam_start', 'exam_complete'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const subjectTrendingStats = pgTable("subject_trending_stats", {
  id: serial("id").primaryKey(),
  subjectSlug: text("subject_slug").notNull(),
  date: timestamp("date").notNull(),
  viewCount: integer("view_count").default(0),
  searchCount: integer("search_count").default(0),
  clickCount: integer("click_count").default(0),
  examStartCount: integer("exam_start_count").default(0),
  examCompleteCount: integer("exam_complete_count").default(0),
  trendingScore: integer("trending_score").default(0),
  // Fixed: Use numeric type for growth percentage instead of text
  growthPercentage: numeric("growth_percentage", { precision: 5, scale: 2 }).default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const dailyTrendingSnapshot = pgTable("daily_trending_snapshot", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  // Fixed: Use JSONB for top subjects instead of text
  topSubjects: jsonb("top_subjects").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fixed: Indexes will be added via migrations - keeping schema simple for now

export const insertCategorySchema = createInsertSchema(categories, {
  createdAt: undefined,
});

export const insertSubcategorySchema = createInsertSchema(subcategories, {
  createdAt: undefined,
});

export const insertSubjectSchema = createInsertSchema(subjects, {
  examCount: undefined,
  questionCount: undefined,
});

export const insertExamSchema = createInsertSchema(exams);

export const insertQuestionSchema = createInsertSchema(questions, {
  id: undefined,
});
// Fixed: Removed .refine() validation to restore .extend() functionality
// Validation will be handled in admin components separately

export const insertExamSessionSchema = createInsertSchema(examSessions, {
  id: undefined,
  startedAt: undefined,
  completedAt: undefined,
});
// Fixed: Removed forced optional override - userName should follow table schema nullability

export const insertCommentSchema = createInsertSchema(comments, {
  id: undefined,
  createdAt: undefined,
});

export const insertUserSchema = createInsertSchema(users, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  emailVerificationToken: undefined,
  emailVerificationExpires: undefined,
  passwordResetToken: undefined,
  passwordResetExpires: undefined,
  failedLoginAttempts: undefined,
  lockedUntil: undefined,
  loginCount: undefined,
  lastLoginAt: undefined,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  id: undefined,
  createdAt: undefined,
  lastActiveAt: undefined,
});

export const insertDetailedAnswerSchema = createInsertSchema(detailedAnswers, {
  id: undefined,
  answeredAt: undefined,
});

export const insertExamAnalyticsSchema = createInsertSchema(examAnalytics, {
  id: undefined,
  completedAt: undefined,
});

export const insertPerformanceTrendsSchema = createInsertSchema(performanceTrends, {
  id: undefined,
  createdAt: undefined,
});

export const insertStudyRecommendationsSchema = createInsertSchema(studyRecommendations, {
  id: undefined,
  createdAt: undefined,
});

export const insertAuthLogSchema = createInsertSchema(authLogs, {
  id: undefined,
  createdAt: undefined,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions, {
  id: undefined,
  createdAt: undefined,
  lastUsedAt: undefined,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  id: undefined,
  timestamp: undefined,
});

export const insertUserSubjectInteractionSchema = createInsertSchema(userSubjectInteractions, {
  id: undefined,
  timestamp: undefined,
});

export const insertSubjectTrendingStatsSchema = createInsertSchema(subjectTrendingStats, {
  id: undefined,
  lastUpdated: undefined,
});

export const insertDailyTrendingSnapshotSchema = createInsertSchema(dailyTrendingSnapshot, {
  id: undefined,
  createdAt: undefined,
});

export const insertAnonQuestionSessionSchema = createInsertSchema(anonQuestionSessions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export const insertUploadSchema = createInsertSchema(uploads, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type ExamSession = typeof examSessions.$inferSelect;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Authentication Types
export type AuthLog = typeof authLogs.$inferSelect;
export type InsertAuthLog = z.infer<typeof insertAuthLogSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;

// Audit Log Types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Analytics Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type DetailedAnswer = typeof detailedAnswers.$inferSelect;
export type InsertDetailedAnswer = z.infer<typeof insertDetailedAnswerSchema>;
export type ExamAnalytics = typeof examAnalytics.$inferSelect;
export type InsertExamAnalytics = z.infer<typeof insertExamAnalyticsSchema>;
export type PerformanceTrends = typeof performanceTrends.$inferSelect;
export type InsertPerformanceTrends = z.infer<typeof insertPerformanceTrendsSchema>;
export type StudyRecommendations = typeof studyRecommendations.$inferSelect;
export type InsertStudyRecommendations = z.infer<typeof insertStudyRecommendationsSchema>;

// Trending Types
export type UserSubjectInteraction = typeof userSubjectInteractions.$inferSelect;
export type InsertUserSubjectInteraction = z.infer<typeof insertUserSubjectInteractionSchema>;
export type SubjectTrendingStats = typeof subjectTrendingStats.$inferSelect;
export type InsertSubjectTrendingStats = z.infer<typeof insertSubjectTrendingStatsSchema>;
export type DailyTrendingSnapshot = typeof dailyTrendingSnapshot.$inferSelect;
export type InsertDailyTrendingSnapshot = z.infer<typeof insertDailyTrendingSnapshotSchema>;

// Anonymous Question Session Types
export type AnonQuestionSession = typeof anonQuestionSessions.$inferSelect;
export type InsertAnonQuestionSession = z.infer<typeof insertAnonQuestionSessionSchema>;

// Upload Types
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;

// User Role Types (enum)
export type UserRole = typeof userRoles.enumValues[number];