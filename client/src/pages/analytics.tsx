import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Clock, Brain, Award, BarChart3, PieChart as PieChartIcon, Activity, Users } from "lucide-react";

interface AnalyticsOverview {
  userProfile: any;
  examAnalytics: any[];
  answerHistory: any[];
  performanceTrends: any[];
  metrics: {
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    difficultyAnalysis: Record<string, { correct: number; total: number }>;
  };
}

export default function Analytics() {
  const { userName, isSignedIn } = useAuth();
  const [selectedUser, setSelectedUser] = useState("john_doe");

  // Fetch real analytics data from our API
  const { data: analyticsData, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['/api/analytics/overview', selectedUser],
    enabled: !!selectedUser,
  });

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground">Please sign in to view your analytics dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
              <p className="text-muted-foreground">Start taking exams to see your analytics data.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Process data for visualizations
  const difficultyAccuracy = Object.entries(analyticsData.metrics.difficultyAnalysis).map(([difficulty, data]) => ({
    difficulty,
    accuracy: data.total > 0 ? parseFloat((data.correct / data.total * 100).toFixed(1)) : 0,
    total: data.total,
    correct: data.correct
  }));

  const domainPerformance = analyticsData.answerHistory.reduce((acc: any, answer: any) => {
    const domain = answer.domain || 'Unknown';
    if (!acc[domain]) {
      acc[domain] = { correct: 0, total: 0 };
    }
    acc[domain].total++;
    if (answer.isCorrect) acc[domain].correct++;
    return acc;
  }, {});

  const domainData = Object.entries(domainPerformance).map(([domain, data]: [string, any]) => ({
    domain,
    accuracy: data.total > 0 ? parseFloat((data.correct / data.total * 100).toFixed(1)) : 0,
    total: data.total
  }));

  const timeDistribution = analyticsData.answerHistory
    .filter((answer: any) => answer.timeSpent > 0)
    .map((answer: any) => ({
      questionId: answer.questionId,
      timeSpent: answer.timeSpent,
      isCorrect: answer.isCorrect,
      difficulty: answer.difficulty || 'Unknown'
    }));

  const examScoreHistory = analyticsData.examAnalytics
    .map((exam: any) => ({
      date: new Date(exam.completedAt).toLocaleDateString(),
      score: parseFloat(exam.score),
      timeSpent: exam.timeSpent ? Math.floor(exam.timeSpent / 60) : 0,
      examId: exam.examId
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10); // Last 10 exams

  const weeklyTrends = analyticsData.performanceTrends
    .map((trend: any) => ({
      week: new Date(trend.createdAt).toLocaleDateString(),
      score: parseFloat(trend.averageScore || '0'),
      questionsAttempted: trend.questionsAttempted || 0,
      timeSpent: trend.timeSpentMinutes || 0
    }))
    .slice(-8); // Last 8 weeks

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const userProfile = analyticsData.userProfile;
  const averageScore = parseFloat(userProfile?.averageScore || '0');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Comprehensive performance insights and learning patterns</p>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john_doe">John Doe</SelectItem>
                <SelectItem value="jane_smith">Jane Smith</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile?.totalExamsTaken || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.examAnalytics.length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {userProfile?.totalQuestionsAnswered || 0} questions answered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(analyticsData.metrics.totalTimeSpent / 3600)}h
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.metrics.averageTimePerQuestion.toFixed(1)}s avg per question
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answer Accuracy</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.answerHistory.length > 0 ? 
                  ((analyticsData.answerHistory.filter((a: any) => a.isCorrect).length / analyticsData.answerHistory.length) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.answerHistory.length} total answers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="difficulty">Difficulty Analysis</TabsTrigger>
            <TabsTrigger value="domains">Domain Performance</TabsTrigger>
            <TabsTrigger value="timing">Time Analysis</TabsTrigger>
            <TabsTrigger value="behavior">Learning Behavior</TabsTrigger>
          </TabsList>

          {/* Performance Trends Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Score Progression
                  </CardTitle>
                  <CardDescription>Exam scores over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={examScoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#0088FE" 
                        strokeWidth={2}
                        dot={{ fill: '#0088FE', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Questions attempted and time spent</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="questionsAttempted" fill="#00C49F" name="Questions" />
                      <Line yAxisId="right" type="monotone" dataKey="score" stroke="#FF8042" strokeWidth={2} name="Score %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Difficulty Analysis Tab */}
          <TabsContent value="difficulty" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Difficulty Level Performance</CardTitle>
                  <CardDescription>Accuracy by question difficulty</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={difficultyAccuracy}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="difficulty" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                      <Bar dataKey="accuracy" fill="#8884D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Question Distribution</CardTitle>
                  <CardDescription>Number of questions by difficulty</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={difficultyAccuracy}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                        label={({ difficulty, total }) => `${difficulty}: ${total}`}
                      >
                        {difficultyAccuracy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Domain Performance Tab */}
          <TabsContent value="domains" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Domain Accuracy Comparison</CardTitle>
                  <CardDescription>Performance across knowledge domains</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={domainData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="domain" type="category" width={150} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                      <Bar dataKey="accuracy" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Radar Chart - Domain Strengths</CardTitle>
                  <CardDescription>Overall performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={domainData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="domain" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        name="Accuracy"
                        dataKey="accuracy"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Time Analysis Tab */}
          <TabsContent value="timing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time vs Accuracy</CardTitle>
                  <CardDescription>Relationship between time spent and correctness</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={timeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeSpent" name="Time (seconds)" />
                      <YAxis dataKey="isCorrect" name="Correct" domain={[0, 1]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Answers" data={timeDistribution} fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Time by Difficulty</CardTitle>
                  <CardDescription>Time spent on different difficulty levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Easy', 'Intermediate', 'Hard'].map((difficulty) => {
                      const difficultyAnswers = timeDistribution.filter((d: any) => d.difficulty === difficulty);
                      const avgTime = difficultyAnswers.length > 0 
                        ? difficultyAnswers.reduce((sum: number, d: any) => sum + d.timeSpent, 0) / difficultyAnswers.length 
                        : 0;
                      
                      return (
                        <div key={difficulty} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{difficulty}</span>
                            <span className="text-sm text-muted-foreground">{avgTime.toFixed(1)}s</span>
                          </div>
                          <Progress value={(avgTime / 300) * 100} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Learning Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Learning Patterns Analysis
                  </CardTitle>
                  <CardDescription>Insights into your study behavior and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Strongest Areas */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-green-600">Strongest Areas</h4>
                      {userProfile?.strongestSubjects?.split(',').map((subject: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {subject.trim()}
                        </Badge>
                      )) || <p className="text-sm text-muted-foreground">No data available</p>}
                    </div>

                    {/* Areas for Improvement */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-orange-600">Areas for Improvement</h4>
                      {userProfile?.weakestSubjects?.split(',').map((subject: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                          {subject.trim()}
                        </Badge>
                      )) || <p className="text-sm text-muted-foreground">No data available</p>}
                    </div>

                    {/* Study Statistics */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-blue-600">Study Statistics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last Activity:</span>
                          <span>{userProfile?.lastActiveAt ? new Date(userProfile.lastActiveAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Sessions:</span>
                          <span>{analyticsData.examAnalytics.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Session Time:</span>
                          <span>
                            {analyticsData.examAnalytics.length > 0 
                              ? Math.floor(analyticsData.examAnalytics.reduce((sum: number, exam: any) => sum + (exam.timeSpent || 0), 0) / analyticsData.examAnalytics.length / 60)
                              : 0}m
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}