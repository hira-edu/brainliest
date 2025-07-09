// Additional types for exam results and analytics
export interface ExamResult {
  sessionId: number;
  examSlug: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  completedAt: Date;
  passed: boolean;
  passingScore?: number;
  domainResults?: DomainResult[];
}

export interface DomainResult {
  domain: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  strength: "weak" | "average" | "strong";
}

export interface AnalyticsData {
  totalExams: number;
  totalQuestions: number;
  averageScore: number;
  completionRate: number;
  timeSpent: number;
  strongDomains: string[];
  weakDomains: string[];
  recentActivity: ExamResult[];
}

export interface SessionProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  timeElapsed: number; // in seconds
  estimatedTimeRemaining: number; // in seconds
}

export interface QuestionAnalytics {
  questionId: number;
  isCorrect: boolean;
  timeSpent: number;
  selectedAnswer: number | number[];
  difficulty: string;
  domain?: string;
}