import { pgTable, text, serial, integer, boolean, timestamp, index, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  categoryId: integer("category_id"),
  subcategoryId: integer("subcategory_id"),
  examCount: integer("exam_count").default(0),
  questionCount: integer("question_count").default(0),
});

export const exams = pgTable("exams", {
  slug: text("slug").primaryKey(),
  subjectSlug: text("subject_slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questionCount: integer("question_count").notNull(),
  duration: integer("duration"), // in minutes
  difficulty: text("difficulty").notNull(), // 'Beginner', 'Intermediate', 'Advanced', 'Expert'
  isActive: boolean("is_active").default(true),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examSlug: text("exam_slug").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  text: text("text").notNull(),
  options: text("options").array().notNull(), // Array of option texts
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option (0-based) or multiple if multipleCorrect is true
  correctAnswers: integer("correct_answers").array(), // Array of correct answer indexes for multiple-choice
  allowMultipleAnswers: boolean("allow_multiple_answers").default(false), // Whether question allows multiple selections
  explanation: text("explanation"),
  domain: text("domain"), // For PMP: 'Initiating', 'Planning', etc.
  difficulty: text("difficulty").notNull(),
  order: integer("order").default(0),
});

export const examSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  examSlug: text("exam_slug").notNull(),
  userName: text("user_name"), // Add userName field for compatibility
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  currentQuestionIndex: integer("current_question_index").default(0),
  answers: text("answers").array().default([]), // Array of user answers
  score: integer("score"),
  timeSpent: integer("time_spent"), // in seconds
  isCompleted: boolean("is_completed").default(false),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  parentId: integer("parent_id"), // For nested replies
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
});

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



// Audit logging table for enterprise compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(), // e.g., "POST /api/subjects", "DELETE /api/questions/123"
  resourceType: text("resource_type"), // 'subject', 'exam', 'question', 'user'
  resourceId: integer("resource_id"), // ID of affected resource
  changes: text("changes"), // JSON string of changes made
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
  averageScore: text("average_score").default("0"),
  strongestSubjects: text("strongest_subjects"),
  weakestSubjects: text("weakest_subjects"),
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
  score: text("score").notNull(), // stored as string, e.g., "85.5"
  timeSpent: integer("time_spent"), // in seconds
  completionRate: text("completion_rate"), // stored as string, e.g., "100.0"
  domainScores: text("domain_scores"), // JSON string { domain: score }
  difficultyBreakdown: text("difficulty_breakdown"), // JSON string { easy: x, medium: y, hard: z }
  streakData: text("streak_data"), // JSON string for longest correct/incorrect streaks
  completedAt: timestamp("completed_at").defaultNow(),
});

export const performanceTrends = pgTable("performance_trends", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  week: text("week").notNull(), // Start of week (YYYY-MM-DD format)
  examsTaken: integer("exams_taken").default(0),
  questionsAnswered: integer("questions_answered").default(0),
  averageScore: text("average_score"), // stored as string, e.g., "85.5"
  accuracyTrend: text("accuracy_trend"), // stored as string, e.g., "2.5"
  speedTrend: text("speed_trend"), // questions per minute as string
  strongDomains: text("strong_domains"), // JSON array string
  weakDomains: text("weak_domains"), // JSON array string
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyRecommendations = pgTable("study_recommendations", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull(),
  subjectSlug: text("subject_slug").notNull(),
  recommendationType: text("recommendation_type").notNull(), // "focus_area", "review", "strength"
  content: text("content").notNull(),
  priority: integer("priority").default(1), // 1-5 scale
  domains: text("domains"), // JSON array string
  estimatedImpact: text("estimated_impact"), // stored as string, e.g., "15.5"
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
  metadata: text("metadata"), // JSON string for additional data
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
  growthPercentage: text("growth_percentage").default("0%"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const dailyTrendingSnapshot = pgTable("daily_trending_snapshot", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  topSubjects: text("top_subjects").notNull(), // JSON string of top trending subjects
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  examCount: true,
  questionCount: true,
});

export const insertExamSchema = createInsertSchema(exams);

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertExamSessionSchema = createInsertSchema(examSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
}).extend({
  // Make userName optional for compatibility
  userName: z.string().optional(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerificationToken: true,
  emailVerificationExpires: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  loginCount: true,
  lastLoginAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export const insertDetailedAnswerSchema = createInsertSchema(detailedAnswers).omit({
  id: true,
  answeredAt: true,
});

export const insertExamAnalyticsSchema = createInsertSchema(examAnalytics).omit({
  id: true,
  completedAt: true,
});

export const insertPerformanceTrendsSchema = createInsertSchema(performanceTrends).omit({
  id: true,
  createdAt: true,
});

export const insertStudyRecommendationsSchema = createInsertSchema(studyRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertAuthLogSchema = createInsertSchema(authLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertUserSubjectInteractionSchema = createInsertSchema(userSubjectInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertSubjectTrendingStatsSchema = createInsertSchema(subjectTrendingStats).omit({
  id: true,
  lastUpdated: true,
});

export const insertDailyTrendingSnapshotSchema = createInsertSchema(dailyTrendingSnapshot).omit({
  id: true,
  createdAt: true,
});

export const insertAnonQuestionSessionSchema = createInsertSchema(anonQuestionSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type AnonQuestionSession = typeof anonQuestionSessions.$inferSelect;
export type InsertAnonQuestionSession = z.infer<typeof insertAnonQuestionSessionSchema>;