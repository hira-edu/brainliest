import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  userProfile: {
    totalExamsTaken: number;
    totalQuestionsAnswered: number;
    averageScore: number;
    strongestSubjects: string[];
    weakestSubjects: string[];
  };
  examHistory: Array<{
    examName: string;
    score: number;
    date: string;
    timeSpent: number;
    correctAnswers: number;
    totalQuestions: number;
  }>;
  performanceTrends: Array<{
    week: string;
    averageScore: number;
    examsTaken: number;
  }>;
  domainAnalysis: Array<{
    domain: string;
    accuracy: number;
    questionsAnswered: number;
  }>;
  studyRecommendations: Array<{
    id: number;
    type: string;
    content: string;
    priority: number;
    estimatedImpact: number;
    isCompleted: boolean;
  }>;
}

export default function Analytics() {
  const { isSignedIn, userName } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Mock data for demonstration - would come from API
  const mockAnalyticsData: AnalyticsData = {
    userProfile: {
      totalExamsTaken: 12,
      totalQuestionsAnswered: 480,
      averageScore: 78.5,
      strongestSubjects: ["Risk Management", "Quality Management"],
      weakestSubjects: ["Integration Management", "Communications"]
    },
    examHistory: [
      { examName: "PMP Practice Exam 1", score: 85, date: "2025-01-05", timeSpent: 3600, correctAnswers: 34, totalQuestions: 40 },
      { examName: "PMP Mock Exam 2", score: 72, date: "2025-01-03", timeSpent: 3480, correctAnswers: 29, totalQuestions: 40 },
      { examName: "AWS Fundamentals", score: 88, date: "2025-01-01", timeSpent: 2100, correctAnswers: 22, totalQuestions: 25 },
      { examName: "PMP Practice Exam 1", score: 76, date: "2024-12-28", timeSpent: 3720, correctAnswers: 30, totalQuestions: 40 },
      { examName: "PMP Mock Exam 2", score: 69, date: "2024-12-25", timeSpent: 3900, correctAnswers: 28, totalQuestions: 40 },
    ],
    performanceTrends: [
      { week: "Week 1", averageScore: 75, examsTaken: 3 },
      { week: "Week 2", averageScore: 78, examsTaken: 4 },
      { week: "Week 3", averageScore: 82, examsTaken: 3 },
      { week: "Week 4", averageScore: 85, examsTaken: 2 },
    ],
    domainAnalysis: [
      { domain: "Project Management", accuracy: 85, questionsAnswered: 120 },
      { domain: "Risk Management", accuracy: 92, questionsAnswered: 80 },
      { domain: "Quality Management", accuracy: 88, questionsAnswered: 75 },
      { domain: "Integration Management", accuracy: 65, questionsAnswered: 95 },
      { domain: "Communications", accuracy: 70, questionsAnswered: 110 },
    ],
    studyRecommendations: [
      {
        id: 1,
        type: "focus_area",
        content: "Focus on Integration Management concepts - your accuracy is below average",
        priority: 3,
        estimatedImpact: 15.5,
        isCompleted: false
      },
      {
        id: 2,
        type: "review",
        content: "Review Communications Management - strengthen your foundation",
        priority: 2,
        estimatedImpact: 12.0,
        isCompleted: false
      },
      {
        id: 3,
        type: "strength",
        content: "Continue practicing Risk Management - you're performing excellently",
        priority: 1,
        estimatedImpact: 5.0,
        isCompleted: true
      }
    ]
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
            <p className="text-gray-600">Please sign in to view your performance analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getPriorityBadgeVariant = (priority: number) => {
    if (priority >= 3) return "destructive";
    if (priority === 2) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Welcome back, {userName}! Here's your detailed performance analysis.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalyticsData.userProfile.totalExamsTaken}</div>
              <p className="text-xs text-gray-500">+2 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Questions Answered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalyticsData.userProfile.totalQuestionsAnswered}</div>
              <p className="text-xs text-gray-500">+80 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalyticsData.userProfile.averageScore}%</div>
              <p className="text-xs text-green-600">+3.2% improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-gray-500">consecutive days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="domains">Domain Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="history">Exam History</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Your score improvement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockAnalyticsData.performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="averageScore" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subject Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Your strongest and weakest areas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Strongest Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                      {mockAnalyticsData.userProfile.strongestSubjects.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Areas for Improvement</h4>
                    <div className="flex flex-wrap gap-2">
                      {mockAnalyticsData.userProfile.weakestSubjects.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="domains" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Domain Accuracy Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Domain Accuracy Analysis</CardTitle>
                  <CardDescription>Accuracy percentage by knowledge domain</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalyticsData.domainAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="domain" angle={-45} textAnchor="end" height={100} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Detailed Domain Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Domain Details</CardTitle>
                  <CardDescription>Questions answered and accuracy by domain</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalyticsData.domainAnalysis.map((domain, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{domain.domain}</span>
                          <span>{domain.accuracy}%</span>
                        </div>
                        <Progress value={domain.accuracy} className="h-2" />
                        <div className="text-xs text-gray-500">
                          {domain.questionsAnswered} questions answered
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Study Recommendations</CardTitle>
                <CardDescription>AI-powered suggestions to improve your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalyticsData.studyRecommendations.map((recommendation) => (
                    <div 
                      key={recommendation.id} 
                      className={`p-4 border rounded-lg ${
                        recommendation.isCompleted 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityBadgeVariant(recommendation.priority)}>
                            Priority {recommendation.priority}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {recommendation.type.replace('_', ' ')}
                          </Badge>
                          {recommendation.isCompleted && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          +{recommendation.estimatedImpact}% impact
                        </span>
                      </div>
                      <p className="text-gray-800">{recommendation.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam History</CardTitle>
                <CardDescription>Detailed history of your exam attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalyticsData.examHistory.map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{exam.examName}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(exam.date).toLocaleDateString()} • {formatTime(exam.timeSpent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          exam.score >= 80 ? 'text-green-600' : 
                          exam.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {exam.score}%
                        </div>
                        <p className="text-sm text-gray-500">
                          {exam.correctAnswers}/{exam.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}