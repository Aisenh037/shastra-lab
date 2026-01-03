import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { GitCompare, FileText, BookOpen, BarChart3 } from 'lucide-react';

interface ExamPaper {
  id: string;
  title: string;
  exam_type: string;
  year: number | null;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  topic: string | null;
  difficulty: string | null;
  question_number: number | null;
}

interface TopicStats {
  topic: string;
  count: number;
  percentage: number;
}

interface DifficultyStats {
  easy: number;
  medium: number;
  hard: number;
}

export default function PaperComparison() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [paper1Id, setPaper1Id] = useState<string>('');
  const [paper2Id, setPaper2Id] = useState<string>('');
  const [paper1Questions, setPaper1Questions] = useState<Question[]>([]);
  const [paper2Questions, setPaper2Questions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPapers();
    }
  }, [user]);

  useEffect(() => {
    if (paper1Id) {
      fetchQuestions(paper1Id, setPaper1Questions);
    } else {
      setPaper1Questions([]);
    }
  }, [paper1Id]);

  useEffect(() => {
    if (paper2Id) {
      fetchQuestions(paper2Id, setPaper2Questions);
    } else {
      setPaper2Questions([]);
    }
  }, [paper2Id]);

  const fetchPapers = async () => {
    const { data } = await supabase
      .from('exam_papers')
      .select('id, title, exam_type, year, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (data) setPapers(data);
  };

  const fetchQuestions = async (paperId: string, setter: (q: Question[]) => void) => {
    setLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('id, question_text, topic, difficulty, question_number')
      .eq('paper_id', paperId)
      .eq('is_analyzed', true)
      .order('question_number', { ascending: true });
    
    if (data) setter(data);
    setLoading(false);
  };

  const getTopicStats = (questions: Question[]): TopicStats[] => {
    const topicCounts: Record<string, number> = {};
    questions.forEach(q => {
      if (q.topic) {
        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
      }
    });
    
    const total = questions.length;
    return Object.entries(topicCounts)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getDifficultyStats = (questions: Question[]): DifficultyStats => {
    const stats = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      if (q.difficulty === 'easy') stats.easy++;
      else if (q.difficulty === 'medium') stats.medium++;
      else if (q.difficulty === 'hard') stats.hard++;
    });
    return stats;
  };

  const getCommonTopics = (): string[] => {
    const topics1 = new Set(paper1Questions.map(q => q.topic).filter(Boolean));
    const topics2 = new Set(paper2Questions.map(q => q.topic).filter(Boolean));
    return [...topics1].filter(t => topics2.has(t));
  };

  const getUniqueTopics = (questions: Question[], otherQuestions: Question[]): string[] => {
    const topics = new Set(questions.map(q => q.topic).filter(Boolean));
    const otherTopics = new Set(otherQuestions.map(q => q.topic).filter(Boolean));
    return [...topics].filter(t => !otherTopics.has(t));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'hard': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const paper1 = papers.find(p => p.id === paper1Id);
  const paper2 = papers.find(p => p.id === paper2Id);
  const commonTopics = paper1Id && paper2Id ? getCommonTopics() : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GitCompare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Paper Comparison</h1>
            <p className="text-muted-foreground">Compare two exam papers side-by-side</p>
          </div>
        </div>

        {/* Paper Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">First Paper</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paper1Id} onValueChange={setPaper1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first paper" />
                </SelectTrigger>
                <SelectContent>
                  {papers.filter(p => p.id !== paper2Id).map(paper => (
                    <SelectItem key={paper.id} value={paper.id}>
                      {paper.title} ({paper.exam_type} {paper.year || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Second Paper</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paper2Id} onValueChange={setPaper2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second paper" />
                </SelectTrigger>
                <SelectContent>
                  {papers.filter(p => p.id !== paper1Id).map(paper => (
                    <SelectItem key={paper.id} value={paper.id}>
                      {paper.title} ({paper.exam_type} {paper.year || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Common Topics */}
        {paper1Id && paper2Id && commonTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Common Topics ({commonTopics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {commonTopics.map(topic => (
                  <Badge key={topic} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Side-by-Side Comparison */}
        {(paper1Id || paper2Id) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paper 1 */}
            <div className="space-y-4">
              {paper1 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {paper1.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {paper1.exam_type} {paper1.year || ''}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{paper1Questions.length}</div>
                          <div className="text-xs text-muted-foreground">Questions</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{getTopicStats(paper1Questions).length}</div>
                          <div className="text-xs text-muted-foreground">Topics</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{getUniqueTopics(paper1Questions, paper2Questions).length}</div>
                          <div className="text-xs text-muted-foreground">Unique</div>
                        </div>
                      </div>

                      {/* Difficulty Distribution */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Difficulty Distribution
                        </h4>
                        <div className="space-y-2">
                          {(['easy', 'medium', 'hard'] as const).map(level => {
                            const stats = getDifficultyStats(paper1Questions);
                            const count = stats[level];
                            const percentage = paper1Questions.length > 0 ? (count / paper1Questions.length) * 100 : 0;
                            return (
                              <div key={level} className="flex items-center gap-2">
                                <span className="text-xs w-16 capitalize">{level}</span>
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-xs w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top Topics */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Top Topics</h4>
                        <div className="space-y-2">
                          {getTopicStats(paper1Questions).slice(0, 5).map(stat => (
                            <div key={stat.topic} className="flex items-center gap-2">
                              <span className="text-xs flex-1 truncate">{stat.topic}</span>
                              <Progress value={stat.percentage} className="w-20 h-2" />
                              <span className="text-xs w-6 text-right">{stat.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-3">
                          {paper1Questions.map((q, idx) => (
                            <div key={q.id} className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Q{q.question_number || idx + 1}
                                </span>
                                <p className="text-sm flex-1">{q.question_text}</p>
                              </div>
                              <div className="flex gap-2">
                                {q.topic && (
                                  <Badge variant="outline" className="text-xs">{q.topic}</Badge>
                                )}
                                {q.difficulty && (
                                  <Badge className={`text-xs ${getDifficultyColor(q.difficulty)}`}>
                                    {q.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {paper1Questions.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No analyzed questions found
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
              {!paper1 && (
                <Card className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground">Select a paper to compare</p>
                </Card>
              )}
            </div>

            {/* Paper 2 */}
            <div className="space-y-4">
              {paper2 && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {paper2.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {paper2.exam_type} {paper2.year || ''}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{paper2Questions.length}</div>
                          <div className="text-xs text-muted-foreground">Questions</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{getTopicStats(paper2Questions).length}</div>
                          <div className="text-xs text-muted-foreground">Topics</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{getUniqueTopics(paper2Questions, paper1Questions).length}</div>
                          <div className="text-xs text-muted-foreground">Unique</div>
                        </div>
                      </div>

                      {/* Difficulty Distribution */}
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Difficulty Distribution
                        </h4>
                        <div className="space-y-2">
                          {(['easy', 'medium', 'hard'] as const).map(level => {
                            const stats = getDifficultyStats(paper2Questions);
                            const count = stats[level];
                            const percentage = paper2Questions.length > 0 ? (count / paper2Questions.length) * 100 : 0;
                            return (
                              <div key={level} className="flex items-center gap-2">
                                <span className="text-xs w-16 capitalize">{level}</span>
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-xs w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Top Topics */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Top Topics</h4>
                        <div className="space-y-2">
                          {getTopicStats(paper2Questions).slice(0, 5).map(stat => (
                            <div key={stat.topic} className="flex items-center gap-2">
                              <span className="text-xs flex-1 truncate">{stat.topic}</span>
                              <Progress value={stat.percentage} className="w-20 h-2" />
                              <span className="text-xs w-6 text-right">{stat.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-3">
                          {paper2Questions.map((q, idx) => (
                            <div key={q.id} className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Q{q.question_number || idx + 1}
                                </span>
                                <p className="text-sm flex-1">{q.question_text}</p>
                              </div>
                              <div className="flex gap-2">
                                {q.topic && (
                                  <Badge variant="outline" className="text-xs">{q.topic}</Badge>
                                )}
                                {q.difficulty && (
                                  <Badge className={`text-xs ${getDifficultyColor(q.difficulty)}`}>
                                    {q.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                          {paper2Questions.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No analyzed questions found
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
              {!paper2 && (
                <Card className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground">Select a paper to compare</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {!paper1Id && !paper2Id && (
          <Card className="py-12">
            <CardContent className="text-center">
              <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Papers to Compare</h3>
              <p className="text-muted-foreground">
                Choose two exam papers from the dropdowns above to see a side-by-side comparison
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
