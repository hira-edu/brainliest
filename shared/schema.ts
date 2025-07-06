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
