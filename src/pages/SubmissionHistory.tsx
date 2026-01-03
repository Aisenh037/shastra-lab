import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, History, Target, Award, BookOpen, Eye, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import SubjectAnalytics from '@/components/SubjectAnalytics';

interface Submission {
  id: string;
  created_at: string;
  score: number | null;
  max_score: number | null;
  status: string;
  overall_feedback: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  format_suggestions: string | null;
  question: {
    question_text: string;
    subject: string | null;
    topic: string | null;
    max_marks: number;
  } | null;
}

export default function SubmissionHistory() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects'>('overview');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submission-history', user?.id, timeRange],
    queryFn: async () => {
      let query = supabase
        .from('answer_submissions')
        .select(`
          id,
          created_at,
          score,
          max_score,
          status,
          overall_feedback,
          strengths,
          improvements,
          format_suggestions,
          question:practice_questions(question_text, subject, topic, max_marks)
        `)
        .eq('status', 'evaluated')
        .order('created_at', { ascending: false });

      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Submission[];
    },
    enabled: !!user,
  });

  const stats = submissions ? {
    totalSubmissions: submissions.length,
    averageScore: submissions.length > 0
      ? Math.round(submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length * 10) / 10
      : 0,
    averagePercentage: submissions.length > 0
      ? Math.round(submissions.reduce((acc, s) => acc + ((s.score || 0) / (s.max_score || 10) * 100), 0) / submissions.length)
      : 0,
    highestScore: Math.max(...submissions.map(s => s.score || 0), 0),
  } : { totalSubmissions: 0, averageScore: 0, averagePercentage: 0, highestScore: 0 };

  const chartData = submissions
    ? [...submissions]
        .reverse()
        .map((s, index) => ({
          date: format(new Date(s.created_at), 'MMM d'),
          score: s.score || 0,
          percentage: Math.round((s.score || 0) / (s.max_score || 10) * 100),
          index: index + 1,
        }))
    : [];

  const getTrend = () => {
    if (chartData.length < 2) return 'neutral';
    const recentAvg = chartData.slice(-3).reduce((a, b) => a + b.percentage, 0) / Math.min(3, chartData.length);
    const olderAvg = chartData.slice(0, Math.max(1, chartData.length - 3)).reduce((a, b) => a + b.percentage, 0) / Math.max(1, chartData.length - 3);
    if (recentAvg > olderAvg + 5) return 'up';
    if (recentAvg < olderAvg - 5) return 'down';
    return 'neutral';
  };

  const trend = getTrend();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Submission History</h1>
            <p className="text-muted-foreground mt-1">Track your progress and improvement over time</p>
          </div>
          <Select value={timeRange} onValueChange={(v: 'week' | 'month' | 'all') => setTimeRange(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for Overview vs Subject Analytics */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'subjects')}>
          <TabsList>
            <TabsTrigger value="overview">
              <History className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BarChart3 className="h-4 w-4 mr-2" />
              Subject Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}</div>
                  <p className="text-xs text-muted-foreground">{stats.averagePercentage}% average</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Highest Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.highestScore}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Trend</CardTitle>
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}</div>
                  <p className="text-xs text-muted-foreground">Based on recent performance</p>
                </CardContent>
              </Card>
            </div>

        {/* Progress Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Score Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                      name="Score %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading submissions...</div>
            ) : submissions && submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {submission.question?.question_text?.substring(0, 80) || 'Question'}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {submission.question?.subject && (
                          <Badge variant="secondary" className="text-xs">
                            {submission.question.subject}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {submission.score}/{submission.max_score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((submission.score || 0) / (submission.max_score || 10) * 100)}%
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Submission Details</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh]">
                            <div className="space-y-4 pr-4">
                              <div>
                                <h4 className="font-semibold mb-2">Question</h4>
                                <p className="text-sm text-muted-foreground">{submission.question?.question_text}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="default" className="text-lg px-3 py-1">
                                  Score: {submission.score}/{submission.max_score}
                                </Badge>
                              </div>
                              {submission.overall_feedback && (
                                <div>
                                  <h4 className="font-semibold mb-2">Overall Feedback</h4>
                                  <p className="text-sm">{submission.overall_feedback}</p>
                                </div>
                              )}
                              {submission.strengths && submission.strengths.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-green-600">Strengths</h4>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {(submission.strengths as string[]).map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {submission.improvements && submission.improvements.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2 text-amber-600">Areas for Improvement</h4>
                                  <ul className="list-disc list-inside text-sm space-y-1">
                                    {(submission.improvements as string[]).map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {submission.format_suggestions && (
                                <div>
                                  <h4 className="font-semibold mb-2">Format Suggestions</h4>
                                  <p className="text-sm">{submission.format_suggestions}</p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No submissions found. Start practicing to see your history!
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="subjects" className="mt-6">
            <SubjectAnalytics submissions={submissions || []} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
