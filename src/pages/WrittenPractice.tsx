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
import { FeedbackVideo } from '@/components/FeedbackVideo';
import { useNotifications } from '@/hooks/useNotifications';
import { useTTS } from '@/hooks/useTTS';
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
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Video,
  Bell,
  BellOff
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
  mock_test_id?: string | null;
}

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  exam_type: string;
  subject: string | null;
  is_template: boolean;
  time_limit_minutes: number | null;
  questions: PracticeQuestion[];
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
  const notifications = useNotifications();
  const tts = useTTS();
  
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [pyqTemplates, setPyqTemplates] = useState<MockTest[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerImages, setAnswerImages] = useState<File[]>([]);
  const [answerImagePreviews, setAnswerImagePreviews] = useState<string[]>([]);
  const [submissionType, setSubmissionType] = useState<'typed' | 'handwritten'>('typed');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0 });
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-questions' | 'pyq-templates'>('pyq-templates');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showVideoFeedback, setShowVideoFeedback] = useState(false);
  const [videoSlides, setVideoSlides] = useState<any[]>([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsSummary, setTtsSummary] = useState<string | null>(null);
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
      fetchPyqTemplates();
    }
  }, [user]);

  const fetchQuestions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('user_id', user.id)
      .is('mock_test_id', null)
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
        mock_test_id: q.mock_test_id,
      }));
      setQuestions(mappedQuestions);
    }
  };

  const fetchPyqTemplates = async () => {
    // Fetch template mock tests
    const { data: mockTests } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('is_template', true)
      .order('title', { ascending: true });
    
    if (!mockTests) return;

    // Fetch questions for each template
    const templatesWithQuestions: MockTest[] = [];
    for (const test of mockTests) {
      const { data: questions } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('mock_test_id', test.id)
        .order('created_at', { ascending: true });
      
      templatesWithQuestions.push({
        id: test.id,
        title: test.title,
        description: test.description,
        exam_type: test.exam_type,
        subject: test.subject,
        is_template: test.is_template,
        time_limit_minutes: test.time_limit_minutes,
        questions: (questions || []).map(q => ({
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
          mock_test_id: q.mock_test_id,
        })),
      });
    }
    
    setPyqTemplates(templatesWithQuestions);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Add new files to existing ones
    const newFiles = [...answerImages, ...files];
    setAnswerImages(newFiles);
    setExtractedText(null);
    
    // Generate previews for new files
    const newPreviews: string[] = [];
    for (const file of files) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(preview);
    }
    
    const allPreviews = [...answerImagePreviews, ...newPreviews];
    setAnswerImagePreviews(allPreviews);
    
    // Extract text from all pages
    setIsExtractingText(true);
    setOcrProgress({ current: 0, total: allPreviews.length });
    
    try {
      let combinedText = '';
      
      for (let i = 0; i < allPreviews.length; i++) {
        setOcrProgress({ current: i + 1, total: allPreviews.length });
        
        const { data, error } = await supabase.functions.invoke('ocr-handwriting', {
          body: { imageData: allPreviews[i] },
        });
        
        if (error) throw error;
        
        if (data?.text) {
          combinedText += `--- Page ${i + 1} ---\n${data.text}\n\n`;
        }
      }
      
      if (combinedText) {
        setExtractedText(combinedText.trim());
        setAnswerText(combinedText.trim());
        toast({ 
          title: 'Text extracted!', 
          description: `Extracted text from ${allPreviews.length} page(s).` 
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({ 
        title: 'OCR failed', 
        description: 'Could not extract text. You can type it manually.',
        variant: 'destructive' 
      });
    } finally {
      setIsExtractingText(false);
      setOcrProgress({ current: 0, total: 0 });
    }
  };

  const removeImage = (index: number) => {
    const newImages = answerImages.filter((_, i) => i !== index);
    const newPreviews = answerImagePreviews.filter((_, i) => i !== index);
    setAnswerImages(newImages);
    setAnswerImagePreviews(newPreviews);
    if (newImages.length === 0) {
      setExtractedText(null);
      setAnswerText('');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !selectedQuestion) return;
    if (submissionType === 'typed' && !answerText.trim()) {
      toast({ title: 'Error', description: 'Please write your answer first.', variant: 'destructive' });
      return;
    }
    if (submissionType === 'handwritten' && answerImages.length === 0) {
      toast({ title: 'Error', description: 'Please upload your handwritten answer.', variant: 'destructive' });
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const imageUrls: string[] = [];

      // Upload images if handwritten
      if (submissionType === 'handwritten' && answerImages.length > 0) {
        for (let i = 0; i < answerImages.length; i++) {
          const file = answerImages[i];
          const fileName = `${user.id}/${Date.now()}_page${i + 1}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('answer-uploads')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('answer-uploads')
            .getPublicUrl(fileName);
          
          imageUrls.push(urlData.publicUrl);
        }
      }
      
      const imageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;

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

      // Send push notification
      if (notifications.permission === 'granted') {
        notifications.notifyEvaluationComplete(evalData.score, selectedQuestion.max_marks);
      }

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

  const handleGenerateTTS = async () => {
    if (!evaluation) return;
    
    setIsGeneratingTTS(true);
    try {
      const feedbackText = `
        Score: ${evaluation.score} out of ${selectedQuestion?.max_marks}, which is ${evaluation.percentage}%.
        Overall feedback: ${evaluation.overallFeedback}.
        Strengths: ${evaluation.strengths.join('. ')}.
        Areas to improve: ${evaluation.improvements.join('. ')}.
      `;

      const { data, error } = await supabase.functions.invoke('tts-feedback', {
        body: { text: feedbackText },
      });

      if (error) throw error;

      if (data?.summary) {
        setTtsSummary(data.summary);
        tts.speak(data.summary);
      }
    } catch (error) {
      console.error('TTS error:', error);
      toast({ 
        title: 'Could not generate audio', 
        description: 'Using browser speech instead.',
        variant: 'destructive' 
      });
      // Fallback to direct speech
      const fallbackText = `You scored ${evaluation.score} out of ${selectedQuestion?.max_marks}. ${evaluation.overallFeedback}`;
      tts.speak(fallbackText);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!evaluation || !selectedQuestion) return;
    
    setIsGeneratingVideo(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-feedback', {
        body: {
          score: evaluation.score,
          percentage: evaluation.percentage,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          overallFeedback: evaluation.overallFeedback,
          questionText: selectedQuestion.question_text,
        },
      });

      if (error) throw error;

      if (data?.slides) {
        setVideoSlides(data.slides);
        setShowVideoFeedback(true);
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast({ 
        title: 'Could not generate video', 
        description: 'Please try again later.',
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const resetPractice = () => {
    setSelectedQuestion(null);
    setAnswerText('');
    setAnswerImages([]);
    setAnswerImagePreviews([]);
    setExtractedText(null);
    setEvaluation(null);
    setShowVideoFeedback(false);
    setVideoSlides([]);
    setTtsSummary(null);
    tts.stop();
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
          // Question Selection with Tabs
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my-questions' | 'pyq-templates')}>
            <TabsList className="mb-4">
              <TabsTrigger value="pyq-templates" className="gap-2">
                <FileText className="h-4 w-4" />
                UPSC PYQ Templates
              </TabsTrigger>
              <TabsTrigger value="my-questions" className="gap-2">
                <BookOpen className="h-4 w-4" />
                My Questions
              </TabsTrigger>
            </TabsList>

            {/* PYQ Templates Tab */}
            <TabsContent value="pyq-templates" className="space-y-4">
              {pyqTemplates.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No PYQ Templates Available</h3>
                    <p className="text-muted-foreground">
                      Previous year question templates will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pyqTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            {template.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {template.description}
                          </CardDescription>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{template.exam_type}</Badge>
                            {template.subject && <Badge variant="secondary">{template.subject}</Badge>}
                            <Badge>{template.questions.length} questions</Badge>
                            {template.time_limit_minutes && (
                              <Badge variant="outline">{template.time_limit_minutes} min</Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          {expandedTemplate === template.id ? 'Collapse' : 'Expand'}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {expandedTemplate === template.id && (
                      <CardContent className="border-t pt-4 space-y-3">
                        {template.questions.map((q, idx) => (
                          <div 
                            key={q.id}
                            className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Q{idx + 1}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {q.max_marks} marks
                                  </Badge>
                                  {q.word_limit && (
                                    <Badge variant="outline" className="text-xs">
                                      {q.word_limit} words
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium text-foreground">{q.question_text}</p>
                                <div className="flex gap-2 mt-2">
                                  {q.subject && <Badge variant="secondary" className="text-xs">{q.subject}</Badge>}
                                  {q.topic && <Badge className="text-xs">{q.topic}</Badge>}
                                </div>
                                {q.model_answer && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm text-muted-foreground">Model answer available</span>
                                  </div>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuestion(q);
                                  setShowModelAnswer(false);
                                }}
                              >
                                Practice
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            {/* My Questions Tab */}
            <TabsContent value="my-questions" className="space-y-4">
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
            </TabsContent>
          </Tabs>
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
                  
                  {/* Model Answer Toggle */}
                  {selectedQuestion.model_answer && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowModelAnswer(!showModelAnswer)}
                      >
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        {showModelAnswer ? 'Hide Model Answer' : 'View Model Answer'}
                      </Button>
                      
                      {showModelAnswer && (
                        <div className="mt-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <h4 className="font-medium text-sm text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Model Answer
                          </h4>
                          <div className="text-sm text-foreground whitespace-pre-wrap">
                            {selectedQuestion.model_answer}
                          </div>
                          
                          {selectedQuestion.key_points && selectedQuestion.key_points.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-amber-500/20">
                              <h5 className="font-medium text-sm text-amber-600 dark:text-amber-400 mb-2">
                                Key Points to Cover:
                              </h5>
                              <ul className="space-y-1">
                                {selectedQuestion.key_points.map((point, idx) => (
                                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                      {/* Image Upload Area */}
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="answer-image"
                          disabled={isEvaluating || isExtractingText}
                        />
                        <label htmlFor="answer-image" className="cursor-pointer block">
                          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            {answerImagePreviews.length > 0 
                              ? 'Click to add more pages' 
                              : 'Click to upload your handwritten answer'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Supports multiple pages • JPG, PNG, HEIC
                          </p>
                        </label>
                      </div>
                      
                      {/* Image Previews Grid */}
                      {answerImagePreviews.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Uploaded Pages ({answerImagePreviews.length})</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {answerImagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={preview} 
                                  alt={`Page ${index + 1}`} 
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeImage(index)}
                                    disabled={isExtractingText}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className="absolute bottom-1 left-1 text-xs"
                                >
                                  Page {index + 1}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* OCR Status */}
                      {isExtractingText && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-primary">
                            Extracting text... Page {ocrProgress.current} of {ocrProgress.total}
                          </span>
                        </div>
                      )}
                      
                      {extractedText && !isExtractingText && (
                        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-500">
                              Text extracted from {answerImagePreviews.length} page(s)
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Extracted/Editable Text */}
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          {extractedText ? 'Extracted text (edit if needed):' : 'Optional: Type your answer for better AI evaluation'}
                        </Label>
                        <Textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder={extractedText ? '' : 'Type your answer here for more accurate evaluation...'}
                          className="min-h-[150px] mt-2"
                          disabled={isEvaluating || isExtractingText}
                        />
                        {answerText && (
                          <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>Word count: {answerText.split(/\s+/).filter(Boolean).length}</span>
                            {selectedQuestion.word_limit && (
                              <span>Target: {selectedQuestion.word_limit} words</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleSubmitAnswer} 
                    className="w-full" 
                    disabled={isEvaluating || isExtractingText}
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
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Your Score
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Notification Toggle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (notifications.permission !== 'granted') {
                                await notifications.requestPermission();
                              }
                            }}
                            title={notifications.permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
                          >
                            {notifications.permission === 'granted' ? (
                              <Bell className="h-4 w-4 text-primary" />
                            ) : (
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          
                          {/* TTS Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (tts.isSpeaking) {
                                tts.stop();
                              } else {
                                handleGenerateTTS();
                              }
                            }}
                            disabled={isGeneratingTTS}
                            title={tts.isSpeaking ? 'Stop reading' : 'Read feedback aloud'}
                          >
                            {isGeneratingTTS ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : tts.isSpeaking ? (
                              <VolumeX className="h-4 w-4 text-primary" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* Video Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleGenerateVideo}
                            disabled={isGeneratingVideo}
                            title="Generate video summary"
                          >
                            {isGeneratingVideo ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Video className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
                      
                      {/* TTS Status */}
                      {tts.isSpeaking && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/10 flex items-center gap-3">
                          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-primary">Reading feedback...</p>
                            <p className="text-xs text-muted-foreground">Click the speaker icon to stop</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => tts.toggle()}>
                            {tts.isPaused ? 'Resume' : 'Pause'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Video Feedback */}
                  {showVideoFeedback && videoSlides.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-purple-500" />
                            Video Summary
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowVideoFeedback(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FeedbackVideo 
                          slides={videoSlides} 
                          onComplete={() => {
                            toast({ title: 'Video complete!', description: 'Great job reviewing your feedback.' });
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}

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

                  {/* Side-by-Side Comparison */}
                  {selectedQuestion.model_answer && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          Side-by-Side Answer Comparison
                        </CardTitle>
                        <CardDescription>
                          Compare your answer with the model answer
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Your Answer */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 pb-2 border-b">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <span className="font-medium text-sm">Your Answer</span>
                              <Badge variant="outline" className="ml-auto">
                                {answerText.split(/\s+/).filter(Boolean).length} words
                              </Badge>
                            </div>
                            <ScrollArea className="h-[300px]">
                              <div className="text-sm text-foreground whitespace-pre-wrap pr-4">
                                {answerText || 'No text answer provided'}
                              </div>
                            </ScrollArea>
                          </div>

                          {/* Model Answer */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-amber-500/30">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span className="font-medium text-sm text-amber-600 dark:text-amber-400">Model Answer</span>
                              <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-600 dark:text-amber-400">
                                {selectedQuestion.model_answer.split(/\s+/).filter(Boolean).length} words
                              </Badge>
                            </div>
                            <ScrollArea className="h-[300px]">
                              <div className="text-sm text-foreground whitespace-pre-wrap pr-4 bg-amber-500/5 p-3 rounded-lg">
                                {selectedQuestion.model_answer}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>

                        {/* Key Points Checklist */}
                        {selectedQuestion.key_points && selectedQuestion.key_points.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Key Points Coverage
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {selectedQuestion.key_points.map((point, idx) => {
                                const isIncluded = answerText.toLowerCase().includes(
                                  point.toLowerCase().split(' ').slice(0, 3).join(' ')
                                );
                                return (
                                  <div 
                                    key={idx} 
                                    className={cn(
                                      "flex items-start gap-2 p-2 rounded-lg text-sm",
                                      isIncluded 
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {isIncluded ? (
                                      <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    )}
                                    <span>{point}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
