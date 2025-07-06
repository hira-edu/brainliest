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
  type InsertUser
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

export class MemStorage implements IStorage {
  private subjects: Map<number, Subject>;
  private exams: Map<number, Exam>;
  private questions: Map<number, Question>;
  private userSessions: Map<number, UserSession>;
  private comments: Map<number, Comment>;
  private users: Map<number, User>;
  private currentSubjectId: number;
  private currentExamId: number;
  private currentQuestionId: number;
  private currentSessionId: number;
  private currentCommentId: number;
  private currentUserId: number;

  constructor() {
    this.subjects = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.userSessions = new Map();
    this.comments = new Map();
    this.users = new Map();
    this.currentSubjectId = 1;
    this.currentExamId = 1;
    this.currentQuestionId = 1;
    this.currentSessionId = 1;
    this.currentCommentId = 1;
    this.currentUserId = 1;

    this.seedData();
  }

  private seedData() {
    console.log("Starting to seed data...");
    // Professional Certifications & IT
    const pmpSubject = this.createSubjectSync({
      name: "PMP Certification",
      description: "Project Management Professional certification practice exams",
      icon: "fas fa-project-diagram",
      color: "blue",
    });

    const awsSubject = this.createSubjectSync({
      name: "AWS Cloud Practitioner",
      description: "Amazon Web Services foundational certification prep",
      icon: "fab fa-aws",
      color: "orange",
    });

    const comptiaSubject = this.createSubjectSync({
      name: "CompTIA Security+",
      description: "CompTIA Security+ certification for cybersecurity professionals",
      icon: "fas fa-shield-alt",
      color: "red",
    });

    const ciscoSubject = this.createSubjectSync({
      name: "CCNA Certification",
      description: "Cisco Certified Network Associate certification",
      icon: "fas fa-network-wired",
      color: "green",
    });

    const microsoftSubject = this.createSubjectSync({
      name: "Microsoft Azure AZ-900",
      description: "Azure Fundamentals certification for cloud computing",
      icon: "fab fa-microsoft",
      color: "cyan",
    });

    // Statistics & Data Science
    const statisticsSubject = this.createSubjectSync({
      name: "Statistics",
      description: "AP Statistics, Biostatistics, Business Statistics, Statistical Methods",
      icon: "fas fa-chart-bar",
      color: "blue",
    });

    const apStatisticsSubject = this.createSubjectSync({
      name: "AP Statistics",
      description: "Advanced Placement Statistics course and exam preparation",
      icon: "fas fa-graduation-cap",
      color: "purple",
    });

    const biostatisticsSubject = this.createSubjectSync({
      name: "Biostatistics",
      description: "Statistical methods for biological and health data analysis",
      icon: "fas fa-microscope",
      color: "green",
    });

    // Mathematics
    const calculusSubject = this.createSubjectSync({
      name: "Calculus",
      description: "Calculus 1, 2, 3, Differential & Integral Calculus, Multivariable",
      icon: "fas fa-square-root-alt",
      color: "blue",
    });

    const algebraSubject = this.createSubjectSync({
      name: "Algebra",
      description: "Elementary Algebra, Linear Algebra, Advanced Functions",
      icon: "fas fa-calculator",
      color: "teal",
    });

    const geometrySubject = this.createSubjectSync({
      name: "Geometry",
      description: "Euclidean Geometry, Analytical Geometry, Trigonometry",
      icon: "fas fa-ruler-combined",
      color: "indigo",
    });

    const discreteMathSubject = this.createSubjectSync({
      name: "Discrete Mathematics",
      description: "Discrete Structures, Finite Mathematics, Logic",
      icon: "fas fa-sitemap",
      color: "purple",
    });

    const precalculusSubject = this.createSubjectSync({
      name: "Precalculus",
      description: "Pre-calculus preparation, Functions, Trigonometry",
      icon: "fas fa-function",
      color: "orange",
    });

    // Science
    const biologySubject = this.createSubjectSync({
      name: "Biology",
      description: "Cell Biology, Genetics, Ecology, Evolutionary Biology, Microbiology",
      icon: "fas fa-dna",
      color: "green",
    });

    const chemistrySubject = this.createSubjectSync({
      name: "Chemistry",
      description: "General, Inorganic, Organic Chemistry, Biochemistry",
      icon: "fas fa-flask",
      color: "emerald",
    });

    const physicsSubject = this.createSubjectSync({
      name: "Physics",
      description: "Classical Mechanics, Thermodynamics, Modern Physics",
      icon: "fas fa-atom",
      color: "blue",
    });

    const anatomySubject = this.createSubjectSync({
      name: "Anatomy & Physiology",
      description: "Human anatomy, physiology, medical terminology",
      icon: "fas fa-heart",
      color: "red",
    });

    const astronomySubject = this.createSubjectSync({
      name: "Astronomy",
      description: "Stellar astronomy, planetary science, cosmology",
      icon: "fas fa-moon",
      color: "indigo",
    });

    const earthScienceSubject = this.createSubjectSync({
      name: "Earth Science",
      description: "Geology, Geophysics, Environmental Science, Oceanography",
      icon: "fas fa-globe-americas",
      color: "brown",
    });

    // Business & Economics
    const businessSubject = this.createSubjectSync({
      name: "Business Administration",
      description: "Management, Marketing, Operations, Business Law, MBA Courses",
      icon: "fas fa-briefcase",
      color: "navy",
    });

    const accountingSubject = this.createSubjectSync({
      name: "Accounting",
      description: "Principles of Accounting, Cost Accounting, Auditing, Financial Reporting",
      icon: "fas fa-file-invoice-dollar",
      color: "green",
    });

    const economicsSubject = this.createSubjectSync({
      name: "Economics",
      description: "Microeconomics, Macroeconomics, Econometrics, International Economics",
      icon: "fas fa-coins",
      color: "yellow",
    });

    const financeSubject = this.createSubjectSync({
      name: "Finance",
      description: "Corporate Finance, Financial Institutions, Investment Banking",
      icon: "fas fa-chart-line",
      color: "green",
    });

    // English & Literature
    const englishSubject = this.createSubjectSync({
      name: "English Literature",
      description: "English Literature, Creative Writing, Critical Reading, Essays",
      icon: "fas fa-book-open",
      color: "purple",
    });

    const writingSubject = this.createSubjectSync({
      name: "Writing",
      description: "Business Writing, Creative Writing, Expository & Persuasive Writing",
      icon: "fas fa-pen",
      color: "blue",
    });

    // Humanities & Social Sciences
    const psychologySubject = this.createSubjectSync({
      name: "Psychology",
      description: "General Psychology, Cognitive Psychology, Social Psychology",
      icon: "fas fa-brain",
      color: "pink",
    });

    const historySubject = this.createSubjectSync({
      name: "History",
      description: "World History, American History, European History",
      icon: "fas fa-landmark",
      color: "brown",
    });

    const philosophySubject = this.createSubjectSync({
      name: "Philosophy",
      description: "Ethics, Logic, Metaphysics, Greek and Roman Philosophy",
      icon: "fas fa-lightbulb",
      color: "yellow",
    });

    const sociologySubject = this.createSubjectSync({
      name: "Sociology",
      description: "Social Theory, Social Research Methods, Social Psychology",
      icon: "fas fa-users",
      color: "teal",
    });

    const politicalScienceSubject = this.createSubjectSync({
      name: "Political Science",
      description: "American Government, International Relations, Political Theory",
      icon: "fas fa-vote-yea",
      color: "red",
    });

    // Computer Science & Programming
    const computerScienceSubject = this.createSubjectSync({
      name: "Computer Science",
      description: "Programming, Data Structures, Algorithms, Software Engineering",
      icon: "fas fa-laptop-code",
      color: "purple",
    });

    const dataStructuresSubject = this.createSubjectSync({
      name: "Data Structures & Algorithms",
      description: "Arrays, Trees, Graphs, Sorting, Algorithm Design",
      icon: "fas fa-sitemap",
      color: "indigo",
    });

    const programmingSubject = this.createSubjectSync({
      name: "Programming",
      description: "Java, Python, C++, JavaScript, Object-Oriented Programming",
      icon: "fas fa-code",
      color: "green",
    });

    const webDevelopmentSubject = this.createSubjectSync({
      name: "Web Development",
      description: "HTML, CSS, JavaScript, React, Node.js, Full-Stack Development",
      icon: "fas fa-globe",
      color: "blue",
    });

    const databaseSubject = this.createSubjectSync({
      name: "Database Systems",
      description: "SQL, MySQL, NoSQL, Database Design, Data Management",
      icon: "fas fa-database",
      color: "orange",
    });

    // Engineering
    const engineeringSubject = this.createSubjectSync({
      name: "Engineering",
      description: "Mechanical, Electrical, Civil, Software Engineering",
      icon: "fas fa-cogs",
      color: "gray",
    });

    const mechanicalEngSubject = this.createSubjectSync({
      name: "Mechanical Engineering",
      description: "Thermodynamics, Fluid Mechanics, Materials Science",
      icon: "fas fa-gear",
      color: "steel",
    });

    const electricalEngSubject = this.createSubjectSync({
      name: "Electrical Engineering",
      description: "Circuit Analysis, Electronics, Signal Processing",
      icon: "fas fa-bolt",
      color: "yellow",
    });

    // Medical & Health Sciences
    const medicalSubject = this.createSubjectSync({
      name: "Medical Sciences",
      description: "Anatomy, Physiology, Pharmacology, Medical Procedures",
      icon: "fas fa-user-md",
      color: "red",
    });

    const nursingSubject = this.createSubjectSync({
      name: "Nursing",
      description: "RN Fundamentals, Medical-Surgical, Pharmacology, Maternal Health",
      icon: "fas fa-user-nurse",
      color: "blue",
    });

    const pharmacologySubject = this.createSubjectSync({
      name: "Pharmacology",
      description: "Drug Mechanisms, Interactions, Therapeutic Applications",
      icon: "fas fa-pills",
      color: "green",
    });

    // Professional Exams
    const hesiSubject = this.createSubjectSync({
      name: "HESI",
      description: "HESI A2, HESI Exit Exam, Nursing School Entrance",
      icon: "fas fa-stethoscope",
      color: "blue",
    });

    const teasSubject = this.createSubjectSync({
      name: "TEAS",
      description: "Test of Essential Academic Skills for Nursing",
      icon: "fas fa-clipboard-check",
      color: "green",
    });

    const greSubject = this.createSubjectSync({
      name: "GRE",
      description: "Graduate Record Examination preparation",
      icon: "fas fa-graduation-cap",
      color: "purple",
    });

    const lsatSubject = this.createSubjectSync({
      name: "LSAT",
      description: "Law School Admission Test preparation",
      icon: "fas fa-gavel",
      color: "brown",
    });

    const toeflSubject = this.createSubjectSync({
      name: "TOEFL",
      description: "Test of English as a Foreign Language",
      icon: "fas fa-language",
      color: "blue",
    });

    const gedSubject = this.createSubjectSync({
      name: "GED",
      description: "General Educational Development test preparation",
      icon: "fas fa-certificate",
      color: "orange",
    });



    // Create comprehensive exams for all subjects
    
    // Professional Certifications
    this.createExamSync({
      subjectId: pmpSubject.id,
      title: "PMP Practice Exam 1",
      description: "Comprehensive practice test covering all PMP domains",
      questionCount: 50,
      duration: 60,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: pmpSubject.id,
      title: "PMP Mock Exam 2",
      description: "Advanced practice test with scenario-based questions",
      questionCount: 75,
      duration: 90,
      difficulty: "Advanced",
    });

    // AWS Exams
    this.createExamSync({
      subjectId: awsSubject.id,
      title: "AWS Fundamentals",
      description: "Basic AWS services and concepts",
      questionCount: 50,
      duration: 90,
      difficulty: "Beginner",
    });

    this.createExamSync({
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

    // Statistics Exams
    this.createExamSync({
      subjectId: statisticsSubject.id,
      title: "Elementary Statistics",
      description: "Descriptive statistics, probability, and hypothesis testing",
      questionCount: 40,
      duration: 75,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: apStatisticsSubject.id,
      title: "AP Statistics Practice Test",
      description: "Complete AP Statistics exam preparation",
      questionCount: 40,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: biostatisticsSubject.id,
      title: "Biostatistics Fundamentals",
      description: "Statistical methods for biological research",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    // Mathematics Exams
    this.createExamSync({
      subjectId: calculusSubject.id,
      title: "Calculus 1 - Limits and Derivatives",
      description: "Fundamental concepts of differential calculus",
      questionCount: 40,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: calculusSubject.id,
      title: "Calculus 2 - Integration",
      description: "Integral calculus and applications",
      questionCount: 45,
      duration: 100,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: algebraSubject.id,
      title: "Linear Algebra",
      description: "Matrices, vector spaces, and linear transformations",
      questionCount: 35,
      duration: 85,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: geometrySubject.id,
      title: "Euclidean Geometry",
      description: "Plane geometry, proofs, and constructions",
      questionCount: 30,
      duration: 75,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: discreteMathSubject.id,
      title: "Discrete Mathematics",
      description: "Logic, set theory, and combinatorics",
      questionCount: 40,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: precalculusSubject.id,
      title: "Pre-Calculus Functions",
      description: "Functions, trigonometry, and analytic geometry",
      questionCount: 35,
      duration: 80,
      difficulty: "Beginner",
    });

    // Science Exams
    this.createExamSync({
      subjectId: physicsSubject.id,
      title: "Classical Mechanics",
      description: "Newton's laws, energy, and momentum",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: physicsSubject.id,
      title: "Quantum Physics Basics",
      description: "Wave-particle duality and quantum mechanics principles",
      questionCount: 45,
      duration: 95,
      difficulty: "Advanced",
    });

    this.createExamSync({
      subjectId: chemistrySubject.id,
      title: "General Chemistry",
      description: "Atomic structure, bonding, and stoichiometry",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: chemistrySubject.id,
      title: "Organic Chemistry",
      description: "Functional groups, reactions, and mechanisms",
      questionCount: 55,
      duration: 110,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: biologySubject.id,
      title: "Cell Biology Fundamentals",
      description: "Cell structure, organelles, and cellular processes",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: biologySubject.id,
      title: "Genetics and Evolution",
      description: "Heredity, DNA, and evolutionary biology",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: anatomySubject.id,
      title: "Human Anatomy Systems",
      description: "Body systems, organs, and physiological processes",
      questionCount: 50,
      duration: 100,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: astronomySubject.id,
      title: "Solar System and Planets",
      description: "Planetary science and solar system exploration",
      questionCount: 30,
      duration: 70,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: earthScienceSubject.id,
      title: "Geology and Earth Processes",
      description: "Rock formation, plate tectonics, and earth history",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    // Business & Economics Exams
    this.createExamSync({
      subjectId: businessSubject.id,
      title: "Business Strategy Fundamentals",
      description: "Strategic planning, competitive analysis, and market positioning",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: businessSubject.id,
      title: "Financial Management",
      description: "Corporate finance, budgeting, and financial analysis",
      questionCount: 50,
      duration: 100,
      difficulty: "Advanced",
    });

    this.createExamSync({
      subjectId: accountingSubject.id,
      title: "Principles of Accounting",
      description: "Financial statements, accounting principles, and basic bookkeeping",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: accountingSubject.id,
      title: "Cost Accounting",
      description: "Cost analysis, budgeting, and managerial accounting",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: economicsSubject.id,
      title: "Microeconomics Principles",
      description: "Supply and demand, market structures, and consumer behavior",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: economicsSubject.id,
      title: "Macroeconomics Analysis",
      description: "GDP, inflation, monetary policy, and international trade",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: financeSubject.id,
      title: "Corporate Finance",
      description: "Investment decisions, capital structure, and financial analysis",
      questionCount: 40,
      duration: 85,
      difficulty: "Intermediate",
    });

    // English & Literature Exams
    this.createExamSync({
      subjectId: englishSubject.id,
      title: "English Literature Survey",
      description: "Major works, literary periods, and critical analysis",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: writingSubject.id,
      title: "Business Writing",
      description: "Professional communication, reports, and presentations",
      questionCount: 30,
      duration: 75,
      difficulty: "Beginner",
    });

    // Social Sciences Exams
    this.createExamSync({
      subjectId: psychologySubject.id,
      title: "General Psychology",
      description: "Learning, memory, cognition, and behavior",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: historySubject.id,
      title: "World History",
      description: "Major civilizations, events, and historical analysis",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: philosophySubject.id,
      title: "Introduction to Philosophy",
      description: "Ethics, logic, metaphysics, and philosophical reasoning",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: sociologySubject.id,
      title: "Sociology Fundamentals",
      description: "Social theory, institutions, and research methods",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: politicalScienceSubject.id,
      title: "American Government",
      description: "Constitution, political institutions, and public policy",
      questionCount: 40,
      duration: 85,
      difficulty: "Intermediate",
    });

    // Computer Science & Programming Exams
    this.createExamSync({
      subjectId: computerScienceSubject.id,
      title: "Programming Fundamentals",
      description: "Basic programming concepts and problem solving",
      questionCount: 40,
      duration: 85,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: computerScienceSubject.id,
      title: "Advanced Software Engineering",
      description: "Design patterns, algorithms, and system architecture",
      questionCount: 50,
      duration: 100,
      difficulty: "Advanced",
    });

    this.createExamSync({
      subjectId: dataStructuresSubject.id,
      title: "Data Structures Basics",
      description: "Arrays, linked lists, stacks, and queues",
      questionCount: 35,
      duration: 75,
      difficulty: "Beginner",
    });

    this.createExamSync({
      subjectId: programmingSubject.id,
      title: "Object-Oriented Programming",
      description: "Classes, inheritance, polymorphism, and design patterns",
      questionCount: 40,
      duration: 85,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: webDevelopmentSubject.id,
      title: "Full-Stack Web Development",
      description: "HTML, CSS, JavaScript, React, and backend development",
      questionCount: 45,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: databaseSubject.id,
      title: "Database Design and SQL",
      description: "Relational databases, SQL queries, and database optimization",
      questionCount: 35,
      duration: 80,
      difficulty: "Intermediate",
    });

    // Engineering Exams
    this.createExamSync({
      subjectId: engineeringSubject.id,
      title: "Engineering Mechanics",
      description: "Statics, dynamics, and material properties",
      questionCount: 40,
      duration: 90,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: mechanicalEngSubject.id,
      title: "Thermodynamics",
      description: "Heat transfer, energy systems, and thermal analysis",
      questionCount: 35,
      duration: 85,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: electricalEngSubject.id,
      title: "Circuit Analysis",
      description: "Electrical circuits, components, and circuit design",
      questionCount: 40,
      duration: 90,
      difficulty: "Intermediate",
    });

    // Medical & Health Sciences Exams
    this.createExamSync({
      subjectId: medicalSubject.id,
      title: "Human Anatomy",
      description: "Body systems, organs, and physiological processes",
      questionCount: 50,
      duration: 100,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: nursingSubject.id,
      title: "RN Fundamentals",
      description: "Nursing fundamentals and patient care basics",
      questionCount: 60,
      duration: 120,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: nursingSubject.id,
      title: "Medical-Surgical Nursing",
      description: "Adult health nursing and medical-surgical procedures",
      questionCount: 75,
      duration: 150,
      difficulty: "Advanced",
    });

    this.createExamSync({
      subjectId: pharmacologySubject.id,
      title: "Pharmacology Basics",
      description: "Drug mechanisms, interactions, and therapeutic applications",
      questionCount: 50,
      duration: 100,
      difficulty: "Intermediate",
    });

    // Professional Exams
    this.createExamSync({
      subjectId: hesiSubject.id,
      title: "HESI A2 Practice Test",
      description: "Comprehensive HESI admission assessment preparation",
      questionCount: 75,
      duration: 180,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: teasSubject.id,
      title: "TEAS 7 Practice Exam",
      description: "Test of Essential Academic Skills for nursing programs",
      questionCount: 170,
      duration: 209,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: greSubject.id,
      title: "GRE General Test",
      description: "Graduate Record Examination practice test",
      questionCount: 80,
      duration: 200,
      difficulty: "Advanced",
    });

    this.createExamSync({
      subjectId: lsatSubject.id,
      title: "LSAT Practice Test",
      description: "Law School Admission Test preparation",
      questionCount: 100,
      duration: 180,
      difficulty: "Advanced",
    });

    this.createExamSync({
      subjectId: toeflSubject.id,
      title: "TOEFL iBT Practice",
      description: "Test of English as a Foreign Language preparation",
      questionCount: 60,
      duration: 180,
      difficulty: "Intermediate",
    });

    this.createExamSync({
      subjectId: gedSubject.id,
      title: "GED Practice Test",
      description: "General Educational Development test preparation",
      questionCount: 50,
      duration: 150,
      difficulty: "Beginner",
    });

    // Create exam references for questions
    const pmpExam = Array.from(this.exams.values()).find(e => e.subjectId === pmpSubject.id);
    const awsExam = Array.from(this.exams.values()).find(e => e.subjectId === awsSubject.id);
    const statisticsExam = Array.from(this.exams.values()).find(e => e.subjectId === statisticsSubject.id);
    const calculusExam = Array.from(this.exams.values()).find(e => e.subjectId === calculusSubject.id);

    // Create sample questions
    if (pmpExam) {
      this.createQuestionSync({
        examId: pmpExam.id,
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
        examId: pmpExam.id,
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
    }

    if (awsExam) {
      this.createQuestionSync({
        examId: awsExam.id,
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

    // Add sample questions for CompTIA Security+
    const comptiaExam = Array.from(this.exams.values()).find(e => e.subjectId === comptiaSubject.id);
    if (comptiaExam) {
      this.createQuestionSync({
        examId: comptiaExam.id,
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

    }

    // Add sample questions for Computer Science
    const csExam = Array.from(this.exams.values()).find(e => e.subjectId === computerScienceSubject.id);
    if (csExam) {
      this.createQuestionSync({
        examId: csExam.id,
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
    }

    // Add sample questions for Mathematics
    if (calculusExam) {
      this.createQuestionSync({
        examId: calculusExam.id,
        subjectId: calculusSubject.id,
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

    // Add sample questions for Statistics
    if (statisticsExam) {
      this.createQuestionSync({
        examId: statisticsExam.id,
        subjectId: statisticsSubject.id,
        text: "What is the difference between a parameter and a statistic?",
        options: [
          "A parameter describes a population, while a statistic describes a sample",
          "A parameter describes a sample, while a statistic describes a population",
          "They are the same thing",
          "A parameter is always larger than a statistic"
        ],
        correctAnswer: 0,
        explanation: "A parameter is a numerical measure that describes a characteristic of a population, while a statistic is a numerical measure that describes a characteristic of a sample drawn from that population.",
        domain: "Descriptive Statistics",
        difficulty: "Beginner",
        order: 1,
      });
    }

    // Add sample users
    this.createUserSync({
      email: "admin@brainliest.com",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isActive: true,
      isBanned: false,
      lastLoginAt: new Date(),
      lastLoginIp: "192.168.1.100",
      registrationIp: "192.168.1.100",
      metadata: JSON.stringify({ loginCount: 45 })
    });

    this.createUserSync({
      email: "john.smith@example.com",
      username: "johnsmith",
      firstName: "John",
      lastName: "Smith",
      role: "user",
      isActive: true,
      isBanned: false,
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastLoginIp: "10.0.0.15",
      registrationIp: "10.0.0.15",
      metadata: JSON.stringify({ loginCount: 12, examsTaken: 3 })
    });

    this.createUserSync({
      email: "sarah.wilson@gmail.com",
      username: "sarahw",
      firstName: "Sarah",
      lastName: "Wilson",
      role: "user",
      isActive: true,
      isBanned: false,
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      lastLoginIp: "172.16.0.25",
      registrationIp: "172.16.0.25",
      metadata: JSON.stringify({ loginCount: 8, examsTaken: 1 })
    });

    this.createUserSync({
      email: "mike.banned@example.com",
      username: "mikebanned",
      firstName: "Mike",
      lastName: "Banned",
      role: "user",
      isActive: false,
      isBanned: true,
      banReason: "Inappropriate behavior in comments",
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastLoginIp: "203.0.113.50",
      registrationIp: "203.0.113.50",
      metadata: JSON.stringify({ loginCount: 25, violations: 3 })
    });

    this.createUserSync({
      email: "moderator@brainliest.com",
      username: "moderator",
      firstName: "Content",
      lastName: "Moderator",
      role: "moderator",
      isActive: true,
      isBanned: false,
      lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      lastLoginIp: "192.168.1.101",
      registrationIp: "192.168.1.101",
      metadata: JSON.stringify({ loginCount: 89, moderatedComments: 156 })
    });
    
    console.log(`Seed data complete! Created ${this.subjects.size} subjects, ${this.exams.size} exams, ${this.questions.size} questions`);
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
      order: question.order || null,
      correctAnswers: question.correctAnswers ?? null,
      allowMultipleAnswers: question.allowMultipleAnswers ?? null
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

  // User management methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  private createUserSync(user: InsertUser): User {
    const id = this.currentUserId++;
    const newUser: User = { 
      id, 
      email: user.email,
      username: user.username,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImage: user.profileImage || null,
      role: user.role || "user",
      isActive: user.isActive ?? true,
      isBanned: user.isBanned ?? false,
      banReason: user.banReason || null,
      lastLoginAt: user.lastLoginAt || null,
      lastLoginIp: user.lastLoginIp || null,
      registrationIp: user.registrationIp || null,
      metadata: user.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.createUserSync(user);
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: User = { ...existing, ...user, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async banUser(id: number, reason: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    const updated: User = { 
      ...user, 
      isBanned: true, 
      banReason: reason,
      updatedAt: new Date() 
    };
    this.users.set(id, updated);
    return true;
  }

  async unbanUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    const updated: User = { 
      ...user, 
      isBanned: false, 
      banReason: null,
      updatedAt: new Date() 
    };
    this.users.set(id, updated);
    return true;
  }

  async getUsersWithFilters(filters: {
    role?: string;
    isActive?: boolean;
    isBanned?: boolean;
    search?: string;
  }): Promise<User[]> {
    let users = Array.from(this.users.values());

    if (filters.role) {
      users = users.filter(user => user.role === filters.role);
    }

    if (filters.isActive !== undefined) {
      users = users.filter(user => user.isActive === filters.isActive);
    }

    if (filters.isBanned !== undefined) {
      users = users.filter(user => user.isBanned === filters.isBanned);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      users = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm) ||
        user.username?.toLowerCase().includes(searchTerm) ||
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm)
      );
    }

    return users;
  }
}



export const storage = new MemStorage();
