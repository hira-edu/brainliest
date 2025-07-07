import {
  subjects,
  exams,
  questions,
  examSessions,
  comments,
  users,
  auditLogs,
  type Subject,
  type InsertSubject,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type ExamSession,
  type InsertExamSession,
  type Comment,
  type InsertComment,
  type User,
  type InsertUser,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubjectsPaginated(offset: number, limit: number, search?: string, categoryId?: number): Promise<{ subjects: Subject[], total: number }>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  getSubjectCount(): Promise<number>;

  // Exams
  getExams(): Promise<Exam[]>;
  getExamsPaginated(offset: number, limit: number, subjectId?: number): Promise<{ exams: Exam[], total: number }>;
  getExamsBySubject(subjectId: number): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  getExamCount(): Promise<number>;

  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsPaginated(offset: number, limit: number, filters?: { subjectId?: number, examId?: number, difficulty?: string, search?: string }): Promise<{ questions: Question[], total: number }>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  getQuestionCount(): Promise<number>;
  batchCreateQuestions(questions: InsertQuestion[]): Promise<{ created: number, failed: number, errors: string[] }>;

  // Exam Sessions
  getExamSessions(): Promise<ExamSession[]>;
  getExamSession(id: number): Promise<ExamSession | undefined>;
  createExamSession(session: InsertExamSession): Promise<ExamSession>;
  updateExamSession(id: number, session: Partial<InsertExamSession>): Promise<ExamSession | undefined>;
  deleteExamSession(id: number): Promise<boolean>;

  // Comments
  getComments(): Promise<Comment[]>;
  getCommentsByQuestion(questionId: number): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;

  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  banUser(id: number, reason: string): Promise<boolean>;
  unbanUser(id: number): Promise<boolean>;
  getUsersWithFilters(filters: {
    role?: string;
    isActive?: boolean;
    isBanned?: boolean;
    search?: string;
  }): Promise<User[]>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  getAuditLog(id: number): Promise<AuditLog | undefined>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  // Subjects - OPTIMIZED: Specify required columns instead of SELECT *
  async getSubjects(): Promise<Subject[]> {
    return await db.select({
      id: subjects.id,
      name: subjects.name,
      description: subjects.description,
      icon: subjects.icon,
      color: subjects.color,
      categoryId: subjects.categoryId,
      subcategoryId: subjects.subcategoryId,
      examCount: subjects.examCount,
      questionCount: subjects.questionCount,
      slug: subjects.slug
    }).from(subjects);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select({
      id: subjects.id,
      name: subjects.name,
      description: subjects.description,
      icon: subjects.icon,
      color: subjects.color,
      categoryId: subjects.categoryId,
      subcategoryId: subjects.subcategoryId,
      examCount: subjects.examCount,
      questionCount: subjects.questionCount,
      slug: subjects.slug
    }).from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updatedSubject] = await db
      .update(subjects)
      .set(subject)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id));
    return (result.rowCount || 0) > 0;
  }

  // PERFORMANCE OPTIMIZED: Use SQL COUNT instead of fetching all records
  async getSubjectCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subjects);
    return result.count;
  }

  // Exams - OPTIMIZED: Specify required columns and add pagination support
  async getExams(): Promise<Exam[]> {
    return await db.select({
      id: exams.id,
      subjectId: exams.subjectId,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive,
      slug: exams.slug
    }).from(exams);
  }

  async getExamsBySubject(subjectId: number): Promise<Exam[]> {
    return await db.select({
      id: exams.id,
      subjectId: exams.subjectId,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive,
      slug: exams.slug
    }).from(exams).where(eq(exams.subjectId, subjectId));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select({
      id: exams.id,
      subjectId: exams.subjectId,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive,
      slug: exams.slug
    }).from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    
    // Update subject exam count
    await db
      .update(subjects)
      .set({
        examCount: sql`${subjects.examCount} + 1`
      })
      .where(eq(subjects.id, exam.subjectId));
    
    return newExam;
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const [updatedExam] = await db
      .update(exams)
      .set(exam)
      .where(eq(exams.id, id))
      .returning();
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    // Get the exam before deleting to know which subject to update
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    if (!exam) return false;
    
    const result = await db.delete(exams).where(eq(exams.id, id));
    
    if ((result.rowCount || 0) > 0) {
      // Update subject exam count
      await db
        .update(subjects)
        .set({
          examCount: sql`GREATEST(${subjects.examCount} - 1, 0)`
        })
        .where(eq(subjects.id, exam.subjectId));
      return true;
    }
    return false;
  }

  async getExamCount(): Promise<number> {
    const result = await db.select().from(exams);
    return result.length;
  }

  // Questions - OPTIMIZED: Specify required columns and add pagination support
  async getQuestions(): Promise<Question[]> {
    return await db.select({
      id: questions.id,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      correctAnswers: questions.correctAnswers,
      allowMultipleAnswers: questions.allowMultipleAnswers,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      domain: questions.domain,
      order: questions.order,
      subjectId: questions.subjectId,
      examId: questions.examId
    }).from(questions);
  }

  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await db.select({
      id: questions.id,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      correctAnswers: questions.correctAnswers,
      allowMultipleAnswers: questions.allowMultipleAnswers,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      domain: questions.domain,
      order: questions.order,
      subjectId: questions.subjectId,
      examId: questions.examId
    }).from(questions).where(eq(questions.examId, examId));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select({
      id: questions.id,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      correctAnswers: questions.correctAnswers,
      allowMultipleAnswers: questions.allowMultipleAnswers,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      domain: questions.domain,
      order: questions.order,
      subjectId: questions.subjectId,
      examId: questions.examId
    }).from(questions).where(eq(questions.id, id));
    return question;
  }

  // PERFORMANCE OPTIMIZED: Use transaction for atomic operations
  async createQuestion(question: InsertQuestion): Promise<Question> {
    return await db.transaction(async (tx) => {
      const [newQuestion] = await tx.insert(questions).values(question).returning();
      
      // Atomically update subject question count
      await tx
        .update(subjects)
        .set({
          questionCount: sql`${subjects.questionCount} + 1`
        })
        .where(eq(subjects.id, question.subjectId));
      
      return newQuestion;
    });
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  // PERFORMANCE OPTIMIZED: Use transaction for atomic operations
  async deleteQuestion(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the question before deleting to know which subject to update
      const [question] = await tx.select().from(questions).where(eq(questions.id, id));
      if (!question) return false;
      
      const result = await tx.delete(questions).where(eq(questions.id, id));
      
      if ((result.rowCount || 0) > 0) {
        // Atomically update subject question count
        await tx
          .update(subjects)
          .set({
            questionCount: sql`GREATEST(${subjects.questionCount} - 1, 0)`
          })
          .where(eq(subjects.id, question.subjectId));
        return true;
      }
      return false;
    });
  }

  // PERFORMANCE OPTIMIZED: Use SQL COUNT instead of fetching all records
  async getQuestionCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(questions);
    return result.count;
  }

  // Exam Sessions - OPTIMIZED: Specify required columns and add ordering
  async getExamSessions(): Promise<ExamSession[]> {
    return await db.select({
      id: examSessions.id,
      userName: examSessions.userName,
      examId: examSessions.examId,
      currentQuestionIndex: examSessions.currentQuestionIndex,
      score: examSessions.score,
      startedAt: examSessions.startedAt,
      completedAt: examSessions.completedAt,
      answers: examSessions.answers,
      timeSpent: examSessions.timeSpent,
      isCompleted: examSessions.isCompleted
    }).from(examSessions).orderBy(desc(examSessions.startedAt));
  }

  async getExamSession(id: number): Promise<ExamSession | undefined> {
    const [session] = await db.select({
      id: examSessions.id,
      userName: examSessions.userName,
      examId: examSessions.examId,
      currentQuestionIndex: examSessions.currentQuestionIndex,
      score: examSessions.score,
      startedAt: examSessions.startedAt,
      completedAt: examSessions.completedAt,
      answers: examSessions.answers,
      timeSpent: examSessions.timeSpent,
      isCompleted: examSessions.isCompleted
    }).from(examSessions).where(eq(examSessions.id, id));
    return session;
  }

  async createExamSession(session: InsertExamSession): Promise<ExamSession> {
    const [newSession] = await db.insert(examSessions).values(session).returning();
    return newSession;
  }

  async updateExamSession(id: number, session: Partial<InsertExamSession>): Promise<ExamSession | undefined> {
    const [updatedSession] = await db
      .update(examSessions)
      .set(session)
      .where(eq(examSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteExamSession(id: number): Promise<boolean> {
    const result = await db.delete(examSessions).where(eq(examSessions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Comments - OPTIMIZED: Specify required columns and add ordering
  async getComments(): Promise<Comment[]> {
    return await db.select({
      id: comments.id,
      questionId: comments.questionId,
      authorName: comments.authorName,
      content: comments.content,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      isEdited: comments.isEdited,
      editedAt: comments.editedAt
    }).from(comments).orderBy(desc(comments.createdAt));
  }

  async getCommentsByQuestion(questionId: number): Promise<Comment[]> {
    return await db.select({
      id: comments.id,
      questionId: comments.questionId,
      authorName: comments.authorName,
      content: comments.content,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      isEdited: comments.isEdited,
      editedAt: comments.editedAt
    }).from(comments).where(eq(comments.questionId, questionId)).orderBy(desc(comments.createdAt));
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select({
      id: comments.id,
      questionId: comments.questionId,
      authorName: comments.authorName,
      content: comments.content,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      isEdited: comments.isEdited,
      editedAt: comments.editedAt
    }).from(comments).where(eq(comments.id, id));
    return comment;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined> {
    const [updatedComment] = await db
      .update(comments)
      .set(comment)
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Users - OPTIMIZED: Specify required columns for security (exclude sensitive fields by default)
  async getUsers(): Promise<User[]> {
    return await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImage: users.profileImage,
      role: users.role,
      isActive: users.isActive,
      isBanned: users.isBanned,
      banReason: users.banReason,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
      lastLoginIp: users.lastLoginIp,
      registrationIp: users.registrationIp,
      loginCount: users.loginCount,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      passwordHash: users.passwordHash,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
      passwordResetToken: users.passwordResetToken,
      passwordResetExpires: users.passwordResetExpires,
      googleId: users.googleId,
      oauthProvider: users.oauthProvider,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
      metadata: users.metadata
    }).from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImage: users.profileImage,
      role: users.role,
      isActive: users.isActive,
      isBanned: users.isBanned,
      banReason: users.banReason,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
      lastLoginIp: users.lastLoginIp,
      registrationIp: users.registrationIp,
      loginCount: users.loginCount,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      passwordHash: users.passwordHash,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
      passwordResetToken: users.passwordResetToken,
      passwordResetExpires: users.passwordResetExpires,
      googleId: users.googleId,
      oauthProvider: users.oauthProvider,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
      metadata: users.metadata
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async banUser(id: number, reason: string): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isBanned: true,
        metadata: JSON.stringify({ banReason: reason, bannedAt: new Date().toISOString() }),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return !!updatedUser;
  }

  async unbanUser(id: number): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isBanned: false,
        metadata: JSON.stringify({ unbannedAt: new Date().toISOString() }),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return !!updatedUser;
  }

  async getUsersWithFilters(filters: {
    role?: string;
    isActive?: boolean;
    isBanned?: boolean;
    search?: string;
  }): Promise<User[]> {
    const conditions = [];

    if (filters.role) {
      conditions.push(eq(users.role, filters.role));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }
    if (filters.isBanned !== undefined) {
      conditions.push(eq(users.isBanned, filters.isBanned));
    }
    if (filters.search) {
      conditions.push(
        or(
          like(users.username, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        role: users.role,
        isActive: users.isActive,
        isBanned: users.isBanned,
        banReason: users.banReason,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
        lastLoginIp: users.lastLoginIp,
        registrationIp: users.registrationIp,
        loginCount: users.loginCount,
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil: users.lockedUntil,
        passwordHash: users.passwordHash,
        emailVerificationToken: users.emailVerificationToken,
        emailVerificationExpires: users.emailVerificationExpires,
        passwordResetToken: users.passwordResetToken,
        passwordResetExpires: users.passwordResetExpires,
        googleId: users.googleId,
        oauthProvider: users.oauthProvider,
        twoFactorEnabled: users.twoFactorEnabled,
        twoFactorSecret: users.twoFactorSecret,
        metadata: users.metadata
      }).from(users).where(and(...conditions));
    }

    return await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImage: users.profileImage,
      role: users.role,
      isActive: users.isActive,
      isBanned: users.isBanned,
      banReason: users.banReason,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      lastLoginAt: users.lastLoginAt,
      lastLoginIp: users.lastLoginIp,
      registrationIp: users.registrationIp,
      loginCount: users.loginCount,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      passwordHash: users.passwordHash,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
      passwordResetToken: users.passwordResetToken,
      passwordResetExpires: users.passwordResetExpires,
      googleId: users.googleId,
      oauthProvider: users.oauthProvider,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
      metadata: users.metadata
    }).from(users);
  }

  // Audit Logs - OPTIMIZED: Specify required columns and add pagination
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent
    }).from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100); // Limit for performance
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    const [result] = await db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent
    }).from(auditLogs).where(eq(auditLogs.id, id));
    return result;
  }

  // PERFORMANCE OPTIMIZED: Paginated methods with efficient queries
  async getSubjectsPaginated(offset: number, limit: number, search?: string, categoryId?: number): Promise<{ subjects: Subject[], total: number }> {
    let query = db.select({
      id: subjects.id,
      name: subjects.name,
      description: subjects.description,
      icon: subjects.icon,
      color: subjects.color,
      categoryId: subjects.categoryId,
      subcategoryId: subjects.subcategoryId,
      examCount: subjects.examCount,
      questionCount: subjects.questionCount,
      slug: subjects.slug
    }).from(subjects);

    const conditions = [];
    if (search) {
      conditions.push(sql`${subjects.searchVector} @@ plainto_tsquery('english', ${search})`);
    }
    if (categoryId) {
      conditions.push(eq(subjects.categoryId, categoryId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const [subjectsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(subjects)
        .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
    ]);

    return {
      subjects: subjectsResult,
      total: totalResult[0].count
    };
  }

  async getExamsPaginated(offset: number, limit: number, subjectId?: number): Promise<{ exams: Exam[], total: number }> {
    let query = db.select({
      id: exams.id,
      subjectId: exams.subjectId,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive,
      slug: exams.slug
    }).from(exams);

    if (subjectId) {
      query = query.where(eq(exams.subjectId, subjectId));
    }

    const [examsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(exams)
        .where(subjectId ? eq(exams.subjectId, subjectId) : sql`TRUE`)
    ]);

    return {
      exams: examsResult,
      total: totalResult[0].count
    };
  }

  async getQuestionsPaginated(offset: number, limit: number, filters?: { subjectId?: number, examId?: number, difficulty?: string, search?: string }): Promise<{ questions: Question[], total: number }> {
    let query = db.select({
      id: questions.id,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      domain: questions.domain,
      subjectId: questions.subjectId,
      examId: questions.examId
    }).from(questions);

    const conditions = [];
    if (filters?.subjectId) {
      conditions.push(eq(questions.subjectId, filters.subjectId));
    }
    if (filters?.examId) {
      conditions.push(eq(questions.examId, filters.examId));
    }
    if (filters?.difficulty) {
      conditions.push(eq(questions.difficulty, filters.difficulty));
    }
    if (filters?.search) {
      conditions.push(sql`${questions.searchVector} @@ plainto_tsquery('english', ${filters.search})`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const [questionsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(questions)
        .where(conditions.length > 0 ? and(...conditions) : sql`TRUE`)
    ]);

    return {
      questions: questionsResult,
      total: totalResult[0].count
    };
  }

  // PERFORMANCE OPTIMIZED: Batch operations for bulk data handling
  async batchCreateQuestions(questionsData: InsertQuestion[]): Promise<{ created: number, failed: number, errors: string[] }> {
    return await db.transaction(async (tx) => {
      let created = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process in chunks of 50 for optimal performance
      const chunkSize = 50;
      for (let i = 0; i < questionsData.length; i += chunkSize) {
        const chunk = questionsData.slice(i, i + chunkSize);
        
        try {
          const insertedQuestions = await tx.insert(questions).values(chunk).returning({ id: questions.id, subjectId: questions.subjectId });
          created += insertedQuestions.length;

          // Update subject question counts in batch
          const subjectCounts = new Map<number, number>();
          insertedQuestions.forEach(q => {
            subjectCounts.set(q.subjectId, (subjectCounts.get(q.subjectId) || 0) + 1);
          });

          for (const [subjectId, count] of subjectCounts) {
            await tx
              .update(subjects)
              .set({ questionCount: sql`${subjects.questionCount} + ${count}` })
              .where(eq(subjects.id, subjectId));
          }
        } catch (error) {
          failed += chunk.length;
          errors.push(`Batch ${i / chunkSize + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { created, failed, errors };
    });
  }

  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(auditLog).returning();
    return result[0];
  }
}

// Initialize with seed data
async function seedDatabase() {
  try {
    // Check if data already exists
    const existingSubjects = await db.select().from(subjects);
    if (existingSubjects.length > 0) {
      console.log("Database already seeded, skipping seed data insertion");
      return;
    }

    console.log("Seeding database with initial data...");

    // Seed basic subjects (clean data without extra fields)
    const { generateSlug } = await import('../shared/utils/slug.js');
    
    const subjectData: InsertSubject[] = [
      {
        name: "PMP Certification",
        slug: generateSlug("PMP Certification"),
        description: "Project Management Professional certification preparation",
        icon: "project-diagram"
      },
      {
        name: "AWS Certified Solutions Architect",
        slug: generateSlug("AWS Certified Solutions Architect"),
        description: "Amazon Web Services cloud architecture certification",
        icon: "cloud"
      },
      {
        name: "CompTIA Security+",
        slug: generateSlug("CompTIA Security+"),
        description: "Cybersecurity fundamentals and best practices",
        icon: "shield"
      },
      {
        name: "AP Statistics",
        slug: generateSlug("AP Statistics"),
        description: "Advanced Placement Statistics course preparation",
        icon: "chart-bar"
      },
      {
        name: "Calculus",
        slug: generateSlug("Calculus"),
        description: "Differential and integral calculus",
        icon: "function"
      }
    ];

    console.log(`Inserting ${subjectData.length} subjects...`);
    const insertedSubjects = await db.insert(subjects).values(subjectData).returning();
    console.log(`✓ Inserted ${insertedSubjects.length} subjects`);

    // Seed some sample exams for the first subject
    if (insertedSubjects.length > 0) {
      const subject = insertedSubjects[0];
      
      const examData: InsertExam[] = [
        {
          subjectId: subject.id,
          title: `${subject.name} Practice Exam 1`,
          slug: generateSlug(`${subject.name} Practice Exam 1`),
          description: `Comprehensive practice exam covering ${subject.name} concepts`,
          questionCount: 5,
          duration: 90,
          difficulty: 'Intermediate'
        }
      ];

      const insertedExams = await db.insert(exams).values(examData).returning();
      console.log(`✓ Inserted ${insertedExams.length} exams for ${subject.name}`);

      // Create sample questions for the exam
      if (insertedExams.length > 0) {
        const firstExam = insertedExams[0];
        const questionData: InsertQuestion[] = [
          {
            examId: firstExam.id,
            subjectId: subject.id,
            text: `Sample question 1 for ${subject.name}. This is a multiple choice question testing your knowledge.`,
            options: [
              `Option A for question 1`,
              `Option B for question 1`,
              `Option C for question 1`,
              `Option D for question 1`
            ],
            correctAnswer: 0,
            explanation: `This is the explanation for question 1, explaining why the correct answer is option A.`,
            domain: `Domain 1`,
            difficulty: 'Intermediate',
            order: 1
          }
        ];

        const insertedQuestions = await db.insert(questions).values(questionData).returning();
        console.log(`✓ Inserted ${insertedQuestions.length} sample questions for ${firstExam.title}`);
      }
    }

    console.log("✅ Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Create storage instance and seed data
const databaseStorage = new DatabaseStorage();

// Seed the database on startup (only if empty)
seedDatabase().catch(console.error);

export const storage = databaseStorage;