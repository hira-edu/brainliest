import {
  subjects,
  exams,
  questions,
  examSessions,
  comments,
  users,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Exams
  getExams(): Promise<Exam[]>;
  getExamsBySubject(subjectId: number): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;

  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

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
}

export class DatabaseStorage implements IStorage {
  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
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

  // Exams
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams);
  }

  async getExamsBySubject(subjectId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.subjectId, subjectId));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
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
    const result = await db.delete(exams).where(eq(exams.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Questions
  async getQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.examId, examId));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Exam Sessions
  async getExamSessions(): Promise<ExamSession[]> {
    return await db.select().from(examSessions);
  }

  async getExamSession(id: number): Promise<ExamSession | undefined> {
    const [session] = await db.select().from(examSessions).where(eq(examSessions.id, id));
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

  // Comments
  async getComments(): Promise<Comment[]> {
    return await db.select().from(comments);
  }

  async getCommentsByQuestion(questionId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.questionId, questionId));
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
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

  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
      return await db.select().from(users).where(and(...conditions));
    }

    return await db.select().from(users);
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
    const subjectData: InsertSubject[] = [
      {
        name: "PMP Certification",
        description: "Project Management Professional certification preparation",
        icon: "project-diagram"
      },
      {
        name: "AWS Certified Solutions Architect",
        description: "Amazon Web Services cloud architecture certification",
        icon: "cloud"
      },
      {
        name: "CompTIA Security+",
        description: "Cybersecurity fundamentals and best practices",
        icon: "shield"
      },
      {
        name: "AP Statistics",
        description: "Advanced Placement Statistics course preparation",
        icon: "chart-bar"
      },
      {
        name: "Calculus",
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