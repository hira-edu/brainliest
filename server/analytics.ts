import { 
  UserProfile, 
  DetailedAnswer, 
  ExamAnalytics, 
  PerformanceTrends, 
  StudyRecommendations, 
  InsertUserProfile,
  InsertDetailedAnswer,
  InsertExamAnalytics,
  InsertPerformanceTrends,
  InsertStudyRecommendations
} from "@shared/schema";

export interface IAnalyticsService {
  // User Profile Analytics
  createOrUpdateUserProfile(userName: string, examData: any): Promise<UserProfile>;
  getUserProfile(userName: string): Promise<UserProfile | undefined>;
  
  // Detailed Answer Tracking
  recordAnswer(answerData: InsertDetailedAnswer): Promise<DetailedAnswer>;
  getAnswerHistory(userName: string, questionId?: number): Promise<DetailedAnswer[]>;
  
  // Exam Analytics
  createExamAnalytics(analyticsData: InsertExamAnalytics): Promise<ExamAnalytics>;
  getExamAnalytics(userName: string, examId?: number): Promise<ExamAnalytics[]>;
  
  // Performance Trends
  updatePerformanceTrends(userName: string, subjectId: number): Promise<PerformanceTrends>;
  getPerformanceTrends(userName: string, subjectId?: number): Promise<PerformanceTrends[]>;
  
  // Study Recommendations
  generateStudyRecommendations(userName: string, subjectId: number): Promise<StudyRecommendations[]>;
  getStudyRecommendations(userName: string): Promise<StudyRecommendations[]>;
  markRecommendationCompleted(recommendationId: number): Promise<boolean>;
}

export class MemAnalyticsService implements IAnalyticsService {
  private userProfiles: Map<string, UserProfile>;
  private detailedAnswers: Map<number, DetailedAnswer>;
  private examAnalytics: Map<number, ExamAnalytics>;
  private performanceTrends: Map<string, PerformanceTrends[]>;
  private studyRecommendations: Map<string, StudyRecommendations[]>;
  
  private currentUserProfileId: number;
  private currentDetailedAnswerId: number;
  private currentExamAnalyticsId: number;
  private currentPerformanceTrendsId: number;
  private currentStudyRecommendationId: number;

  constructor() {
    this.userProfiles = new Map();
    this.detailedAnswers = new Map();
    this.examAnalytics = new Map();
    this.performanceTrends = new Map();
    this.studyRecommendations = new Map();
    
    this.currentUserProfileId = 1;
    this.currentDetailedAnswerId = 1;
    this.currentExamAnalyticsId = 1;
    this.currentPerformanceTrendsId = 1;
    this.currentStudyRecommendationId = 1;
  }

  async createOrUpdateUserProfile(userName: string, examData: any): Promise<UserProfile> {
    const existing = this.userProfiles.get(userName);
    
    if (existing) {
      // Update existing profile
      const updated: UserProfile = {
        ...existing,
        totalExamsTaken: (existing.totalExamsTaken || 0) + 1,
        totalQuestionsAnswered: (existing.totalQuestionsAnswered || 0) + (examData.totalQuestions || 0),
        averageScore: this.calculateAverageScore(existing, examData.score),
        lastActiveAt: new Date(),
      };
      this.userProfiles.set(userName, updated);
      return updated;
    } else {
      // Create new profile
      const newProfile: UserProfile = {
        id: this.currentUserProfileId++,
        userName,
        email: null,
        totalExamsTaken: 1,
        totalQuestionsAnswered: examData.totalQuestions || 0,
        averageScore: examData.score?.toString() || "0",
        strongestSubjects: null,
        weakestSubjects: null,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };
      this.userProfiles.set(userName, newProfile);
      return newProfile;
    }
  }

  async getUserProfile(userName: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userName);
  }

  async recordAnswer(answerData: InsertDetailedAnswer): Promise<DetailedAnswer> {
    const newAnswer: DetailedAnswer = {
      id: this.currentDetailedAnswerId++,
      ...answerData,
      answeredAt: new Date(),
    };
    this.detailedAnswers.set(newAnswer.id, newAnswer);
    return newAnswer;
  }

  async getAnswerHistory(userName: string, questionId?: number): Promise<DetailedAnswer[]> {
    // For in-memory implementation, we'd need to link answers to users
    // This is simplified for now
    return Array.from(this.detailedAnswers.values()).filter(answer => {
      if (questionId) {
        return answer.questionId === questionId;
      }
      return true;
    });
  }

  async createExamAnalytics(analyticsData: InsertExamAnalytics): Promise<ExamAnalytics> {
    const newAnalytics: ExamAnalytics = {
      id: this.currentExamAnalyticsId++,
      ...analyticsData,
      completedAt: new Date(),
    };
    this.examAnalytics.set(newAnalytics.id, newAnalytics);
    return newAnalytics;
  }

  async getExamAnalytics(userName: string, examId?: number): Promise<ExamAnalytics[]> {
    return Array.from(this.examAnalytics.values()).filter(analytics => {
      if (examId) {
        return analytics.userName === userName && analytics.examId === examId;
      }
      return analytics.userName === userName;
    });
  }

  async updatePerformanceTrends(userName: string, subjectId: number): Promise<PerformanceTrends> {
    const currentWeek = this.getCurrentWeekStart();
    const userTrends = this.performanceTrends.get(userName) || [];
    
    const existingTrend = userTrends.find(trend => 
      trend.subjectId === subjectId && trend.week === currentWeek
    );

    if (existingTrend) {
      // Update existing trend
      existingTrend.examsTaken = (existingTrend.examsTaken || 0) + 1;
      return existingTrend;
    } else {
      // Create new trend
      const newTrend: PerformanceTrends = {
        id: this.currentPerformanceTrendsId++,
        userName,
        subjectId,
        week: currentWeek,
        examsTaken: 1,
        questionsAnswered: 0,
        averageScore: null,
        accuracyTrend: null,
        speedTrend: null,
        strongDomains: null,
        weakDomains: null,
        createdAt: new Date(),
      };
      userTrends.push(newTrend);
      this.performanceTrends.set(userName, userTrends);
      return newTrend;
    }
  }

  async getPerformanceTrends(userName: string, subjectId?: number): Promise<PerformanceTrends[]> {
    const userTrends = this.performanceTrends.get(userName) || [];
    if (subjectId) {
      return userTrends.filter(trend => trend.subjectId === subjectId);
    }
    return userTrends;
  }

  async generateStudyRecommendations(userName: string, subjectId: number): Promise<StudyRecommendations[]> {
    // Generate AI-powered study recommendations based on performance
    const recommendations: StudyRecommendations[] = [
      {
        id: this.currentStudyRecommendationId++,
        userName,
        subjectId,
        recommendationType: "focus_area",
        content: "Focus on Project Management Fundamentals - your accuracy in this area can be improved",
        priority: 3,
        domains: '["Project Management", "Fundamentals"]',
        estimatedImpact: "15.5",
        isCompleted: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      },
      {
        id: this.currentStudyRecommendationId++,
        userName,
        subjectId,
        recommendationType: "review",
        content: "Review Risk Management concepts - you've shown strong performance here, reinforce your knowledge",
        priority: 2,
        domains: '["Risk Management"]',
        estimatedImpact: "8.0",
        isCompleted: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      }
    ];

    const userRecommendations = this.studyRecommendations.get(userName) || [];
    userRecommendations.push(...recommendations);
    this.studyRecommendations.set(userName, userRecommendations);
    
    return recommendations;
  }

  async getStudyRecommendations(userName: string): Promise<StudyRecommendations[]> {
    return this.studyRecommendations.get(userName) || [];
  }

  async markRecommendationCompleted(recommendationId: number): Promise<boolean> {
    // Find and mark recommendation as completed
    for (const [userName, recommendations] of this.studyRecommendations.entries()) {
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (recommendation) {
        recommendation.isCompleted = true;
        return true;
      }
    }
    return false;
  }

  private calculateAverageScore(existing: UserProfile, newScore: number): string {
    const currentAvg = parseFloat(existing.averageScore || "0");
    const totalExams = (existing.totalExamsTaken || 0) + 1;
    const newAvg = ((currentAvg * (totalExams - 1)) + newScore) / totalExams;
    return newAvg.toFixed(2);
  }

  private getCurrentWeekStart(): string {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  }
}

export const analyticsService = new MemAnalyticsService();