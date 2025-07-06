import { 
  subjects, 
  exams, 
  questions, 
  userSessions,
  type Subject, 
  type InsertSubject,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type UserSession,
  type InsertUserSession
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private subjects: Map<number, Subject>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private userSessions: Map<number, UserSession>;
  private currentSubjectId: number;
  private currentExamId: number;
  private currentQuestionId: number;
  private currentSessionId: number;

  constructor() {
    this.subjects = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.userSessions = new Map();
    this.currentSubjectId = 1;
    this.currentExamId = 1;
    this.currentQuestionId = 1;
    this.currentSessionId = 1;

    this.seedData();
  }

  private seedData() {
    // Create sample subjects
    const pmpSubject = this.createSubjectSync({
      name: "PMP Certification",
      description: "Project Management Professional certification practice exams",
      icon: "fas fa-project-diagram",
      color: "blue",
      examCount: 3,
      questionCount: 150,
    });

    const awsSubject = this.createSubjectSync({
      name: "AWS Cloud Practitioner",
      description: "Amazon Web Services foundational certification prep",
      icon: "fab fa-aws",
      color: "orange",
      examCount: 2,
      questionCount: 100,
    });

    const comptiaSubject = this.createSubjectSync({
      name: "CompTIA Security+",
      description: "Cybersecurity fundamentals certification practice",
      icon: "fas fa-shield-alt",
      color: "green",
      examCount: 2,
      questionCount: 80,
    });

    // Create sample exams
    const pmpExam1 = this.createExamSync({
      subjectId: pmpSubject.id,
      title: "PMP Practice Exam 1",
      description: "Comprehensive practice test covering all PMP domains",
      questionCount: 50,
      duration: 60,
      difficulty: "Intermediate",
    });

    const pmpExam2 = this.createExamSync({
      subjectId: pmpSubject.id,
      title: "PMP Mock Exam 2",
      description: "Advanced practice test with scenario-based questions",
      questionCount: 75,
      duration: 90,
      difficulty: "Advanced",
    });

    const awsExam1 = this.createExamSync({
      subjectId: awsSubject.id,
      title: "AWS Fundamentals",
      description: "Basic AWS services and concepts",
      questionCount: 50,
      duration: 90,
      difficulty: "Beginner",
    });

    // Create sample questions
    this.createQuestionSync({
      examId: pmpExam1.id,
      subjectId: pmpSubject.id,
      text: "You are managing a software development project with a team of 12 developers. During the planning phase, you realize that one of the key requirements has significant technical risks that could impact the project timeline. What should be your immediate next step according to PMI best practices?",
      options: [
        "Proceed with the original plan and address risks as they occur during execution",
        "Conduct a detailed risk analysis and develop mitigation strategies before proceeding",
        "Immediately escalate to the project sponsor for guidance",
        "Remove the risky requirement from the project scope"
      ],
      correctAnswer: 1,
      explanation: "According to PMI best practices, when significant risks are identified during planning, the project manager should conduct a detailed risk analysis and develop appropriate mitigation strategies. This proactive approach aligns with the risk management knowledge area principles.",
      domain: "Planning",
      difficulty: "Intermediate",
      order: 1,
    });

    this.createQuestionSync({
      examId: pmpExam1.id,
      subjectId: pmpSubject.id,
      text: "What is the primary purpose of a project charter in project management?",
      options: [
        "To define detailed project requirements",
        "To formally authorize the project and provide high-level direction",
        "To create a detailed project schedule",
        "To identify all project stakeholders"
      ],
      correctAnswer: 1,
      explanation: "The project charter formally authorizes the project and provides the project manager with the authority to apply organizational resources to project activities. It establishes the high-level direction and rationale for the project.",
      domain: "Initiating",
      difficulty: "Beginner",
      order: 2,
    });

    this.createQuestionSync({
      examId: awsExam1.id,
      subjectId: awsSubject.id,
      text: "Which AWS service is primarily used for hosting static websites?",
      options: [
        "Amazon EC2",
        "Amazon S3",
        "Amazon RDS",
        "Amazon Lambda"
      ],
      correctAnswer: 1,
      explanation: "Amazon S3 (Simple Storage Service) is commonly used for hosting static websites. It provides a cost-effective way to serve static content like HTML, CSS, JavaScript, and images.",
      domain: "Core Services",
      difficulty: "Beginner",
      order: 1,
    });
  }

  private createSubjectSync(subject: InsertSubject): Subject {
    const id = this.currentSubjectId++;
    const newSubject: Subject = { ...subject, id };
    this.subjects.set(id, newSubject);
    return newSubject;
  }

  private createExamSync(exam: InsertExam): Exam {
    const id = this.currentExamId++;
    const newExam: Exam = { ...exam, id, isActive: true };
    this.exams.set(id, newExam);
    return newExam;
  }

  private createQuestionSync(question: InsertQuestion): Question {
    const id = this.currentQuestionId++;
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }

  // Subject methods
  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    return this.createSubjectSync(subject);
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const existing = this.subjects.get(id);
    if (!existing) return undefined;
    const updated: Subject = { ...existing, ...subject };
    this.subjects.set(id, updated);
    return updated;
  }

  async deleteSubject(id: number): Promise<boolean> {
    return this.subjects.delete(id);
  }

  // Exam methods
  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }

  async getExamsBySubject(subjectId: number): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.subjectId === subjectId);
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    return this.createExamSync(exam);
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const existing = this.exams.get(id);
    if (!existing) return undefined;
    const updated: Exam = { ...existing, ...exam };
    this.exams.set(id, updated);
    return updated;
  }

  async deleteExam(id: number): Promise<boolean> {
    return this.exams.delete(id);
  }

  // Question methods
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.examId === examId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    return this.createQuestionSync(question);
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existing = this.questions.get(id);
    if (!existing) return undefined;
    const updated: Question = { ...existing, ...question };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // User Session methods
  async getUserSessions(): Promise<UserSession[]> {
    return Array.from(this.userSessions.values());
  }

  async getUserSession(id: number): Promise<UserSession | undefined> {
    return this.userSessions.get(id);
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const id = this.currentSessionId++;
    const newSession: UserSession = { 
      ...session, 
      id, 
      startedAt: new Date(),
      completedAt: null,
      currentQuestionIndex: 0,
      answers: [],
      score: null,
      timeSpent: null,
      isCompleted: false,
    };
    this.userSessions.set(id, newSession);
    return newSession;
  }

  async updateUserSession(id: number, session: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const existing = this.userSessions.get(id);
    if (!existing) return undefined;
    const updated: UserSession = { ...existing, ...session };
    this.userSessions.set(id, updated);
    return updated;
  }

  async deleteUserSession(id: number): Promise<boolean> {
    return this.userSessions.delete(id);
  }
}

export const storage = new MemStorage();
