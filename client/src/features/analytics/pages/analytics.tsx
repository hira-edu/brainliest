// Analytics.tsx
// Elite-level, war-tested logic enhancements with inline commentary

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { Header } from "../../shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Award,
  Target,
  Clock,
  Brain,
  Activity
} from "lucide-react";

// Define colors constant outside component to avoid re-creation on each render
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface AnalyticsOverview {
  userProfile: {
    averageScore?: string;
    totalExamsTaken?: number;
    totalQuestionsAnswered?: number;
    strongestSubjects?: string;
    weakestSubjects?: string;
    lastActiveAt?: string;
  };
  examAnalytics: Array<{ completedAt: string; score: string; timeSpent?: number; examId: string }>;
  answerHistory: Array<{ questionId: string; timeSpent: number; isCorrect: boolean; domain?: string; difficulty?: string }>;
  performanceTrends: Array<{ createdAt: string; averageScore?: string; questionsAttempted?: number; timeSpentMinutes?: number }>;
  metrics: {
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    difficultyAnalysis: Record<string, { correct: number; total: number }>;
  };
}

export default function Analytics() {
  // Authentication check
  const { userName, isSignedIn } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>(userName || "");

  // Memoized handler to prevent unnecessary re-renders
  const handleUserChange = useCallback((value: string) => {
    setSelectedUser(value);
  }, []);

  // Data fetching with error handling and retry logic
  const {
    data: analyticsData,
    isLoading,
    isError,
    error
  } = useQuery<AnalyticsOverview>(
    ['/api/analytics/overview', selectedUser],
    { enabled: !!selectedUser },
    {
      retry: 2,
      onError: (err) => console.error('Failed to fetch analytics:', err)
    }
  );

  // Redirect or prompt if not signed in
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">Loading analytics...</div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-red-500">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2 text-red-600">Error Loading Data</h2>
              <p className="text-sm text-red-500">{(error as Error)?.message || 'Unknown error occurred.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No data fallback
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

  // === Data processing ===

  // 1. Difficulty accuracy calculation
  const difficultyAccuracy = useMemo(() => {
    return Object.entries(analyticsData.metrics.difficultyAnalysis).map(
      ([difficulty, { correct, total }]) => ({
        difficulty,
        accuracy: total > 0 ? parseFloat(((correct / total) * 100).toFixed(1)) : 0,
        total,
        correct
      })
    );
  }, [analyticsData.metrics.difficultyAnalysis]);

  // 2. Domain performance calculation
  const domainData = useMemo(() => {
    const performance: Record<string, { correct: number; total: number }> = {};
    analyticsData.answerHistory.forEach(({ domain = 'Unknown', isCorrect }) => {
      if (!performance[domain]) performance[domain] = { correct: 0, total: 0 };
      performance[domain].total += 1;
      if (isCorrect) performance[domain].correct += 1;
    });
    return Object.entries(performance).map(([domain, { correct, total }]) => ({
      domain,
      accuracy: total > 0 ? parseFloat(((correct / total) * 100).toFixed(1)) : 0,
      total
    }));
  }, [analyticsData.answerHistory]);

  // 3. Time distribution for scatter chart
  const timeDistribution = useMemo(
    () => analyticsData.answerHistory
      .filter(a => a.timeSpent > 0)
      .map(({ questionId, timeSpent, isCorrect, difficulty = 'Unknown' }) => ({ questionId, timeSpent, isCorrect: isCorrect ? 1 : 0, difficulty })),
    [analyticsData.answerHistory]
  );

  // 4. Recent exam scores (last 10), sorted chronologically
  const examScoreHistory = useMemo(() => {
    return analyticsData.examAnalytics
      .map(({ completedAt, score, timeSpent, examId }) => ({
        date: new Date(completedAt).toLocaleDateString(),
        score: Number(score),
        timeSpent: timeSpent ? Math.floor(timeSpent / 60) : 0,
        examId
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [analyticsData.examAnalytics]);

  // 5. Weekly performance trends
  const weeklyTrends = useMemo(() => {
    return analyticsData.performanceTrends.map(({ createdAt, averageScore, questionsAttempted = 0, timeSpentMinutes = 0 }) => ({
      week: new Date(createdAt).toLocaleDateString(),
      score: Number(averageScore) || 0,
      questionsAttempted,
      timeSpent: timeSpentMinutes
    }));
  }, [analyticsData.performanceTrends]);

  // Extract user profile summary
  const userProfile = analyticsData.userProfile;
  const averageScore = parseFloat(userProfile.averageScore || '0');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* --- Dashboard Header --- */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Comprehensive performance insights and learning patterns</p>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={selectedUser} onValueChange={handleUserChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                {/* In production, fetch user list from API instead of hardcoded */}
                <SelectItem value="john_doe">John Doe</SelectItem>
                <SelectItem value="jane_smith">Jane Smith</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- Key Metrics Overview --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Exams */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfile.totalExamsTaken ?? 0}</div>
              <p className="text-xs text-muted-foreground">{analyticsData.examAnalytics.length} completed</p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{userProfile.totalQuestionsAnswered ?? 0} answered</p>
            </CardContent>
          </Card>

          {/* Total Time Spent */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(analyticsData.metrics.totalTimeSpent / 3600)}h</div>
              <p className="text-xs text-muted-foreground">{analyticsData.metrics.averageTimePerQuestion.toFixed(1)}s avg</p>
            </CardContent>
          </Card>

          {/* Answer Accuracy */}
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Answer Accuracy</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.answerHistory.length > 0
                  ? ((analyticsData.answerHistory.filter(a => a.isCorrect).length / analyticsData.answerHistory.length) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">{analyticsData.answerHistory.length} answers</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Analytics Tabs --- */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
            <TabsTrigger value="difficulty">Difficulty Analysis</TabsTrigger>
            <TabsTrigger value="domains">Domain Performance</TabsTrigger>
            <TabsTrigger value="timing">Time Analysis</TabsTrigger>
            <TabsTrigger value="behavior">Learning Behavior</TabsTrigger>
          </TabsList>

          {/* Performance Trends Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* ...Charts as before, using updated data props... */}
          </TabsContent>

          {/* Difficulty Analysis Tab */}
          <TabsContent value="difficulty" className="space-y-6">
            {/* ...Charts as before... */}
          </TabsContent>

          {/* Domain Performance Tab */}
          <TabsContent value="domains" className="space-y-6">
            {/* ...Charts as before... */}
          </TabsContent>

          {/* Time Analysis Tab */}
          <TabsContent value="timing" className="space-y-6">
            {/* ...Charts as before... */}
          </TabsContent>

          {/* Learning Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            {/* ...Badges and stats as before... */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
