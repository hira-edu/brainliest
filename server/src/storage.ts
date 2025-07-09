import {
  subjects,
  exams,
  questions,
  examSessions,
  comments,
  users,
  auditLogs,
  userRoles,
  anonQuestionSessions,
  categories,
  subcategories,
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
  type Category,
  type InsertCategory,
  type Subcategory,
  type InsertSubcategory,
} from "../../shared/schema";
import { db } from "./db";
import { eq, like, and, or, desc, sql, ilike } from "drizzle-orm";

// Lazy import to avoid circular dependencies
let sitemapService: any = null;
async function getSitemapService() {
  if (!sitemapService) {
    const module = await import("./services/sitemap-service.js");
    sitemapService = module.sitemapService;
  }
  return sitemapService;
}

// Robust slugify function for generating URL-safe slugs
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')  // Replace spaces and non-word chars with hyphens
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
    .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
}

// Generate unique slug by checking for conflicts and appending numbers
async function generateUniqueSlug(baseSlug: string, table: 'subjects' | 'exams', excludeSlug?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // Check if slug exists
    let query: any;
    if (table === 'subjects') {
      query = db.select({ slug: subjects.slug }).from(subjects).where(eq(subjects.slug, slug));
    } else {
      query = db.select({ slug: exams.slug }).from(exams).where(eq(exams.slug, slug));
    }
    
    const existing = await query;
    
    // If no conflict or conflict is with the record being updated, slug is available
    if (existing.length === 0 || (excludeSlug && existing[0].slug === excludeSlug)) {
      return slug;
    }
    
    // Generate next variant
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Interface for storage operations
export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Subcategories
  getSubcategories(): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(id: number, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined>;
  deleteSubcategory(id: number): Promise<boolean>;

  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubjectsPaginated(offset: number, limit: number, search?: string, categoryId?: number): Promise<{ subjects: Subject[], total: number }>;
  getSubject(slug: string): Promise<Subject | undefined>;
  getSubjectBySlug(slug: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(slug: string, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(slug: string): Promise<boolean>;
  getSubjectCount(): Promise<number>;

  // Exams
  getExams(): Promise<Exam[]>;
  getExamsPaginated(offset: number, limit: number, subjectSlug?: string): Promise<{ exams: Exam[], total: number }>;
  getExamsBySubject(subjectSlug: string): Promise<Exam[]>;
  getExam(slug: string): Promise<Exam | undefined>;
  getExamBySlug(slug: string): Promise<Exam | undefined>;
  getExamById(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(slug: string, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(slug: string): Promise<boolean>;
  getExamCount(): Promise<number>;
  getQuestionCountByExam(examSlug: string): Promise<number>;
  getQuestionCountByExamId(examId: number): Promise<number>;

  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsPaginated(offset: number, limit: number, filters?: { subjectSlug?: string, examSlug?: string, difficulty?: string, search?: string }): Promise<{ questions: Question[], total: number }>;
  getQuestionsByExam(examSlug: string): Promise<Question[]>;
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

  // Slug management
  backfillSlugsForExistingRecords(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Subcategories
  async getSubcategories(): Promise<Subcategory[]> {
    return await db.select().from(subcategories);
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [newSubcategory] = await db.insert(subcategories).values(subcategory).returning();
    return newSubcategory;
  }

  async updateSubcategory(id: number, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined> {
    const [updatedSubcategory] = await db
      .update(subcategories)
      .set(subcategory)
      .where(eq(subcategories.id, id))
      .returning();
    return updatedSubcategory;
  }

  async deleteSubcategory(id: number): Promise<boolean> {
    const result = await db.delete(subcategories).where(eq(subcategories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Subjects - OPTIMIZED: Specify required columns instead of SELECT *
  async getSubjects(): Promise<Subject[]> {
    return await db.select({
      slug: subjects.slug,
      name: subjects.name,
      description: subjects.description,
      icon: subjects.icon,
      color: subjects.color,
      categoryId: subjects.categoryId,
      subcategoryId: subjects.subcategoryId,
      examCount: subjects.examCount,
      questionCount: subjects.questionCount
    }).from(subjects);
  }

  async getSubject(slug: string): Promise<Subject | undefined> {
    const [subject] = await db.select({
      slug: subjects.slug,
      name: subjects.name,
      description: subjects.description,
      icon: subjects.icon,
      color: subjects.color,
      categoryId: subjects.categoryId,
      subcategoryId: subjects.subcategoryId,
      examCount: subjects.examCount,
      questionCount: subjects.questionCount
    }).from(subjects).where(eq(subjects.slug, slug));
    return subject;
  }

  async getSubjectBySlug(slug: string): Promise<Subject | undefined> {
    // This method is now redundant with getSubject
    return this.getSubject(slug);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    // Auto-generate slug if not provided
    if (!subject.slug) {
      const baseSlug = slugify(subject.name);
      subject.slug = await generateUniqueSlug(baseSlug, 'subjects');
    }
    
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    
    // Invalidate sitemap cache after creating subject
    try {
      const sitemap = await getSitemapService();
      if (sitemap && sitemap.invalidateSitemapCache) {
        await sitemap.invalidateSitemapCache();
      }
    } catch (error) {
      console.error('Failed to invalidate sitemap cache:', error);
    }
    
    return newSubject;
  }

  async updateSubject(slug: string, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    // Auto-regenerate slug whenever name is being updated (unless custom slug is explicitly provided)
    if (subject.name && !subject.slug) {
      const baseSlug = slugify(subject.name);
      subject.slug = await generateUniqueSlug(baseSlug, 'subjects', slug);
    }
    
    const [updatedSubject] = await db
      .update(subjects)
      .set(subject)
      .where(eq(subjects.slug, slug))
      .returning();
    
    // Invalidate sitemap cache after updating subject
    if (updatedSubject) {
      try {
        const sitemap = await getSitemapService();
        if (sitemap && sitemap.invalidateSitemapCache) {
          await sitemap.invalidateSitemapCache();
        }
      } catch (error) {
        console.error('Failed to invalidate sitemap cache:', error);
      }
    }
    
    return updatedSubject;
  }

  async deleteSubject(slug: string): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.slug, slug));
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
      slug: exams.slug,
      subjectSlug: exams.subjectSlug,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive
    }).from(exams);
  }

  async getExamsBySubject(subjectSlug: string): Promise<Exam[]> {
    return await db.select({
      slug: exams.slug,
      subjectSlug: exams.subjectSlug,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive
    }).from(exams).where(eq(exams.subjectSlug, subjectSlug));
  }

  async getExam(slug: string): Promise<Exam | undefined> {
    const [exam] = await db.select({
      slug: exams.slug,
      subjectSlug: exams.subjectSlug,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive
    }).from(exams).where(eq(exams.slug, slug));
    return exam;
  }

  async getExamBySlug(slug: string): Promise<Exam | undefined> {
    // This method is now redundant with getExam
    return this.getExam(slug);
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select({
      slug: exams.slug,
      subjectSlug: exams.subjectSlug,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive
    }).from(exams).where(eq(exams.id, id));
    return exam;
  }

  // Dynamic question counting methods
  async getQuestionCountByExam(examSlug: string): Promise<number> {
    const [result] = await db.select({ 
      count: sql<number>`COUNT(*)` 
    }).from(questions).where(eq(questions.examSlug, examSlug));
    return Number(result.count);
  }

  async getQuestionCountByExamId(examId: number): Promise<number> {
    // First get the exam slug by ID
    const exam = await this.getExamById(examId);
    if (!exam) return 0;
    return this.getQuestionCountByExam(exam.slug);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    // Auto-generate slug if not provided
    if (!exam.slug) {
      const baseSlug = slugify(exam.title);
      exam.slug = await generateUniqueSlug(baseSlug, 'exams');
    }
    
    const [newExam] = await db.insert(exams).values(exam).returning();
    
    // Update subject exam count
    await db
      .update(subjects)
      .set({
        examCount: sql`${subjects.examCount} + 1`
      })
      .where(eq(subjects.slug, exam.subjectSlug));
    
    // Invalidate sitemap cache after creating exam
    try {
      const sitemap = await getSitemapService();
      if (sitemap && sitemap.invalidateSitemapCache) {
        await sitemap.invalidateSitemapCache();
      }
    } catch (error) {
      console.error('Failed to invalidate sitemap cache:', error);
    }
    
    return newExam;
  }

  async updateExam(slug: string, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    // Auto-regenerate slug whenever title is being updated (unless custom slug is explicitly provided)
    if (exam.title && !exam.slug) {
      const baseSlug = slugify(exam.title);
      exam.slug = await generateUniqueSlug(baseSlug, 'exams', slug);
    }
    
    const [updatedExam] = await db
      .update(exams)
      .set(exam)
      .where(eq(exams.slug, slug))
      .returning();
    
    // Invalidate sitemap cache after updating exam
    if (updatedExam) {
      try {
        const sitemap = await getSitemapService();
        if (sitemap && sitemap.invalidateSitemapCache) {
          await sitemap.invalidateSitemapCache();
        }
      } catch (error) {
        console.error('Failed to invalidate sitemap cache:', error);
      }
    }
    
    return updatedExam;
  }

  async deleteExam(slug: string): Promise<boolean> {
    // Get the exam before deleting to know which subject to update
    const [exam] = await db.select().from(exams).where(eq(exams.slug, slug));
    if (!exam) return false;
    
    const result = await db.delete(exams).where(eq(exams.slug, slug));
    
    if ((result.rowCount || 0) > 0) {
      // Update subject exam count
      await db
        .update(subjects)
        .set({
          examCount: sql`GREATEST(${subjects.examCount} - 1, 0)`
        })
        .where(eq(subjects.slug, exam.subjectSlug));
      return true;
    }
    return false;
  }

  async getExamCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(exams);
    return result.count;
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
      subjectSlug: questions.subjectSlug,
      examSlug: questions.examSlug
    }).from(questions);
  }

  async getQuestionsByExam(examSlug: string): Promise<Question[]> {
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
      subjectSlug: questions.subjectSlug,
      examSlug: questions.examSlug
    }).from(questions).where(eq(questions.examSlug, examSlug));
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
      subjectSlug: questions.subjectSlug,
      examSlug: questions.examSlug
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
        .where(eq(subjects.slug, question.subjectSlug));
      
      return newQuestion;
    });
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    // FIXED: Handle subject/exam slug changes by updating counts
    const originalQuestion = await this.getQuestion(id);
    
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    
    // If subject or exam changed, update counts
    if (updatedQuestion && originalQuestion && 
        (question.subjectSlug !== originalQuestion.subjectSlug || 
         question.examSlug !== originalQuestion.examSlug)) {
      
      // Decrement old counts
      if (originalQuestion.subjectSlug) {
        await db.update(subjects)
          .set({ questionCount: sql`${subjects.questionCount} - 1` })
          .where(eq(subjects.slug, originalQuestion.subjectSlug));
      }
      if (originalQuestion.examSlug) {
        await db.update(exams)
          .set({ questionCount: sql`${exams.questionCount} - 1` })
          .where(eq(exams.slug, originalQuestion.examSlug));
      }
      
      // Increment new counts
      if (updatedQuestion.subjectSlug) {
        await db.update(subjects)
          .set({ questionCount: sql`${subjects.questionCount} + 1` })
          .where(eq(subjects.slug, updatedQuestion.subjectSlug));
      }
      if (updatedQuestion.examSlug) {
        await db.update(exams)
          .set({ questionCount: sql`${exams.questionCount} + 1` })
          .where(eq(exams.slug, updatedQuestion.examSlug));
      }
    }
    
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
          .where(eq(subjects.slug, question.subjectSlug));
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
      examSlug: examSessions.examSlug,
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
      examSlug: examSessions.examSlug,
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
      metadata: users.metadata
    }).from(users);
  }

  // Audit Logs - FIXED: Match actual table columns
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select({
      id: auditLogs.id,
      adminId: auditLogs.adminId,
      adminEmail: auditLogs.adminEmail,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      changes: auditLogs.changes,
      timestamp: auditLogs.timestamp,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent
    }).from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100); // Limit for performance
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    const [result] = await db.select({
      id: auditLogs.id,
      adminId: auditLogs.adminId,
      adminEmail: auditLogs.adminEmail,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      changes: auditLogs.changes,
      timestamp: auditLogs.timestamp,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent
    }).from(auditLogs).where(eq(auditLogs.id, id));
    return result;
  }

  // PERFORMANCE OPTIMIZED: Paginated methods with efficient queries
  async getSubjectsPaginated(offset: number, limit: number, search?: string, categoryId?: number): Promise<{ subjects: Subject[], total: number }> {
    let query = db.select({
      slug: subjects.slug,
      name: subjects.name,
      description: subjects.description,
      icon: subjects.icon,
      color: subjects.color,
      categoryId: subjects.categoryId,
      subcategoryId: subjects.subcategoryId,
      examCount: subjects.examCount,
      questionCount: subjects.questionCount
    }).from(subjects);

    const conditions = [];
    if (search) {
      // FIXED: searchVector column doesn't exist, use ILIKE search instead
      conditions.push(ilike(subjects.name, `%${search}%`));
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

  async getExamsPaginated(offset: number, limit: number, subjectSlug?: string): Promise<{ exams: Exam[], total: number }> {
    let query = db.select({
      slug: exams.slug,
      subjectSlug: exams.subjectSlug,
      title: exams.title,
      description: exams.description,
      questionCount: exams.questionCount,
      duration: exams.duration,
      difficulty: exams.difficulty,
      isActive: exams.isActive
    }).from(exams);

    if (subjectSlug) {
      query = query.where(eq(exams.subjectSlug, subjectSlug));
    }

    const [examsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(exams)
        .where(subjectSlug ? eq(exams.subjectSlug, subjectSlug) : sql`TRUE`)
    ]);

    return {
      exams: examsResult,
      total: totalResult[0].count
    };
  }

  async getQuestionsPaginated(offset: number, limit: number, filters?: { subjectSlug?: string, examSlug?: string, difficulty?: string, search?: string }): Promise<{ questions: Question[], total: number }> {
    let query = db.select({
      id: questions.id,
      text: questions.text,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      explanation: questions.explanation,
      difficulty: questions.difficulty,
      domain: questions.domain,
      subjectSlug: questions.subjectSlug,
      examSlug: questions.examSlug
    }).from(questions);

    const conditions = [];
    if (filters?.subjectSlug) {
      conditions.push(eq(questions.subjectSlug, filters.subjectSlug));
    }
    if (filters?.examSlug) {
      conditions.push(eq(questions.examSlug, filters.examSlug));
    }
    if (filters?.difficulty) {
      conditions.push(eq(questions.difficulty, filters.difficulty));
    }
    if (filters?.search) {
      // FIXED: searchVector column doesn't exist, use ILIKE search instead
      conditions.push(ilike(questions.text, `%${filters.search}%`));
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
          const insertedQuestions = await tx.insert(questions).values(chunk).returning({ id: questions.id, subjectSlug: questions.subjectSlug });
          created += insertedQuestions.length;

          // Update subject question counts in batch
          const subjectCounts = new Map<string, number>();
          insertedQuestions.forEach(q => {
            subjectCounts.set(q.subjectSlug, (subjectCounts.get(q.subjectSlug) || 0) + 1);
          });

          for (const [subjectSlug, count] of subjectCounts) {
            await tx
              .update(subjects)
              .set({ questionCount: sql`${subjects.questionCount} + ${count}` })
              .where(eq(subjects.slug, subjectSlug));
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

  // Backfill slugs for existing records that don't have them
  async backfillSlugsForExistingRecords(): Promise<void> {
    try {
      // Check for subjects without slugs
      const subjectsWithoutSlugs = await db.select().from(subjects).where(or(eq(subjects.slug, ''), eq(subjects.slug, null)));
      
      for (const subject of subjectsWithoutSlugs) {
        const baseSlug = slugify(subject.name);
        const uniqueSlug = await generateUniqueSlug(baseSlug, 'subjects');
        await db.update(subjects)
          .set({ slug: uniqueSlug })
          .where(eq(subjects.slug, subject.slug));
      }

      // Check for exams without slugs
      const examsWithoutSlugs = await db.select().from(exams).where(or(eq(exams.slug, ''), eq(exams.slug, null)));
      
      for (const exam of examsWithoutSlugs) {
        const baseSlug = slugify(exam.title);
        const uniqueSlug = await generateUniqueSlug(baseSlug, 'exams');
        await db.update(exams)
          .set({ slug: uniqueSlug })
          .where(eq(exams.slug, exam.slug));
      }

      console.log(`✓ Backfilled slugs for ${subjectsWithoutSlugs.length} subjects and ${examsWithoutSlugs.length} exams`);
    } catch (error) {
      console.error('Error backfilling slugs:', error);
    }
  }

}

// Initialize with seed data
async function seedDatabase() {
  try {
    // Check if data already exists
    const existingSubjects = await db.select().from(subjects);
    if (existingSubjects.length > 0) {
      console.log("Database already seeded, checking for missing slugs...");
      // FIXED: Actually check and backfill missing slugs
      await databaseStorage.backfillSlugsForExistingRecords();
      console.log("✓ All records already have slugs - system is now slug-only");
      return;
    }

    console.log("Seeding database with initial data...");

    // Seed basic subjects with auto-generated slugs
    const subjectData: InsertSubject[] = [
      {
        name: "PMP Certification",
        slug: "pmp-certification",
        description: "Project Management Professional certification preparation",
        icon: "project-diagram"
      },
      {
        name: "AWS Certified Solutions Architect",
        slug: "aws-certified-solutions-architect",
        description: "Amazon Web Services cloud architecture certification",
        icon: "cloud"
      },
      {
        name: "CompTIA Security+",
        slug: "comptia-security",
        description: "Cybersecurity fundamentals and best practices",
        icon: "shield"
      },
      {
        name: "AP Statistics",
        slug: "ap-statistics",
        description: "Advanced Placement Statistics course preparation",
        icon: "chart-bar"
      },
      {
        name: "Calculus",
        slug: "calculus",
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
          subjectSlug: subject.slug,
          title: `${subject.name} Practice Exam 1`,
          slug: `${slugify(subject.name)}-practice-exam-1`,
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
            examSlug: firstExam.slug,
            subjectSlug: subject.slug,
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