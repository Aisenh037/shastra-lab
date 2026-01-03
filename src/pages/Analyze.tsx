import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FileSearch, Sparkles, Check, Loader2, AlertCircle, ChevronDown, ChevronUp, FileText, Type } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import PdfUploader from '@/components/PdfUploader';

interface Syllabus {
  id: string;
  name: string;
  exam_type: string;
  topics: string[];
}

interface ExtractedQuestion {
  id: string;
  question_text: string;
  question_number: number;
  selected: boolean;
}

interface AnalyzedQuestion extends ExtractedQuestion {
  topic: string | null;
  difficulty: string | null;
  importance_explanation: string | null;
  is_analyzed: boolean;
}

export default function Analyze() {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string>('');
  const [paperTitle, setPaperTitle] = useState('');
  const [examType, setExamType] = useState('');
  const [year, setYear] = useState('');
  const [rawText, setRawText] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [analyzedQuestions, setAnalyzedQuestions] = useState<AnalyzedQuestion[]>([]);
  const [step, setStep] = useState<'input' | 'extract' | 'analyze' | 'complete'>('input');
  const [loading, setLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSyllabi();
    }
  }, [user]);

  const fetchSyllabi = async () => {
    try {
      const { data, error } = await supabase
        .from('syllabi')
        .select('id, name, exam_type, topics')
        .order('name');

      if (error) throw error;
      const parsed: Syllabus[] = data?.map(s => ({
        id: s.id,
        name: s.name,
        exam_type: s.exam_type,
        topics: Array.isArray(s.topics) ? (s.topics as string[]) : [],
      })) || [];
      setSyllabi(parsed);
    } catch (error) {
      console.error('Error fetching syllabi:', error);
    }
  };

  const handleExtract = async () => {
    if (!rawText.trim()) {
      toast.error('Please paste exam paper text');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('extract-questions', {
        body: { text: rawText },
      });

      if (response.error) throw response.error;

      const questions = response.data.questions.map((q: any, index: number) => ({
        id: crypto.randomUUID(),
        question_text: q.question_text,
        question_number: q.question_number || index + 1,
        selected: true,
      }));

      setExtractedQuestions(questions);
      setStep('extract');
      toast.success(`Extracted ${questions.length} questions`);
    } catch (error) {
      console.error('Error extracting questions:', error);
      toast.error('Failed to extract questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    const selectedQuestions = extractedQuestions.filter(q => q.selected);
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    if (!selectedSyllabus) {
      toast.error('Please select a syllabus for classification');
      return;
    }

    const syllabus = syllabi.find(s => s.id === selectedSyllabus);
    if (!syllabus) {
      toast.error('Selected syllabus not found');
      return;
    }

    setLoading(true);
    setStep('analyze');

    try {
      // Create paper record first
      const { data: paper, error: paperError } = await supabase
        .from('exam_papers')
        .insert({
          user_id: user?.id,
          title: paperTitle || 'Untitled Paper',
          exam_type: examType || syllabus.exam_type,
          year: year ? parseInt(year) : null,
          raw_text: rawText,
          syllabus_id: selectedSyllabus,
          status: 'analyzing',
        })
        .select()
        .single();

      if (paperError) throw paperError;

      // Analyze each question
      const analyzed: AnalyzedQuestion[] = [];
      
      for (const question of selectedQuestions) {
        try {
          const response = await supabase.functions.invoke('analyze-question', {
            body: {
              question: question.question_text,
              topics: syllabus.topics,
            },
          });

          if (response.error) throw response.error;

          const analysis = response.data;

          // Save to database
          const { error: insertError } = await supabase.from('questions').insert({
            paper_id: paper.id,
            user_id: user?.id,
            question_text: question.question_text,
            question_number: question.question_number,
            topic: analysis.topic,
            difficulty: analysis.difficulty,
            importance_explanation: analysis.importance_explanation,
            is_analyzed: true,
          });

          if (insertError) throw insertError;

          analyzed.push({
            ...question,
            topic: analysis.topic,
            difficulty: analysis.difficulty,
            importance_explanation: analysis.importance_explanation,
            is_analyzed: true,
          });
        } catch (error) {
          console.error('Error analyzing question:', error);
          analyzed.push({
            ...question,
            topic: null,
            difficulty: null,
            importance_explanation: null,
            is_analyzed: false,
          });
        }
      }

      // Update paper status
      await supabase
        .from('exam_papers')
        .update({ status: 'completed' })
        .eq('id', paper.id);

      setAnalyzedQuestions(analyzed);
      setStep('complete');
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error during analysis:', error);
      toast.error('Analysis failed. Please try again.');
      setStep('extract');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setExtractedQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const toggleAllQuestions = (selected: boolean) => {
    setExtractedQuestions(prev => prev.map(q => ({ ...q, selected })));
  };

  const resetAnalysis = () => {
    setStep('input');
    setRawText('');
    setExtractedQuestions([]);
    setAnalyzedQuestions([]);
    setPaperTitle('');
    setExamType('');
    setYear('');
    setSelectedSyllabus('');
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">Analyze Paper</h1>
          <p className="text-muted-foreground mt-1">
            Extract and analyze questions from exam papers using AI
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 animate-slide-up">
          {['Input', 'Extract', 'Analyze', 'Complete'].map((label, index) => {
            const stepNames = ['input', 'extract', 'analyze', 'complete'];
            const currentIndex = stepNames.indexOf(step);
            const isActive = index <= currentIndex;
            const isCurrent = stepNames[index] === step;

            return (
              <div key={label} className="flex items-center gap-4 flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isActive && index < currentIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
                {index < 3 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      index < currentIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Upload or Paste Exam Paper
              </CardTitle>
              <CardDescription>
                Upload a PDF or paste raw text. AI will extract individual questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Paper Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., UPSC Prelims 2024"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-type">Exam Type</Label>
                  <Input
                    id="exam-type"
                    placeholder="e.g., UPSC"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="syllabus">Syllabus for Classification *</Label>
                <Select value={selectedSyllabus} onValueChange={setSelectedSyllabus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a syllabus" />
                  </SelectTrigger>
                  <SelectContent>
                    {syllabi.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.topics.length} topics)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="pdf" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Upload PDF
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pdf" className="mt-4">
                  <PdfUploader
                    onTextExtracted={setRawText}
                    disabled={loading}
                  />
                  {rawText && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Extracted {rawText.length.toLocaleString()} characters from PDF
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                  <Textarea
                    id="raw-text"
                    placeholder="Paste the full exam paper text here. Include all questions exactly as they appear..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleExtract}
                disabled={loading || !rawText.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extract Questions with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review Extracted Questions */}
        {step === 'extract' && (
          <Card className="animate-scale-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review Extracted Questions</CardTitle>
                  <CardDescription>
                    Select questions to analyze. Deselect any incorrectly extracted items.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleAllQuestions(true)}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleAllQuestions(false)}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {extractedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                      q.selected ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'
                    }`}
                  >
                    <Checkbox
                      checked={q.selected}
                      onCheckedChange={() => toggleQuestion(q.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground">
                        Q{q.question_number}.
                      </span>
                      <p className="text-sm mt-1">{q.question_text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('input')}>
                  Back
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || extractedQuestions.filter(q => q.selected).length === 0}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze {extractedQuestions.filter(q => q.selected).length} Questions
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Analyzing */}
        {step === 'analyze' && (
          <Card className="animate-scale-in">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-xl font-semibold mb-2">Analyzing Questions</h3>
              <p className="text-muted-foreground">
                AI is classifying topics, assigning difficulty, and generating importance explanations...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="space-y-6 animate-scale-in">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-full">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <CardTitle>Analysis Complete!</CardTitle>
                    <CardDescription>
                      {analyzedQuestions.filter(q => q.is_analyzed).length} of {analyzedQuestions.length} questions analyzed successfully
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {analyzedQuestions.map((q) => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Q{q.question_number}</Badge>
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
                          {!q.is_analyzed && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2">{q.question_text}</p>
                      </div>
                      {expandedQuestion === q.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetAnalysis}>
                Analyze Another Paper
              </Button>
              <Button onClick={() => window.location.href = '/questions'}>
                View Question Bank
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
