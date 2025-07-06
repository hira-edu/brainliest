import {
  subjects,
  exams,
  questions,
  userSessions,
  comments,
  users,
  type Subject,
  type InsertSubject,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type UserSession,
  type InsertUserSession,
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

  // User Sessions
  getUserSessions(): Promise<UserSession[]>;
  getUserSession(id: number): Promise<UserSession | undefined>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(id: number, session: Partial<InsertUserSession>): Promise<UserSession | undefined>;
  deleteUserSession(id: number): Promise<boolean>;

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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }

  // User Sessions
  async getUserSessions(): Promise<UserSession[]> {
    return await db.select().from(userSessions);
  }

  async getUserSession(id: number): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.id, id));
    return session;
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async updateUserSession(id: number, session: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const [updatedSession] = await db
      .update(userSessions)
      .set(session)
      .where(eq(userSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteUserSession(id: number): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.id, id));
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    let query = db.select().from(users);
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
      query = query.where(and(...conditions));
    }

    return await query;
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

    // Seed subjects with all 47 comprehensive subjects
    const subjectData: InsertSubject[] = [
      // Professional Certifications
      {
        name: "PMP Certification",
        description: "Project Management Professional certification preparation",
        icon: "project-diagram",
        examCount: 5,
        questionCount: 200
      },
      {
        name: "AWS Certified Solutions Architect",
        description: "Amazon Web Services cloud architecture certification",
        icon: "cloud",
        examCount: 4,
        questionCount: 180
      },
      {
        name: "CompTIA Security+",
        description: "Cybersecurity fundamentals and best practices",
        icon: "shield",
        examCount: 3,
        questionCount: 150
      },
      {
        name: "Cisco CCNA",
        description: "Cisco Certified Network Associate routing and switching",
        icon: "network-wired",
        examCount: 4,
        questionCount: 160
      },
      {
        name: "Microsoft Azure Fundamentals",
        description: "Microsoft Azure cloud services and architecture",
        icon: "cloud-arrow-up",
        examCount: 3,
        questionCount: 120
      },
      // Mathematics & Statistics
      {
        name: "AP Statistics",
        description: "Advanced Placement Statistics course preparation",
        icon: "chart-bar",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "Biostatistics",
        description: "Statistical methods in biological and health sciences",
        icon: "dna",
        examCount: 4,
        questionCount: 160
      },
      {
        name: "Business Statistics",
        description: "Statistical analysis for business decision making",
        icon: "trending-up",
        examCount: 5,
        questionCount: 200
      },
      {
        name: "Elementary Statistics",
        description: "Introduction to statistical concepts and methods",
        icon: "calculator",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Intro to Statistics",
        description: "Fundamental statistical principles and applications",
        icon: "bar-chart",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "Calculus",
        description: "Differential and integral calculus",
        icon: "function",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "Linear Algebra",
        description: "Vector spaces, matrices, and linear transformations",
        icon: "grid",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Geometry",
        description: "Euclidean and coordinate geometry principles",
        icon: "shapes",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "Discrete Mathematics",
        description: "Mathematical structures and discrete systems",
        icon: "dots-three",
        examCount: 7,
        questionCount: 280
      },
      {
        name: "Pre-Calculus",
        description: "Mathematical preparation for calculus",
        icon: "math",
        examCount: 8,
        questionCount: 320
      },
      // Computer Science
      {
        name: "Programming",
        description: "Computer programming fundamentals and languages",
        icon: "code",
        examCount: 12,
        questionCount: 480
      },
      {
        name: "Data Structures",
        description: "Algorithms and data organization methods",
        icon: "tree-structure",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Web Development",
        description: "Frontend and backend web technologies",
        icon: "globe",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "Database Design",
        description: "Relational database design and SQL",
        icon: "database",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "Computer Science Fundamentals",
        description: "Core concepts in computer science",
        icon: "computer",
        examCount: 15,
        questionCount: 600
      },
      // Natural Sciences
      {
        name: "Physics",
        description: "Classical and modern physics principles",
        icon: "atom",
        examCount: 12,
        questionCount: 480
      },
      {
        name: "Chemistry",
        description: "Chemical principles and reactions",
        icon: "flask",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "Biology",
        description: "Life sciences and biological systems",
        icon: "leaf",
        examCount: 14,
        questionCount: 560
      },
      {
        name: "Anatomy",
        description: "Human body structure and systems",
        icon: "user-anatomy",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Astronomy",
        description: "Study of celestial objects and phenomena",
        icon: "planet",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "Earth Science",
        description: "Geology, meteorology, and environmental science",
        icon: "earth",
        examCount: 8,
        questionCount: 320
      },
      // Engineering
      {
        name: "Mechanical Engineering",
        description: "Mechanical systems and engineering principles",
        icon: "gear",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "Electrical Engineering",
        description: "Electrical circuits and systems",
        icon: "lightning",
        examCount: 9,
        questionCount: 360
      },
      {
        name: "Engineering",
        description: "General engineering principles and practices",
        icon: "wrench",
        examCount: 12,
        questionCount: 480
      },
      // Business & Economics
      {
        name: "Accounting",
        description: "Financial accounting principles and practices",
        icon: "calculator-dollar",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Economics",
        description: "Microeconomics and macroeconomics principles",
        icon: "chart-line",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "Finance",
        description: "Corporate finance and investment principles",
        icon: "dollar-sign",
        examCount: 7,
        questionCount: 280
      },
      {
        name: "Business Administration",
        description: "Management and organizational behavior",
        icon: "briefcase",
        examCount: 9,
        questionCount: 360
      },
      // Health & Medical Sciences
      {
        name: "Nursing",
        description: "Nursing fundamentals and patient care",
        icon: "heart-pulse",
        examCount: 12,
        questionCount: 480
      },
      {
        name: "Pharmacology",
        description: "Drug actions and therapeutic applications",
        icon: "pill",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Medical Sciences",
        description: "Basic medical sciences and pathology",
        icon: "stethoscope",
        examCount: 15,
        questionCount: 600
      },
      {
        name: "Health Sciences",
        description: "Public health and healthcare systems",
        icon: "medical-cross",
        examCount: 10,
        questionCount: 400
      },
      // Social Sciences & Humanities
      {
        name: "Psychology",
        description: "Human behavior and mental processes",
        icon: "brain",
        examCount: 12,
        questionCount: 480
      },
      {
        name: "History",
        description: "World and regional historical studies",
        icon: "scroll",
        examCount: 15,
        questionCount: 600
      },
      {
        name: "Philosophy",
        description: "Philosophical theories and critical thinking",
        icon: "thinking",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "Sociology",
        description: "Social structures and human society",
        icon: "users",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "Political Science",
        description: "Government systems and political theory",
        icon: "government",
        examCount: 9,
        questionCount: 360
      },
      {
        name: "English",
        description: "Literature, composition, and language arts",
        icon: "book",
        examCount: 12,
        questionCount: 480
      },
      {
        name: "Writing",
        description: "Academic and professional writing skills",
        icon: "pen",
        examCount: 8,
        questionCount: 320
      },
      // Standardized Test Prep
      {
        name: "HESI",
        description: "Health Education Systems Inc. exam preparation",
        icon: "medical-bag",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "TEAS",
        description: "Test of Essential Academic Skills for nursing",
        icon: "graduation-cap",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "GRE",
        description: "Graduate Record Examinations preparation",
        icon: "academic-cap",
        examCount: 10,
        questionCount: 400
      },
      {
        name: "LSAT",
        description: "Law School Admission Test preparation",
        icon: "scale-justice",
        examCount: 8,
        questionCount: 320
      },
      {
        name: "TOEFL",
        description: "Test of English as a Foreign Language",
        icon: "language",
        examCount: 6,
        questionCount: 240
      },
      {
        name: "GED",
        description: "General Educational Development test preparation",
        icon: "certificate",
        examCount: 12,
        questionCount: 480
      }
    ];

    console.log(`Inserting ${subjectData.length} subjects...`);
    const insertedSubjects = await db.insert(subjects).values(subjectData).returning();
    console.log(`✓ Inserted ${insertedSubjects.length} subjects`);

    // Seed some sample exams and questions for the first few subjects
    for (let i = 0; i < Math.min(5, insertedSubjects.length); i++) {
      const subject = insertedSubjects[i];
      
      // Create sample exams
      const examData: InsertExam[] = Array.from({ length: subject.examCount || 3 }, (_, j) => ({
        subjectId: subject.id,
        title: `${subject.name} Practice Exam ${j + 1}`,
        description: `Comprehensive practice exam covering ${subject.name} concepts`,
        duration: 90,
        questionCount: Math.floor((subject.questionCount || 100) / (subject.examCount || 3))
      }));

      const insertedExams = await db.insert(exams).values(examData).returning();
      console.log(`✓ Inserted ${insertedExams.length} exams for ${subject.name}`);

      // Create sample questions for the first exam
      if (insertedExams.length > 0) {
        const firstExam = insertedExams[0];
        const questionData: InsertQuestion[] = Array.from({ length: 5 }, (_, k) => ({
          examId: firstExam.id,
          subjectId: subject.id,
          text: `Sample question ${k + 1} for ${subject.name}. This is a multiple choice question testing your knowledge.`,
          options: JSON.stringify([
            `Option A for question ${k + 1}`,
            `Option B for question ${k + 1}`,
            `Option C for question ${k + 1}`,
            `Option D for question ${k + 1}`
          ]),
          correctAnswer: k % 4,
          explanation: `This is the explanation for question ${k + 1}, explaining why the correct answer is option ${String.fromCharCode(65 + (k % 4))}.`,
          domain: `Domain ${Math.floor(k / 2) + 1}`,
          order: k + 1
        }));

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