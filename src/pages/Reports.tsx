import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TopicFrequency {
  topic: string;
  count: number;
  percentage: number;
  weightage: 'High' | 'Medium' | 'Low';
}

interface DifficultyBreakdown {
  difficulty: string;
  count: number;
  color: string;
}

interface ExamStats {
  examType: string;
  questionCount: number;
  paperCount: number;
}

export default function Reports() {
  const { user } = useAuth();
  const [topicFrequency, setTopicFrequency] = useState<TopicFrequency[]>([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<DifficultyBreakdown[]>([]);
  const [examStats, setExamStats] = useState<ExamStats[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  const fetchReportData = async () => {
    try {
      // Fetch all analyzed questions
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          topic,
          difficulty,
          paper:exam_papers(exam_type)
        `)
        .eq('is_analyzed', true);

      if (error) throw error;

      const total = questions?.length || 0;
      setTotalQuestions(total);

      // Calculate topic frequency
      const topicCounts: Record<string, number> = {};
      questions?.forEach(q => {
        if (q.topic) {
          topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
        }
      });

      const sortedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({
          topic,
          count,
          percentage: Math.round((count / total) * 100),
          weightage: (count / total > 0.15 ? 'High' : count / total > 0.08 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
        }))
        .sort((a, b) => b.count - a.count);

      setTopicFrequency(sortedTopics);

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

      // Calculate exam type stats
      const examCounts: Record<string, { questions: number; papers: Set<string> }> = {};
      questions?.forEach(q => {
        const paper = Array.isArray(q.paper) ? q.paper[0] : q.paper;
        const examType = paper?.exam_type;
        if (examType) {
          if (!examCounts[examType]) {
            examCounts[examType] = { questions: 0, papers: new Set() };
          }
          examCounts[examType].questions++;
        }
      });

      // Get paper counts per exam type
      const { data: papers } = await supabase
        .from('exam_papers')
        .select('exam_type');

      papers?.forEach(p => {
        if (p.exam_type && examCounts[p.exam_type]) {
          examCounts[p.exam_type].papers.add(p.exam_type);
        }
      });

      const examStatsData = Object.entries(examCounts).map(([examType, data]) => ({
        examType,
        questionCount: data.questions,
        paperCount: data.papers.size,
      }));

      setExamStats(examStatsData);
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
          <h1 className="text-3xl font-display font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Topic frequency analysis and exam trends
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Questions Analyzed</p>
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
                  <p className="text-sm text-muted-foreground">Unique Topics</p>
                  <p className="text-3xl font-bold mt-1">{topicFrequency.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 text-accent">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exam Types</p>
                  <p className="text-3xl font-bold mt-1">{examStats.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-success/10 text-success">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            <CardTitle className="text-lg">Topic Weightage Analysis</CardTitle>
            <CardDescription>
              Topics ranked by frequency with academic weightage indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topicFrequency.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Topic</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Questions</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Percentage</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weightage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicFrequency.map((topic, index) => (
                      <tr key={topic.topic} className="border-b last:border-0">
                        <td className="py-3 px-4 text-muted-foreground">#{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{topic.topic}</td>
                        <td className="py-3 px-4">{topic.count}</td>
                        <td className="py-3 px-4">{topic.percentage}%</td>
                        <td className="py-3 px-4">
                          <Badge className={`${getWeightageColor(topic.weightage)} flex items-center gap-1 w-fit`}>
                            {getWeightageIcon(topic.weightage)}
                            {topic.weightage}
                          </Badge>
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
