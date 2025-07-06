import { 
  subjects, 
  exams, 
  questions, 
  userSessions,
  comments,
  type Subject, 
  type InsertSubject,
  type Exam,
  type InsertExam,
  type Question,
  type InsertQuestion,
  type UserSession,
  type InsertUserSession,
  type Comment,
  type InsertComment
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

  // Comments
  getComments(): Promise<Comment[]>;
  getCommentsByQuestion(questionId: number): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private subjects: Map<number, Subject>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private userSessions: Map<number, UserSession>;
  private comments: Map<number, Comment>;
  private currentSubjectId: number;
  private currentExamId: number;
  private currentQuestionId: number;
  private currentSessionId: number;
  private currentCommentId: number;

  constructor() {
    this.subjects = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.userSessions = new Map();
    this.comments = new Map();
    this.currentSubjectId = 1;
    this.currentExamId = 1;
    this.currentQuestionId = 1;
    this.currentSessionId = 1;
    this.currentCommentId = 1;

    this.seedData();
  }

  private seedData() {
    // Professional Certifications
    const pmpSubject = this.createSubjectSync({
      name: "PMP Certification",
      description: "Project Management Professional certification practice exams",
      icon: "📊",
      color: "blue",
    });

    const awsSubject = this.createSubjectSync({
      name: "AWS Cloud Practitioner",
      description: "Amazon Web Services foundational certification prep",
      icon: "☁️",
      color: "orange",
    });

    const comptiaSubject = this.createSubjectSync({
      name: "CompTIA Security+",
      description: "CompTIA Security+ certification for cybersecurity professionals",
      icon: "🛡️",
      color: "red",
    });

    const ciscoSubject = this.createSubjectSync({
      name: "CCNA Certification",
      description: "Cisco Certified Network Associate certification",
      icon: "🌐",
      color: "green",
    });

    const microsoftSubject = this.createSubjectSync({
      name: "Microsoft Azure AZ-900",
      description: "Azure Fundamentals certification for cloud computing",
      icon: "🔷",
      color: "cyan",
    });

    // University/College Computer Science
    const computerScienceSubject = this.createSubjectSync({
      name: "Computer Science",
      description: "Programming, algorithms, data structures, and software engineering",
      icon: "💻",
      color: "purple",
    });

    const dataStructuresSubject = this.createSubjectSync({
      name: "Data Structures & Algorithms",
      description: "Arrays, trees, graphs, sorting, and algorithmic problem solving",
      icon: "🌳",
      color: "indigo",
    });

    // University/College Mathematics & Sciences
    const mathematicsSubject = this.createSubjectSync({
      name: "Mathematics",
      description: "Calculus, algebra, statistics, and discrete mathematics",
      icon: "🔢",
      color: "teal",
    });

    const physicsSubject = this.createSubjectSync({
      name: "Physics",
      description: "Classical mechanics, thermodynamics, and modern physics",
      icon: "⚛️",
      color: "blue",
    });

    const chemistrySubject = this.createSubjectSync({
      name: "Chemistry",
      description: "Organic, inorganic, and physical chemistry fundamentals",
      icon: "🧪",
      color: "emerald",
    });

    // University/College Business & Economics
    const businessSubject = this.createSubjectSync({
      name: "Business Administration",
      description: "Management, finance, marketing, and business strategy",
      icon: "📈",
      color: "red",
    });

    const economicsSubject = this.createSubjectSync({
      name: "Economics",
      description: "Microeconomics, macroeconomics, and economic theory",
      icon: "💰",
      color: "yellow",
    });

    // University/College Engineering
    const engineeringSubject = this.createSubjectSync({
      name: "Engineering",
      description: "Mechanical, electrical, civil, and software engineering",
      icon: "⚙️",
      color: "gray",
    });

    // University/College Health & Medical
    const medicalSubject = this.createSubjectSync({
      name: "Medical Sciences",
      description: "Anatomy, physiology, pharmacology, and medical procedures",
      icon: "👩‍⚕️",
      color: "pink",
    });

    const biologySubject = this.createSubjectSync({
      name: "Biology",
      description: "Cell biology, genetics, ecology, and evolutionary biology",
      icon: "🧬",
      color: "green",
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

    const awsExam2 = this.createExamSync({
      subjectId: awsSubject.id,
      title: "AWS Advanced Concepts",
      description: "Advanced AWS architecture and security practices",
      questionCount: 65,
      duration: 120,
      difficulty: "Advanced",
    });

    // Add exams for CompTIA Security+
    const comptiaExam1 = this.createExamSync({
      subjectId: comptiaSubject.id,
      title: "CompTIA Security+ Practice Test 1",
      description: "Comprehensive security fundamentals and threat management",
      questionCount: 90,
      duration: 90,
      difficulty: "Intermediate",
    });

    const comptiaExam2 = this.createExamSync({
      subjectId: comptiaSubject.id,
      title: "CompTIA Security+ Advanced Practice",
      description: "Advanced security concepts and risk assessment",
      questionCount: 100,
      duration: 120,
      difficulty: "Advanced",
    });

    // Add exams for CCNA
    const ccnaExam1 = this.createExamSync({
      subjectId: ciscoSubject.id,
      title: "CCNA Network Fundamentals",
      description: "Basic networking concepts and Cisco technologies",
      questionCount: 60,
      duration: 120,
      difficulty: "Beginner",
    });

    const ccnaExam2 = this.createExamSync({
      subjectId: ciscoSubject.id,
      title: "CCNA Routing & Switching",
      description: "Advanced routing protocols and switching technologies",
      questionCount: 80,
      duration: 150,
      difficulty: "Intermediate",
    });

    // Add exams for Microsoft Azure
    const azureExam1 = this.createExamSync({
      subjectId: microsoftSubject.id,
      title: "Azure Fundamentals AZ-900",
      description: "Core Azure services and cloud concepts",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    const azureExam2 = this.createExamSync({
      subjectId: microsoftSubject.id,
      title: "Azure Administrator Practice",
      description: "Azure resource management and administration",
      questionCount: 55,
      duration: 100,
      difficulty: "Intermediate",
    });

    // Add exams for Computer Science
    const csExam1 = this.createExamSync({
      subjectId: computerScienceSubject.id,
      title: "Programming Fundamentals",
      description: "Basic programming concepts and problem solving",
      questionCount: 50,
      duration: 90,
      difficulty: "Beginner",
    });

    const csExam2 = this.createExamSync({
      subjectId: computerScienceSubject.id,
      title: "Advanced Software Engineering",
      description: "Design patterns, algorithms, and system architecture",
      questionCount: 70,
      duration: 120,
      difficulty: "Advanced",
    });

    // Add exams for Data Structures & Algorithms
    const dsaExam1 = this.createExamSync({
      subjectId: dataStructuresSubject.id,
      title: "Data Structures Basics",
      description: "Arrays, linked lists, stacks, and queues",
      questionCount: 45,
      duration: 75,
      difficulty: "Beginner",
    });

    const dsaExam2 = this.createExamSync({
      subjectId: dataStructuresSubject.id,
      title: "Advanced Algorithms",
      description: "Graph algorithms, dynamic programming, and optimization",
      questionCount: 60,
      duration: 105,
      difficulty: "Advanced",
    });

    // Add exams for Mathematics
    const mathExam1 = this.createExamSync({
      subjectId: mathematicsSubject.id,
      title: "Calculus Fundamentals",
      description: "Limits, derivatives, and basic integration",
      questionCount: 40,
      duration: 90,
      difficulty: "Intermediate",
    });

    const mathExam2 = this.createExamSync({
      subjectId: mathematicsSubject.id,
      title: "Advanced Statistics",
      description: "Probability theory and statistical inference",
      questionCount: 50,
      duration: 100,
      difficulty: "Advanced",
    });

    // Add exams for Physics
    const physicsExam1 = this.createExamSync({
      subjectId: physicsSubject.id,
      title: "Classical Mechanics",
      description: "Newton's laws, energy, and momentum",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    const physicsExam2 = this.createExamSync({
      subjectId: physicsSubject.id,
      title: "Quantum Physics Basics",
      description: "Wave-particle duality and quantum mechanics principles",
      questionCount: 45,
      duration: 95,
      difficulty: "Advanced",
    });

    // Add exams for Chemistry
    const chemExam1 = this.createExamSync({
      subjectId: chemistrySubject.id,
      title: "General Chemistry",
      description: "Atomic structure, bonding, and stoichiometry",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    const chemExam2 = this.createExamSync({
      subjectId: chemistrySubject.id,
      title: "Organic Chemistry",
      description: "Functional groups, reactions, and mechanisms",
      questionCount: 55,
      duration: 110,
      difficulty: "Intermediate",
    });

    // Add exams for Business Administration
    const bizExam1 = this.createExamSync({
      subjectId: businessSubject.id,
      title: "Business Strategy Fundamentals",
      description: "Strategic planning, competitive analysis, and market positioning",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    const bizExam2 = this.createExamSync({
      subjectId: businessSubject.id,
      title: "Financial Management",
      description: "Corporate finance, budgeting, and financial analysis",
      questionCount: 50,
      duration: 100,
      difficulty: "Advanced",
    });

    // Add exams for Economics
    const econExam1 = this.createExamSync({
      subjectId: economicsSubject.id,
      title: "Microeconomics Principles",
      description: "Supply and demand, market structures, and consumer behavior",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    const econExam2 = this.createExamSync({
      subjectId: economicsSubject.id,
      title: "Macroeconomics Analysis",
      description: "GDP, inflation, monetary policy, and international trade",
      questionCount: 50,
      duration: 95,
      difficulty: "Intermediate",
    });

    // Add exams for Engineering
    const engExam1 = this.createExamSync({
      subjectId: engineeringSubject.id,
      title: "Engineering Mechanics",
      description: "Statics, dynamics, and material properties",
      questionCount: 45,
      duration: 100,
      difficulty: "Intermediate",
    });

    const engExam2 = this.createExamSync({
      subjectId: engineeringSubject.id,
      title: "Systems Design",
      description: "Design principles, optimization, and project management",
      questionCount: 55,
      duration: 120,
      difficulty: "Advanced",
    });

    // Add exams for Medical Sciences
    const medExam1 = this.createExamSync({
      subjectId: medicalSubject.id,
      title: "Human Anatomy",
      description: "Body systems, organs, and physiological processes",
      questionCount: 60,
      duration: 110,
      difficulty: "Intermediate",
    });

    const medExam2 = this.createExamSync({
      subjectId: medicalSubject.id,
      title: "Pharmacology Basics",
      description: "Drug mechanisms, interactions, and therapeutic applications",
      questionCount: 70,
      duration: 130,
      difficulty: "Advanced",
    });

    // Add exams for Biology
    const bioExam1 = this.createExamSync({
      subjectId: biologySubject.id,
      title: "Cell Biology",
      description: "Cell structure, organelles, and cellular processes",
      questionCount: 45,
      duration: 90,
      difficulty: "Beginner",
    });

    const bioExam2 = this.createExamSync({
      subjectId: biologySubject.id,
      title: "Genetics and Evolution",
      description: "DNA, heredity, natural selection, and evolutionary biology",
      questionCount: 55,
      duration: 105,
      difficulty: "Intermediate",
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

    // Add sample questions for CompTIA Security+
    this.createQuestionSync({
      examId: comptiaExam1.id,
      subjectId: comptiaSubject.id,
      text: "Which of the following is the BEST method to prevent unauthorized access to a wireless network?",
      options: [
        "Enable WEP encryption",
        "Use WPA3 encryption with a strong passphrase",
        "Hide the SSID",
        "Use MAC address filtering only"
      ],
      correctAnswer: 1,
      explanation: "WPA3 encryption with a strong passphrase provides the strongest security for wireless networks. WEP is outdated and easily compromised, while SSID hiding and MAC filtering are security through obscurity methods that can be bypassed.",
      domain: "Network Security",
      difficulty: "Intermediate",
      order: 1,
    });

    // Add sample questions for Computer Science
    this.createQuestionSync({
      examId: csExam1.id,
      subjectId: computerScienceSubject.id,
      text: "What is the time complexity of searching for an element in a binary search tree in the average case?",
      options: [
        "O(1)",
        "O(log n)",
        "O(n)",
        "O(n log n)"
      ],
      correctAnswer: 1,
      explanation: "In a balanced binary search tree, searching for an element takes O(log n) time on average because we can eliminate half of the remaining nodes at each level by comparing with the current node.",
      domain: "Data Structures",
      difficulty: "Intermediate",
      order: 1,
    });

    // Add sample questions for Mathematics
    this.createQuestionSync({
      examId: mathExam1.id,
      subjectId: mathematicsSubject.id,
      text: "What is the derivative of f(x) = x³ + 2x² - 5x + 3?",
      options: [
        "3x² + 4x - 5",
        "x⁴ + 2x³ - 5x² + 3x",
        "3x² + 2x - 5",
        "x² + 4x - 5"
      ],
      correctAnswer: 0,
      explanation: "Using the power rule for derivatives: d/dx(x³) = 3x², d/dx(2x²) = 4x, d/dx(-5x) = -5, and d/dx(3) = 0. Therefore, f'(x) = 3x² + 4x - 5.",
      domain: "Calculus",
      difficulty: "Intermediate",
      order: 1,
    });
  }

  private createSubjectSync(subject: InsertSubject): Subject {
    const id = this.currentSubjectId++;
    const newSubject: Subject = { 
      id, 
      name: subject.name,
      description: subject.description || null,
      icon: subject.icon || null,
      color: subject.color || null,
      examCount: 0, 
      questionCount: 0 
    };
    this.subjects.set(id, newSubject);
    return newSubject;
  }

  private createExamSync(exam: InsertExam): Exam {
    const id = this.currentExamId++;
    const newExam: Exam = { 
      ...exam, 
      id, 
      isActive: true,
      description: exam.description || null,
      duration: exam.duration || null
    };
    this.exams.set(id, newExam);
    return newExam;
  }

  private createQuestionSync(question: InsertQuestion): Question {
    const id = this.currentQuestionId++;
    const newQuestion: Question = { 
      ...question, 
      id,
      explanation: question.explanation || null,
      domain: question.domain || null,
      order: question.order || null
    };
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

  // Comment methods
  async getComments(): Promise<Comment[]> {
    return Array.from(this.comments.values());
  }

  async getCommentsByQuestion(questionId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.questionId === questionId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const newComment: Comment = {
      id,
      questionId: comment.questionId,
      authorName: comment.authorName,
      content: comment.content,
      parentId: comment.parentId || null,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined> {
    const existing = this.comments.get(id);
    if (!existing) return undefined;
    const updated: Comment = { ...existing, ...comment };
    this.comments.set(id, updated);
    return updated;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
}

export const storage = new MemStorage();
