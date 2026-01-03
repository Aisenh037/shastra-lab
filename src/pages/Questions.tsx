import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Filter, Download, ChevronDown, ChevronUp, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  question_text: string;
  question_number: number | null;
  topic: string | null;
  difficulty: string | null;
  importance_explanation: string | null;
  is_analyzed: boolean;
  created_at: string;
  paper: {
    id: string;
    title: string;
    exam_type: string;
    year: number | null;
  } | null;
}

export default function Questions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, topicFilter, difficultyFilter]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          question_number,
          topic,
          difficulty,
          importance_explanation,
          is_analyzed,
          created_at,
          paper:exam_papers(id, title, exam_type, year)
        `)
        .eq('is_analyzed', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedData = data?.map(q => ({
        ...q,
        paper: Array.isArray(q.paper) ? q.paper[0] : q.paper,
      })) || [];

      setQuestions(parsedData);

      // Extract unique topics
      const uniqueTopics = [...new Set(parsedData.map(q => q.topic).filter(Boolean))] as string[];
      setTopics(uniqueTopics);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        q =>
          q.question_text.toLowerCase().includes(term) ||
          q.topic?.toLowerCase().includes(term) ||
          q.paper?.title?.toLowerCase().includes(term)
      );
    }

    if (topicFilter !== 'all') {
      filtered = filtered.filter(q => q.topic === topicFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    setFilteredQuestions(filtered);
  };

  const exportQuestions = () => {
    const exportData = filteredQuestions.map(q => ({
      question: q.question_text,
      topic: q.topic,
      difficulty: q.difficulty,
      importance: q.importance_explanation,
      paper: q.paper?.title,
      year: q.paper?.year,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Questions exported successfully');
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'Easy': return 'bg-success/10 text-success border-success/20';
      case 'Medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'Hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Question Bank</h1>
            <p className="text-muted-foreground mt-1">
              Browse and search all analyzed questions
            </p>
          </div>
          <Button onClick={exportQuestions} variant="outline" disabled={filteredQuestions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>

        {/* Filters */}
        <Card className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions, topics, or papers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground animate-slide-up">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredQuestions.length === 0 ? (
          <Card className="animate-slide-up">
            <CardContent className="py-12 text-center">
              <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {questions.length === 0
                  ? 'No analyzed questions yet. Go to Analyze Paper to get started.'
                  : 'No questions match your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {filteredQuestions.map((q) => (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {q.paper && (
                          <Badge variant="outline" className="font-normal">
                            {q.paper.title} {q.paper.year && `(${q.paper.year})`}
                          </Badge>
                        )}
                        {q.topic && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {q.topic}
                          </Badge>
                        )}
                        {q.difficulty && (
                          <Badge className={getDifficultyColor(q.difficulty)}>
                            {q.difficulty}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{q.question_text}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {expandedQuestion === q.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {expandedQuestion === q.id && q.importance_explanation && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Why is this important?</h4>
                      <p className="text-sm text-muted-foreground">
                        {q.importance_explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
