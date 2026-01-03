import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  PenLine, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus,
  FileText,
  Target,
  TrendingUp,
  BookOpen,
  Sparkles,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PracticeQuestion {
  id: string;
  question_text: string;
  question_type: string;
  max_marks: number;
  word_limit: number | null;
  model_answer: string | null;
  key_points: string[];
  topic: string | null;
  subject: string | null;
}

interface Evaluation {
  score: number;
  percentage: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  paragraphAnalysis: Array<{
    paragraphNumber: number;
    content: string;
    feedback: string;
    rating: 'good' | 'average' | 'needs_improvement';
  }>;
  formatSuggestions: string;
  modelComparison: string;
}

export default function WrittenPractice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [answerImagePreview, setAnswerImagePreview] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<'typed' | 'handwritten'>('typed');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'essay',
    max_marks: 15,
    word_limit: 250,
    model_answer: '',
    topic: '',
    subject: 'General Studies',
  });

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user]);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('practice_questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      const mappedQuestions: PracticeQuestion[] = data.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        max_marks: q.max_marks,
        word_limit: q.word_limit,
        model_answer: q.model_answer,
        key_points: Array.isArray(q.key_points) 
          ? (q.key_points as unknown[]).map(kp => String(kp)) 
          : [],
        topic: q.topic,
        subject: q.subject,
      }));
      setQuestions(mappedQuestions);
    }
  };

  const handleAddQuestion = async () => {
    if (!user || !newQuestion.question_text.trim()) return;

    const { data, error } = await supabase
      .from('practice_questions')
      .insert({
        user_id: user.id,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        max_marks: newQuestion.max_marks,
        word_limit: newQuestion.word_limit,
        model_answer: newQuestion.model_answer || null,
        topic: newQuestion.topic || null,
        subject: newQuestion.subject || null,
        key_points: [],
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    if (data) {
      const newQuestion: PracticeQuestion = {
        id: data.id,
        question_text: data.question_text,
        question_type: data.question_type,
        max_marks: data.max_marks,
        word_limit: data.word_limit,
        model_answer: data.model_answer,
        key_points: [],
        topic: data.topic,
        subject: data.subject,
      };
      setQuestions([newQuestion, ...questions]);
      setShowAddQuestion(false);
      setNewQuestion({
        question_text: '',
        question_type: 'essay',
        max_marks: 15,
        word_limit: 250,
        model_answer: '',
        topic: '',
        subject: 'General Studies',
      });
      toast({ title: 'Question added', description: 'You can now practice answering it.' });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnswerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !selectedQuestion) return;
    if (submissionType === 'typed' && !answerText.trim()) {
      toast({ title: 'Error', description: 'Please write your answer first.', variant: 'destructive' });
      return;
    }
    if (submissionType === 'handwritten' && !answerImage) {
      toast({ title: 'Error', description: 'Please upload your handwritten answer.', variant: 'destructive' });
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      let imageUrl = null;

      // Upload image if handwritten
      if (submissionType === 'handwritten' && answerImage) {
        const fileName = `${user.id}/${Date.now()}_${answerImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from('answer-uploads')
          .upload(fileName, answerImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('answer-uploads')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // For handwritten, we'd need OCR - for now we'll prompt user to also type
      const answerForEvaluation = submissionType === 'typed' 
        ? answerText 
        : answerText || 'Handwritten answer uploaded - OCR pending';

      // Call evaluation function
      const { data: evalData, error: evalError } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          questionText: selectedQuestion.question_text,
          questionType: selectedQuestion.question_type,
          maxMarks: selectedQuestion.max_marks,
          wordLimit: selectedQuestion.word_limit,
          modelAnswer: selectedQuestion.model_answer,
          keyPoints: selectedQuestion.key_points,
          studentAnswer: answerForEvaluation,
          subject: selectedQuestion.subject,
          topic: selectedQuestion.topic,
        },
      });

      if (evalError) throw evalError;

      setEvaluation(evalData);

      // Save submission
      await supabase.from('answer_submissions').insert({
        user_id: user.id,
        question_id: selectedQuestion.id,
        answer_text: answerText || null,
        answer_image_url: imageUrl,
        submission_type: submissionType,
        status: 'evaluated',
        score: evalData.score,
        max_score: selectedQuestion.max_marks,
        overall_feedback: evalData.overallFeedback,
        strengths: evalData.strengths,
        improvements: evalData.improvements,
        paragraph_analysis: evalData.paragraphAnalysis,
        format_suggestions: evalData.formatSuggestions,
        model_comparison: evalData.modelComparison,
        evaluated_at: new Date().toISOString(),
      });

      toast({ title: 'Evaluation complete!', description: 'Check your results below.' });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({ 
        title: 'Evaluation failed', 
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetPractice = () => {
    setSelectedQuestion(null);
    setAnswerText('');
    setAnswerImage(null);
    setAnswerImagePreview(null);
    setEvaluation(null);
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-emerald-500 bg-emerald-500/10';
      case 'average': return 'text-amber-500 bg-amber-500/10';
      case 'needs_improvement': return 'text-rose-500 bg-rose-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PenLine className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Written Answer Practice</h1>
              <p className="text-muted-foreground">Practice UPSC Mains answers with AI evaluation</p>
            </div>
          </div>
          <Button onClick={() => setShowAddQuestion(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {/* Add Question Modal */}
        {showAddQuestion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Add Practice Question
                <Button variant="ghost" size="icon" onClick={() => setShowAddQuestion(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Text *</Label>
                <Textarea 
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Enter the question..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Subject</Label>
                  <Input 
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    placeholder="e.g., GS Paper 1"
                  />
                </div>
                <div>
                  <Label>Topic</Label>
                  <Input 
                    value={newQuestion.topic}
                    onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                    placeholder="e.g., Polity"
                  />
                </div>
                <div>
                  <Label>Max Marks</Label>
                  <Input 
                    type="number"
                    value={newQuestion.max_marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, max_marks: parseInt(e.target.value) || 15 })}
                  />
                </div>
                <div>
                  <Label>Word Limit</Label>
                  <Input 
                    type="number"
                    value={newQuestion.word_limit}
                    onChange={(e) => setNewQuestion({ ...newQuestion, word_limit: parseInt(e.target.value) || 250 })}
                  />
                </div>
              </div>
              <div>
                <Label>Model Answer (Optional)</Label>
                <Textarea 
                  value={newQuestion.model_answer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, model_answer: e.target.value })}
                  placeholder="Add an ideal answer for comparison..."
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={handleAddQuestion} className="w-full">
                Add Question
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!selectedQuestion ? (
          // Question Selection
          <div className="grid gap-4">
            {questions.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Practice Questions</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first question to start practicing written answers
                  </p>
                  <Button onClick={() => setShowAddQuestion(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              questions.map((q) => (
                <Card 
                  key={q.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedQuestion(q)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">{q.question_text}</p>
                        <div className="flex gap-2 mt-2">
                          {q.subject && <Badge variant="outline">{q.subject}</Badge>}
                          {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                          <Badge>{q.max_marks} marks</Badge>
                          {q.word_limit && <Badge variant="outline">{q.word_limit} words</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Practice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          // Answer Practice Interface
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Question & Answer Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Question</CardTitle>
                      <CardDescription>
                        {selectedQuestion.max_marks} marks | {selectedQuestion.word_limit} words
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetPractice}>
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{selectedQuestion.question_text}</p>
                  <div className="flex gap-2 mt-3">
                    {selectedQuestion.subject && (
                      <Badge variant="outline">{selectedQuestion.subject}</Badge>
                    )}
                    {selectedQuestion.topic && (
                      <Badge variant="secondary">{selectedQuestion.topic}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Answer</CardTitle>
                  <Tabs value={submissionType} onValueChange={(v) => setSubmissionType(v as 'typed' | 'handwritten')}>
                    <TabsList>
                      <TabsTrigger value="typed">
                        <PenLine className="h-4 w-4 mr-2" />
                        Type Answer
                      </TabsTrigger>
                      <TabsTrigger value="handwritten">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Handwritten
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submissionType === 'typed' ? (
                    <div>
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your answer here..."
                        className="min-h-[300px]"
                        disabled={isEvaluating}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>Word count: {answerText.split(/\s+/).filter(Boolean).length}</span>
                        {selectedQuestion.word_limit && (
                          <span>Target: {selectedQuestion.word_limit} words</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="answer-image"
                          disabled={isEvaluating}
                        />
                        <label htmlFor="answer-image" className="cursor-pointer">
                          {answerImagePreview ? (
                            <img 
                              src={answerImagePreview} 
                              alt="Answer preview" 
                              className="max-h-[300px] mx-auto rounded-lg"
                            />
                          ) : (
                            <>
                              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">
                                Click to upload your handwritten answer
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Supports JPG, PNG, HEIC
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                      {/* Also allow text for handwritten to help AI understand */}
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Optional: Type your answer for better AI evaluation
                        </Label>
                        <Textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type your answer here for more accurate evaluation..."
                          className="min-h-[100px] mt-2"
                          disabled={isEvaluating}
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleSubmitAnswer} 
                    className="w-full" 
                    disabled={isEvaluating}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Submit for AI Evaluation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Evaluation Results */}
            <div className="space-y-4">
              {isEvaluating ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium mb-2">Evaluating Your Answer</h3>
                    <p className="text-muted-foreground">
                      Our AI is analyzing your response against UPSC standards...
                    </p>
                  </CardContent>
                </Card>
              ) : evaluation ? (
                <>
                  {/* Score Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Your Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn("text-4xl font-bold", getScoreColor(evaluation.percentage))}>
                          {evaluation.score}/{selectedQuestion.max_marks}
                        </div>
                        <div className={cn("text-2xl font-semibold", getScoreColor(evaluation.percentage))}>
                          {evaluation.percentage.toFixed(0)}%
                        </div>
                      </div>
                      <Progress value={evaluation.percentage} className="h-3" />
                      <p className="text-muted-foreground mt-4">{evaluation.overallFeedback}</p>
                    </CardContent>
                  </Card>

                  {/* Strengths & Improvements */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
                          <CheckCircle className="h-4 w-4" />
                          What You Did Well
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {evaluation.strengths.map((s, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-emerald-500">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
                          <TrendingUp className="h-4 w-4" />
                          Areas to Improve
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {evaluation.improvements.map((s, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-amber-500">→</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Paragraph Analysis */}
                  {evaluation.paragraphAnalysis.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Paragraph-by-Paragraph Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3">
                            {evaluation.paragraphAnalysis.map((p, i) => (
                              <div key={i} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Paragraph {p.paragraphNumber}</span>
                                  <Badge className={getRatingColor(p.rating)}>
                                    {p.rating.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{p.feedback}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {/* Format Suggestions */}
                  {evaluation.formatSuggestions && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Format & Structure Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{evaluation.formatSuggestions}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Model Comparison */}
                  {evaluation.modelComparison && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Comparison with Ideal Answer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{evaluation.modelComparison}</p>
                      </CardContent>
                    </Card>
                  )}

                  <Button variant="outline" onClick={resetPractice} className="w-full">
                    Practice Another Question
                  </Button>
                </>
              ) : (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready to Evaluate</h3>
                    <p className="text-muted-foreground">
                      Write your answer and submit for AI-powered evaluation
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
