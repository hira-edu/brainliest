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
} from "../../../shared/schema";

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
    
    // Populate with comprehensive sample data for demo
    this.populateSampleData();
  }

  private populateSampleData() {
    // Sample user profiles
    const sampleProfiles = [
      {
        userName: "john_doe",
        email: "john@example.com",
        totalExamsTaken: 12,
        totalQuestionsAnswered: 240,
        averageScore: "78.5",
        strongestSubjects: "Project Management,Risk Management",
        weakestSubjects: "Quality Management,Procurement"
      },
      {
        userName: "jane_smith", 
        email: "jane@example.com",
        totalExamsTaken: 8,
        totalQuestionsAnswered: 160,
        averageScore: "85.2",
        strongestSubjects: "Quality Management,Communication",
        weakestSubjects: "Cost Management,Schedule Management"
      }
    ];

    sampleProfiles.forEach(profile => {
      const userProfile: UserProfile = {
        id: this.currentUserProfileId++,
        userName: profile.userName,
        email: profile.email,
        totalExamsTaken: profile.totalExamsTaken,
        totalQuestionsAnswered: profile.totalQuestionsAnswered,
        averageScore: profile.averageScore,
        strongestSubjects: profile.strongestSubjects,
        weakestSubjects: profile.weakestSubjects,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        lastActiveAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
      };
      this.userProfiles.set(profile.userName, userProfile);
    });

    // Sample detailed answers for user behavior analysis
    const difficulties = ["Easy", "Intermediate", "Hard"];
    const domains = ["Project Management", "Risk Management", "Quality Management", "Cost Management", "Schedule Management", "Communication"];
    
    for (let i = 0; i < 100; i++) {
      const userName = Math.random() > 0.5 ? "john_doe" : "jane_smith";
      const isCorrect = Math.random() > 0.3; // 70% correct rate
      const timeSpent = Math.floor(Math.random() * 180) + 30; // 30-210 seconds
      
      const answer: DetailedAnswer = {
        id: this.currentDetailedAnswerId++,
        questionId: Math.floor(Math.random() * 20) + 1,
        userAnswer: Math.floor(Math.random() * 4),
        correctAnswer: Math.floor(Math.random() * 4),
        sessionId: Math.floor(Math.random() * 10) + 1,
        isCorrect,
        domain: domains[Math.floor(Math.random() * domains.length)],
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        timeSpent,
        answeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      };
      this.detailedAnswers.set(answer.id, answer);
    }

    // Sample exam analytics
    const examTitles = ["PMP Practice Exam 1", "PMP Practice Exam 2", "AWS Solutions Architect", "CompTIA Security+"];
    
    for (let i = 0; i < 20; i++) {
      const userName = Math.random() > 0.5 ? "john_doe" : "jane_smith";
      const totalQuestions = 20;
      const correctAnswers = Math.floor(Math.random() * 8) + 12; // 12-20 correct
      const score = ((correctAnswers / totalQuestions) * 100).toFixed(1);
      
      const examAnalytic: ExamAnalytics = {
        id: this.currentExamAnalyticsId++,
        userName,
        examId: Math.floor(Math.random() * 4) + 1,
        sessionId: Math.floor(Math.random() * 10) + 1,
        score: parseFloat(score),
        correctAnswers,
        totalQuestions,
        timeSpent: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
        completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        completionRate: "100%",
        domainScores: JSON.stringify({
          "Project Management": Math.floor(Math.random() * 40) + 60,
          "Risk Management": Math.floor(Math.random() * 40) + 60,
          "Quality Management": Math.floor(Math.random() * 40) + 60
        }),
        difficultyBreakdown: JSON.stringify({
          "Easy": Math.floor(Math.random() * 5) + 3,
          "Intermediate": Math.floor(Math.random() * 8) + 5,
          "Hard": Math.floor(Math.random() * 5) + 2
        }),
        streakData: JSON.stringify({
          currentStreak: Math.floor(Math.random() * 5),
          longestStreak: Math.floor(Math.random() * 10) + 5
        })
      };
      this.examAnalytics.set(examAnalytic.id, examAnalytic);
    }

    // Sample performance trends
    ["john_doe", "jane_smith"].forEach(userName => {
      const trends: PerformanceTrends[] = [];
      for (let week = 0; week < 8; week++) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (week * 7));
        
        const trend: PerformanceTrends = {
          id: this.currentPerformanceTrendsId++,
          userName,
          subjectId: 1,
          week: weekDate.toISOString().split('T')[0],
          examsTaken: Math.floor(Math.random() * 10) + 1,
          questionsAnswered: Math.floor(Math.random() * 50) + 20,
          averageScore: (Math.floor(Math.random() * 30) + 70).toString(), // 70-100
          accuracyTrend: (Math.random() * 20 - 10).toFixed(1), // -10 to +10
          speedTrend: (Math.random() * 2 + 1).toFixed(1), // questions per minute
          strongDomains: JSON.stringify(["Planning", "Risk Management"]),
          weakDomains: JSON.stringify(["Quality", "Communications"]),
          createdAt: weekDate
        };
        trends.push(trend);
      }
      this.performanceTrends.set(userName, trends);
    });

    // Sample study recommendations
    const recommendations = [
      "Focus on Risk Management concepts",
      "Practice more Cost Management calculations", 
      "Review Quality Management frameworks",
      "Strengthen Schedule Management skills",
      "Improve Communication techniques"
    ];

    ["john_doe", "jane_smith"].forEach(userName => {
      const userRecommendations: StudyRecommendations[] = [];
      for (let i = 0; i < 3; i++) {
        const rec: StudyRecommendations = {
          id: this.currentStudyRecommendationId++,
          userName,
          subjectId: 1,
          recommendationType: Math.random() > 0.5 ? "weakness_focus" : "skill_building",
          content: recommendations[Math.floor(Math.random() * recommendations.length)],
          priority: Math.floor(Math.random() * 3) + 1, // 1-3
          estimatedImpact: `+${Math.floor(Math.random() * 15) + 5}% score improvement`,
          domains: domains[Math.floor(Math.random() * domains.length)],
          isCompleted: Math.random() > 0.7,
          createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000)
        };
        userRecommendations.push(rec);
      }
      this.studyRecommendations.set(userName, userRecommendations);
    });
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
      sessionId: answerData.sessionId,
      questionId: answerData.questionId,
      userAnswer: answerData.userAnswer,
      correctAnswer: answerData.correctAnswer,
      isCorrect: answerData.isCorrect,
      timeSpent: answerData.timeSpent ?? null,
      difficulty: answerData.difficulty ?? null,
      domain: answerData.domain ?? null,
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
      userName: analyticsData.userName,
      sessionId: analyticsData.sessionId,
      examId: analyticsData.examId,
      totalQuestions: analyticsData.totalQuestions,
      correctAnswers: analyticsData.correctAnswers,
      score: analyticsData.score,
      timeSpent: analyticsData.timeSpent ?? null,
      completionRate: analyticsData.completionRate ?? null,
      domainScores: analyticsData.domainScores ?? null,
      difficultyBreakdown: analyticsData.difficultyBreakdown ?? null,
      streakData: analyticsData.streakData ?? null,
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
    const allRecommendations: StudyRecommendations[] = [];
    this.studyRecommendations.forEach((recommendations) => {
      allRecommendations.push(...recommendations);
    });
    
    const recommendation = allRecommendations.find((r: StudyRecommendations) => r.id === recommendationId);
    if (recommendation) {
      recommendation.isCompleted = true;
      return true;
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