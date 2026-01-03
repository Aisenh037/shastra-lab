import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  BookOpen,
  FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExamPaper {
  id: string;
  title: string;
  exam_type: string;
  year: number | null;
}

interface Question {
  id: string;
  paper_id: string;
  topic: string | null;
  difficulty: string | null;
}

interface YearData {
  year: number;
  paperId: string;
  paperTitle: string;
  questions: Question[];
  topicCounts: Record<string, number>;
  difficultyStats: { easy: number; medium: number; hard: number };
  avgDifficulty: number;
}

export default function YearOverYear() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [papersRes, questionsRes] = await Promise.all([
      supabase
        .from('exam_papers')
        .select('id, title, exam_type, year')
        .eq('status', 'completed')
        .not('year', 'is', null)
        .order('year', { ascending: true }),
      supabase
        .from('questions')
        .select('id, paper_id, topic, difficulty')
        .eq('is_analyzed', true)
    ]);

    if (papersRes.data) setPapers(papersRes.data);
    if (questionsRes.data) setQuestions(questionsRes.data);
    setLoading(false);
  };

  // Get unique exam types
  const examTypes = useMemo(() => {
    const types = new Set(papers.map(p => p.exam_type));
    return [...types].sort();
  }, [papers]);

  // Filter papers by selected exam type and group by year
  const yearlyData = useMemo((): YearData[] => {
    if (!selectedExamType) return [];

    const filteredPapers = papers
      .filter(p => p.exam_type === selectedExamType && p.year)
      .sort((a, b) => (a.year || 0) - (b.year || 0));

    return filteredPapers.map(paper => {
      const paperQuestions = questions.filter(q => q.paper_id === paper.id);
      
      // Count topics
      const topicCounts: Record<string, number> = {};
      paperQuestions.forEach(q => {
        if (q.topic) {
          topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
        }
      });

      // Count difficulty
      const difficultyStats = { easy: 0, medium: 0, hard: 0 };
      paperQuestions.forEach(q => {
        if (q.difficulty === 'easy') difficultyStats.easy++;
        else if (q.difficulty === 'medium') difficultyStats.medium++;
        else if (q.difficulty === 'hard') difficultyStats.hard++;
      });

      // Calculate average difficulty
      const total = paperQuestions.length || 1;
      const avgDifficulty = (difficultyStats.easy * 1 + difficultyStats.medium * 2 + difficultyStats.hard * 3) / total;

      return {
        year: paper.year!,
        paperId: paper.id,
        paperTitle: paper.title,
        questions: paperQuestions,
        topicCounts,
        difficultyStats,
        avgDifficulty
      };
    });
  }, [selectedExamType, papers, questions]);

  // Get all topics across years
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    yearlyData.forEach(yd => {
      Object.keys(yd.topicCounts).forEach(t => topics.add(t));
    });
    return [...topics].sort();
  }, [yearlyData]);

  // Top recurring topics (appear in most years)
  const recurringTopics = useMemo(() => {
    const topicYearCount: Record<string, number> = {};
    yearlyData.forEach(yd => {
      Object.keys(yd.topicCounts).forEach(topic => {
        topicYearCount[topic] = (topicYearCount[topic] || 0) + 1;
      });
    });

    return Object.entries(topicYearCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, yearsAppeared: count, percentage: (count / yearlyData.length) * 100 }));
  }, [yearlyData]);

  // Chart data for difficulty trend
  const difficultyChartData = useMemo(() => {
    return yearlyData.map(yd => ({
      year: yd.year.toString(),
      avgDifficulty: parseFloat(yd.avgDifficulty.toFixed(2)),
      easy: yd.difficultyStats.easy,
      medium: yd.difficultyStats.medium,
      hard: yd.difficultyStats.hard,
      total: yd.questions.length
    }));
  }, [yearlyData]);

  // Chart data for topic trends (top 5 recurring topics)
  const topicChartData = useMemo(() => {
    const top5Topics = recurringTopics.slice(0, 5).map(t => t.topic);
    
    return yearlyData.map(yd => {
      const data: Record<string, any> = { year: yd.year.toString() };
      top5Topics.forEach(topic => {
        data[topic] = yd.topicCounts[topic] || 0;
      });
      return data;
    });
  }, [yearlyData, recurringTopics]);

  // Calculate year-over-year changes
  const yoyChanges = useMemo(() => {
    if (yearlyData.length < 2) return null;

    const first = yearlyData[0];
    const last = yearlyData[yearlyData.length - 1];

    const difficultyChange = last.avgDifficulty - first.avgDifficulty;
    const questionCountChange = last.questions.length - first.questions.length;

    // New topics in latest year
    const firstTopics = new Set(Object.keys(first.topicCounts));
    const lastTopics = new Set(Object.keys(last.topicCounts));
    const newTopics = [...lastTopics].filter(t => !firstTopics.has(t));
    const droppedTopics = [...firstTopics].filter(t => !lastTopics.has(t));

    return {
      difficultyChange,
      questionCountChange,
      newTopics,
      droppedTopics,
      firstYear: first.year,
      lastYear: last.year
    };
  }, [yearlyData]);

  const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Year-over-Year Analysis</h1>
            <p className="text-muted-foreground">Track how exams have evolved across multiple years</p>
          </div>
        </div>

        {/* Exam Type Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Exam Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedExamType} onValueChange={setSelectedExamType}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose an exam type to analyze" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map(type => {
                  const count = papers.filter(p => p.exam_type === type && p.year).length;
                  return (
                    <SelectItem key={type} value={type}>
                      {type} ({count} {count === 1 ? 'year' : 'years'})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedExamType && yearlyData.length > 0 && (
          <>
            {/* Summary Cards */}
            {yoyChanges && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Years Analyzed</p>
                        <p className="text-2xl font-bold">{yearlyData.length}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {yoyChanges.firstYear} → {yoyChanges.lastYear}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Difficulty Trend</p>
                        <div className={cn(
                          "text-2xl font-bold flex items-center gap-1",
                          yoyChanges.difficultyChange > 0.1 && "text-rose-500",
                          yoyChanges.difficultyChange < -0.1 && "text-emerald-500"
                        )}>
                          {yoyChanges.difficultyChange > 0.1 && <TrendingUp className="h-5 w-5" />}
                          {yoyChanges.difficultyChange < -0.1 && <TrendingDown className="h-5 w-5" />}
                          {Math.abs(yoyChanges.difficultyChange) <= 0.1 && <Minus className="h-5 w-5" />}
                          {yoyChanges.difficultyChange > 0 ? '+' : ''}{yoyChanges.difficultyChange.toFixed(2)}
                        </div>
                      </div>
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {yoyChanges.difficultyChange > 0.1 ? 'Getting harder' : 
                       yoyChanges.difficultyChange < -0.1 ? 'Getting easier' : 'Stable difficulty'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">New Topics</p>
                        <p className="text-2xl font-bold text-emerald-500">{yoyChanges.newTopics.length}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Added since {yoyChanges.firstYear}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dropped Topics</p>
                        <p className="text-2xl font-bold text-rose-500">{yoyChanges.droppedTopics.length}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-rose-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Removed since {yoyChanges.firstYear}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Difficulty Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Difficulty Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={difficultyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="year" className="text-xs" />
                        <YAxis domain={[1, 3]} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avgDifficulty" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                          name="Avg Difficulty"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span>1 = Easy</span>
                    <span>2 = Medium</span>
                    <span>3 = Hard</span>
                  </div>
                </CardContent>
              </Card>

              {/* Topic Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Top Topics Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={topicChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="year" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        {recurringTopics.slice(0, 5).map((t, i) => (
                          <Line 
                            key={t.topic}
                            type="monotone" 
                            dataKey={t.topic} 
                            stroke={colors[i]}
                            strokeWidth={2}
                            dot={{ fill: colors[i] }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recurring Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Most Consistent Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recurringTopics.map(({ topic, yearsAppeared, percentage }) => (
                    <div key={topic} className="flex items-center gap-3">
                      <span className="text-sm w-48 truncate">{topic}</span>
                      <Progress value={percentage} className="flex-1 h-2" />
                      <Badge variant="outline" className="w-24 justify-center">
                        {yearsAppeared} / {yearlyData.length} years
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Year-by-Year Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Year-by-Year Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {yearlyData.map((yd, idx) => {
                      const prevYear = idx > 0 ? yearlyData[idx - 1] : null;
                      const diffChange = prevYear ? yd.avgDifficulty - prevYear.avgDifficulty : 0;

                      return (
                        <div key={yd.year} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-lg px-3 py-1">
                                {yd.year}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{yd.paperTitle}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{yd.questions.length} questions</span>
                              {prevYear && (
                                <div className={cn(
                                  "flex items-center gap-1",
                                  diffChange > 0.1 && "text-rose-500",
                                  diffChange < -0.1 && "text-emerald-500"
                                )}>
                                  {diffChange > 0.1 && <TrendingUp className="h-4 w-4" />}
                                  {diffChange < -0.1 && <TrendingDown className="h-4 w-4" />}
                                  {Math.abs(diffChange) <= 0.1 && <Minus className="h-4 w-4" />}
                                  <span className="text-xs">
                                    {diffChange > 0 ? '+' : ''}{diffChange.toFixed(2)} difficulty
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 rounded bg-emerald-500" />
                              <span>Easy: {yd.difficultyStats.easy}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 rounded bg-amber-500" />
                              <span>Medium: {yd.difficultyStats.medium}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 rounded bg-rose-500" />
                              <span>Hard: {yd.difficultyStats.hard}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {Object.entries(yd.topicCounts)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([topic, count]) => (
                                <Badge key={topic} variant="outline" className="text-xs">
                                  {topic} ({count})
                                </Badge>
                              ))}
                            {Object.keys(yd.topicCounts).length > 5 && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                +{Object.keys(yd.topicCounts).length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* New & Dropped Topics */}
            {yoyChanges && (yoyChanges.newTopics.length > 0 || yoyChanges.droppedTopics.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {yoyChanges.newTopics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-emerald-500">
                        <TrendingUp className="h-5 w-5" />
                        New Topics in {yoyChanges.lastYear}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {yoyChanges.newTopics.map(topic => (
                          <Badge key={topic} className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {yoyChanges.droppedTopics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-rose-500">
                        <TrendingDown className="h-5 w-5" />
                        Dropped Topics (not in {yoyChanges.lastYear})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {yoyChanges.droppedTopics.map(topic => (
                          <Badge key={topic} className="bg-rose-500/10 text-rose-500 border-rose-500/20">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {selectedExamType && yearlyData.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Multi-Year Data</h3>
              <p className="text-muted-foreground">
                No papers with year data found for {selectedExamType}. 
                Add exam papers with year information to enable year-over-year analysis.
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedExamType && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select an Exam Type</h3>
              <p className="text-muted-foreground">
                Choose an exam type above to see how it has evolved over multiple years
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
