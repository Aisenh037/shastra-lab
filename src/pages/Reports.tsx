import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, TrendingDown, Minus, Calendar, ArrowUpRight, ArrowDownRight, Mail, Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid 
} from 'recharts';

interface TopicFrequency {
  topic: string;
  count: number;
  percentage: number;
  weightage: 'High' | 'Medium' | 'Low';
  trend?: 'up' | 'down' | 'stable';
  trendPercentage?: number;
}

interface DifficultyBreakdown {
  difficulty: string;
  count: number;
  color: string;
}

interface YearlyTrend {
  year: number;
  [key: string]: number;
}

interface TopicByPaper {
  paper: string;
  year: number | null;
  topics: Record<string, number>;
}

interface EmailPreferences {
  id?: string;
  email: string;
  frequency: 'weekly' | 'monthly' | 'both';
  is_enabled: boolean;
}

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topicFrequency, setTopicFrequency] = useState<TopicFrequency[]>([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<DifficultyBreakdown[]>([]);
  const [yearlyTrends, setYearlyTrends] = useState<YearlyTrend[]>([]);
  const [topTopics, setTopTopics] = useState<string[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPapers, setTotalPapers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  
  // Email preferences state
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences>({
    email: '',
    frequency: 'weekly',
    is_enabled: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReportData();
      fetchEmailPreferences();
    }
  }, [user]);

  const fetchEmailPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('email_report_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmailPrefs({
          id: data.id,
          email: data.email,
          frequency: data.frequency as 'weekly' | 'monthly' | 'both',
          is_enabled: data.is_enabled,
        });
      } else {
        setEmailPrefs({
          email: user?.email || '',
          frequency: 'weekly',
          is_enabled: false,
        });
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error);
    }
  };

  const saveEmailPreferences = async () => {
    if (!user) return;
    
    setSavingPrefs(true);
    try {
      if (emailPrefs.id) {
        const { error } = await supabase
          .from('email_report_preferences')
          .update({
            email: emailPrefs.email,
            frequency: emailPrefs.frequency,
            is_enabled: emailPrefs.is_enabled,
          })
          .eq('id', emailPrefs.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('email_report_preferences')
          .insert({
            user_id: user.id,
            email: emailPrefs.email,
            frequency: emailPrefs.frequency,
            is_enabled: emailPrefs.is_enabled,
          })
          .select()
          .single();

        if (error) throw error;
        setEmailPrefs(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: 'Preferences saved',
        description: emailPrefs.is_enabled 
          ? `You'll receive ${emailPrefs.frequency} progress reports at ${emailPrefs.email}`
          : 'Email reports have been disabled',
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const sendReportNow = async (reportType: 'weekly' | 'monthly') => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-progress-report', {
        body: {
          report_type: 'manual',
          email: emailPrefs.email || user?.email,
        },
      });

      if (error) throw error;

      toast({
        title: 'Report sent!',
        description: `Your ${reportType} progress report has been sent to ${emailPrefs.email || user?.email}`,
      });
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send report',
        variant: 'destructive',
      });
    } finally {
      setSendingReport(false);
    }
  };

  const fetchReportData = async () => {
    try {
      // Fetch all analyzed questions with paper details
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          topic,
          difficulty,
          paper:exam_papers(id, title, exam_type, year)
        `)
        .eq('is_analyzed', true);

      if (error) throw error;

      const total = questions?.length || 0;
      setTotalQuestions(total);

      // Get unique papers
      const paperIds = new Set(questions?.map(q => {
        const paper = Array.isArray(q.paper) ? q.paper[0] : q.paper;
        return paper?.id;
      }).filter(Boolean));
      setTotalPapers(paperIds.size);

      // Calculate topic frequency with year-based trends
      const topicCounts: Record<string, { total: number; byYear: Record<number, number> }> = {};
      
      questions?.forEach(q => {
        if (q.topic) {
          const paper = Array.isArray(q.paper) ? q.paper[0] : q.paper;
          const year = paper?.year;
          
          if (!topicCounts[q.topic]) {
            topicCounts[q.topic] = { total: 0, byYear: {} };
          }
          topicCounts[q.topic].total++;
          
          if (year) {
            topicCounts[q.topic].byYear[year] = (topicCounts[q.topic].byYear[year] || 0) + 1;
          }
        }
      });

      // Calculate trends (comparing recent years)
      const sortedTopics = Object.entries(topicCounts)
        .map(([topic, data]) => {
          const years = Object.keys(data.byYear).map(Number).sort();
          let trend: 'up' | 'down' | 'stable' = 'stable';
          let trendPercentage = 0;
          
          if (years.length >= 2) {
            const recentYears = years.slice(-2);
            const oldCount = data.byYear[recentYears[0]] || 0;
            const newCount = data.byYear[recentYears[1]] || 0;
            
            if (oldCount > 0) {
              trendPercentage = Math.round(((newCount - oldCount) / oldCount) * 100);
              trend = trendPercentage > 10 ? 'up' : trendPercentage < -10 ? 'down' : 'stable';
            } else if (newCount > 0) {
              trend = 'up';
              trendPercentage = 100;
            }
          }
          
          return {
            topic,
            count: data.total,
            percentage: Math.round((data.total / total) * 100),
            weightage: (data.total / total > 0.15 ? 'High' : data.total / total > 0.08 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
            trend,
            trendPercentage: Math.abs(trendPercentage),
          };
        })
        .sort((a, b) => b.count - a.count);

      setTopicFrequency(sortedTopics);
      
      // Get top 5 topics for trend chart
      const top5 = sortedTopics.slice(0, 5).map(t => t.topic);
      setTopTopics(top5);

      // Build yearly trend data
      const yearSet = new Set<number>();
      questions?.forEach(q => {
        const paper = Array.isArray(q.paper) ? q.paper[0] : q.paper;
        if (paper?.year) yearSet.add(paper.year);
      });
      
      const years = Array.from(yearSet).sort();
      const yearlyData: YearlyTrend[] = years.map(year => {
        const yearEntry: YearlyTrend = { year };
        top5.forEach(topic => {
          yearEntry[topic] = topicCounts[topic]?.byYear[year] || 0;
        });
        return yearEntry;
      });
      
      setYearlyTrends(yearlyData);

      // Calculate difficulty breakdown
      const difficultyCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
      questions?.forEach(q => {
        if (q.difficulty) {
          difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
        }
      });

      setDifficultyBreakdown([
        { difficulty: 'Easy', count: difficultyCounts.Easy, color: 'hsl(var(--success))' },
        { difficulty: 'Medium', count: difficultyCounts.Medium, color: 'hsl(var(--warning))' },
        { difficulty: 'Hard', count: difficultyCounts.Hard, color: 'hsl(var(--destructive))' },
      ]);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeightageIcon = (weightage: string) => {
    switch (weightage) {
      case 'High': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'Medium': return <Minus className="h-4 w-4 text-warning" />;
      case 'Low': return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getWeightageColor = (weightage: string) => {
    switch (weightage) {
      case 'High': return 'bg-success/10 text-success border-success/20';
      case 'Medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'Low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable', percentage?: number) => {
    if (!trend || trend === 'stable') return null;
    if (trend === 'up') {
      return (
        <span className="flex items-center text-success text-xs">
          <ArrowUpRight className="h-3 w-3" />
          {percentage}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-destructive text-xs">
        <ArrowDownRight className="h-3 w-3" />
        {percentage}%
      </span>
    );
  };

  const CHART_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
  ];

  const filteredTopicFrequency = selectedTopic === 'all' 
    ? topicFrequency 
    : topicFrequency.filter(t => t.topic === selectedTopic);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading reports...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">Reports & Trends</h1>
          <p className="text-muted-foreground mt-1">
            Topic frequency analysis, trends, and exam insights
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Questions Analyzed</p>
                  <p className="text-3xl font-bold mt-1">{totalQuestions}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Papers Analyzed</p>
                  <p className="text-3xl font-bold mt-1">{totalPapers}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 text-accent">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Topics</p>
                  <p className="text-3xl font-bold mt-1">{topicFrequency.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Weightage</p>
                  <p className="text-3xl font-bold mt-1">
                    {topicFrequency.filter(t => t.weightage === 'High').length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-warning">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Report Preferences */}
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Progress Reports
            </CardTitle>
            <CardDescription>
              Receive automated performance insights directly in your inbox
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable email reports</Label>
                <p className="text-sm text-muted-foreground">
                  Get regular updates on your practice performance
                </p>
              </div>
              <Switch
                checked={emailPrefs.is_enabled}
                onCheckedChange={(checked) => setEmailPrefs(prev => ({ ...prev, is_enabled: checked }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-email">Email address</Label>
                <Input
                  id="report-email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailPrefs.email}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={emailPrefs.frequency}
                  onValueChange={(value: 'weekly' | 'monthly' | 'both') => setEmailPrefs(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={saveEmailPreferences} disabled={savingPrefs}>
                {savingPrefs ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendReportNow('weekly')}
                disabled={sendingReport || !emailPrefs.email}
              >
                {sendingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Report Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Year-over-Year Trends */}
        {yearlyTrends.length > 1 && (
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Topic Trends Over Time
              </CardTitle>
              <CardDescription>
                How frequently topics appear year-over-year (Top 5 topics)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {topTopics.map((topic, index) => (
                      <Line
                        key={topic}
                        type="monotone"
                        dataKey={topic}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic Distribution Chart */}
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Topic Distribution</CardTitle>
              <CardDescription>Questions per topic across all papers</CardDescription>
            </CardHeader>
            <CardContent>
              {topicFrequency.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicFrequency.slice(0, 10)} layout="vertical">
                      <XAxis type="number" />
                      <YAxis
                        dataKey="topic"
                        type="category"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Difficulty Breakdown */}
          <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty Breakdown</CardTitle>
              <CardDescription>Distribution of question difficulty levels</CardDescription>
            </CardHeader>
            <CardContent>
              {difficultyBreakdown.some(d => d.count > 0) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="difficulty"
                      >
                        {difficultyBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {difficultyBreakdown.map((item) => (
                      <div key={item.difficulty} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.difficulty}: {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Topic Frequency Table */}
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Topic Weightage Analysis</CardTitle>
                <CardDescription>
                  Topics ranked by frequency with trend indicators
                </CardDescription>
              </div>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topicFrequency.map(t => (
                    <SelectItem key={t.topic} value={t.topic}>{t.topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTopicFrequency.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Topic</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Questions</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Percentage</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weightage</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopicFrequency.map((topic, index) => (
                      <tr key={topic.topic} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">#{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{topic.topic}</td>
                        <td className="py-3 px-4">{topic.count}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${Math.min(topic.percentage * 2, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm">{topic.percentage}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getWeightageColor(topic.weightage)} flex items-center gap-1 w-fit`}>
                            {getWeightageIcon(topic.weightage)}
                            {topic.weightage}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {getTrendIcon(topic.trend, topic.trendPercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No topic data available. Analyze some exam papers to see reports.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
