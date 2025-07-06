import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  examCount: integer("exam_count").default(0),
  questionCount: integer("question_count").default(0),
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  questionCount: integer("question_count").notNull(),
  duration: integer("duration"), // in minutes
  difficulty: text("difficulty").notNull(), // 'Beginner', 'Intermediate', 'Advanced', 'Expert'
  isActive: boolean("is_active").default(true),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  text: text("text").notNull(),
  options: text("options").array().notNull(), // Array of option texts
  correctAnswer: integer("correct_answer").notNull(), // Index of correct option (0-based)
  explanation: text("explanation"),
  domain: text("domain"), // For PMP: 'Initiating', 'Planning', etc.
  difficulty: text("difficulty").notNull(),
  order: integer("order").default(0),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
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
  examId: integer("exam_id").notNull(),
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
  subjectId: integer("subject_id").notNull(),
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
  subjectId: integer("subject_id").notNull(),
  recommendationType: text("recommendation_type").notNull(), // "focus_area", "review", "strength"
  content: text("content").notNull(),
  priority: integer("priority").default(1), // 1-5 scale
  domains: text("domains"), // JSON array string
  estimatedImpact: text("estimated_impact"), // stored as string, e.g., "15.5"
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  examCount: true,
  questionCount: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
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

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

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
