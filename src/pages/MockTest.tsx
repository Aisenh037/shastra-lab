import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import AppLayout from '@/components/layouts/AppLayout';
import { MockTestTimer } from '@/components/MockTestTimer';
import { QuestionNavigation, QuestionNavigationLegend } from '@/components/QuestionNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  PlayCircle,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
} from 'lucide-react';

interface MockTest {
  id: string;
  title: string;
  description: string | null;
  exam_type: string;
  subject: string | null;
  time_limit_minutes: number | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  max_marks: number;
  word_limit: number | null;
  model_answer: string | null;
  topic: string | null;
  subject: string | null;
}

interface TestResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  questionResults: Array<{
    questionId: string;
    score: number;
    maxMarks: number;
    feedback: string;
  }>;
}

type TestState = 'selection' | 'ready' | 'in-progress' | 'submitted' | 'results';

export default function MockTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Test state
  const [testState, setTestState] = useState<TestState>('selection');
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Timer
  const timer = useCountdownTimer({
    initialMinutes: selectedTest?.time_limit_minutes || 60,
    onTimeUp: () => handleAutoSubmit(),
    autoStart: false,
  });

  // Fetch available tests
  useEffect(() => {
    if (user) {
      fetchAvailableTests();
    }
  }, [user]);

  // Check for direct test selection from URL
  useEffect(() => {
    const testId = searchParams.get('testId');
    if (testId && availableTests.length > 0) {
      const test = availableTests.find(t => t.id === testId);
      if (test) {
        handleSelectTest(test);
      }
    }
  }, [searchParams, availableTests]);

  const fetchAvailableTests = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('mock_tests')
        .select('*')
        .or(`is_template.eq.true,user_id.eq.${user?.id}`)
        .order('title');

      if (data) {
        setAvailableTests(data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTest = async (test: MockTest) => {
    setSelectedTest(test);
    
    // Fetch questions for this test
    const { data } = await supabase
      .from('practice_questions')
      .select('*')
      .eq('mock_test_id', test.id)
      .order('created_at');

    if (data && data.length > 0) {
      setQuestions(data);
      setTestState('ready');
      timer.reset(test.time_limit_minutes || 60);
    } else {
      toast({
        title: 'No questions found',
        description: 'This test has no questions yet.',
        variant: 'destructive',
      });
    }
  };

  const handleStartTest = () => {
    setTestState('in-progress');
    timer.start();
    toast({
      title: 'Test Started!',
      description: `You have ${selectedTest?.time_limit_minutes || 60} minutes. Good luck!`,
    });
  };

  const handleAnswerChange = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    if (value.trim()) {
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
    } else {
      setAnsweredQuestions(prev => {
        const updated = new Set(prev);
        updated.delete(currentQuestion.id);
        return updated;
      });
    }
  };

  const handleToggleFlag = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setFlaggedQuestions(prev => {
      const updated = new Set(prev);
      if (updated.has(currentQuestion.id)) {
        updated.delete(currentQuestion.id);
      } else {
        updated.add(currentQuestion.id);
      }
      return updated;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAutoSubmit = useCallback(() => {
    toast({
      title: "Time's up!",
      description: 'Your test is being submitted automatically.',
      variant: 'destructive',
    });
    submitTest();
  }, []);

  const handleManualSubmit = () => {
    const unansweredCount = questions.length - answeredQuestions.size;
    if (unansweredCount > 0) {
      setShowSubmitConfirm(true);
    } else {
      submitTest();
    }
  };

  const submitTest = async () => {
    if (!user || !selectedTest) return;
    
    setIsSubmitting(true);
    timer.pause();
    setTestState('submitted');

    try {
      let totalScore = 0;
      const maxScore = questions.reduce((sum, q) => sum + q.max_marks, 0);
      const questionResults: TestResult['questionResults'] = [];

      // Evaluate each answer
      for (const question of questions) {
        const answer = answers[question.id] || '';
        
        if (!answer.trim()) {
          questionResults.push({
            questionId: question.id,
            score: 0,
            maxMarks: question.max_marks,
            feedback: 'No answer provided.',
          });
          continue;
        }

        try {
          const { data: evalData, error } = await supabase.functions.invoke('evaluate-answer', {
            body: {
              questionText: question.question_text,
              questionType: question.question_type,
              maxMarks: question.max_marks,
              wordLimit: question.word_limit,
              modelAnswer: question.model_answer,
              studentAnswer: answer,
              subject: question.subject,
              topic: question.topic,
            },
          });

          if (error) throw error;

          totalScore += evalData.score;
          questionResults.push({
            questionId: question.id,
            score: evalData.score,
            maxMarks: question.max_marks,
            feedback: evalData.overallFeedback,
          });

          // Save submission
          await supabase.from('answer_submissions').insert({
            user_id: user.id,
            question_id: question.id,
            answer_text: answer,
            submission_type: 'typed',
            status: 'evaluated',
            score: evalData.score,
            max_score: question.max_marks,
            overall_feedback: evalData.overallFeedback,
            strengths: evalData.strengths,
            improvements: evalData.improvements,
            paragraph_analysis: evalData.paragraphAnalysis,
            format_suggestions: evalData.formatSuggestions,
            model_comparison: evalData.modelComparison,
            evaluated_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Evaluation error for question:', question.id, error);
          questionResults.push({
            questionId: question.id,
            score: 0,
            maxMarks: question.max_marks,
            feedback: 'Evaluation failed. Please retry.',
          });
        }
      }

      const percentage = Math.round((totalScore / maxScore) * 100);
      setTestResult({ totalScore, maxScore, percentage, questionResults });
      setTestState('results');

      toast({
        title: 'Test Submitted!',
        description: `You scored ${totalScore}/${maxScore} (${percentage}%)`,
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Submission failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
      setTestState('in-progress');
      timer.start();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeTest = () => {
    setAnswers({});
    setAnsweredQuestions(new Set());
    setFlaggedQuestions(new Set());
    setCurrentQuestionIndex(0);
    setTestResult(null);
    setTestState('ready');
    timer.reset(selectedTest?.time_limit_minutes || 60);
  };

  const handleBackToSelection = () => {
    setSelectedTest(null);
    setQuestions([]);
    setAnswers({});
    setAnsweredQuestions(new Set());
    setFlaggedQuestions(new Set());
    setCurrentQuestionIndex(0);
    setTestResult(null);
    setTestState('selection');
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id] || '';
  const wordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timed Mock Test</h1>
            <p className="text-muted-foreground mt-1">
              {testState === 'selection' && 'Select a test to begin your timed practice'}
              {testState === 'ready' && `Ready to start: ${selectedTest?.title}`}
              {testState === 'in-progress' && 'Answer all questions before time runs out'}
              {testState === 'submitted' && 'Evaluating your answers...'}
              {testState === 'results' && 'Review your performance'}
            </p>
          </div>
          
          {testState === 'in-progress' && (
            <MockTestTimer
              minutes={timer.minutes}
              seconds={timer.seconds}
              percentRemaining={timer.percentRemaining}
              isTimeUp={timer.isTimeUp}
            />
          )}
        </div>

        {/* Test Selection */}
        <AnimatePresence mode="wait">
          {testState === 'selection' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="animate-pulse text-muted-foreground">Loading tests...</div>
                </div>
              ) : availableTests.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Tests Available</h3>
                    <p className="text-muted-foreground mt-2">
                      Create a mock test from the Written Practice section first.
                    </p>
                    <Button onClick={() => navigate('/written-practice')} className="mt-4">
                      Go to Written Practice
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                availableTests.map((test) => (
                  <motion.div
                    key={test.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer hover:border-primary transition-colors h-full"
                      onClick={() => handleSelectTest(test)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{test.title}</CardTitle>
                          <Badge variant="secondary">{test.exam_type}</Badge>
                        </div>
                        {test.description && (
                          <CardDescription className="line-clamp-2">
                            {test.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {test.time_limit_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{test.time_limit_minutes} min</span>
                            </div>
                          )}
                          {test.subject && (
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <span>{test.subject}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Ready State */}
          {testState === 'ready' && selectedTest && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{selectedTest.title}</CardTitle>
                  <CardDescription>{selectedTest.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted">
                      <Timer className="h-8 w-8 mx-auto text-primary mb-2" />
                      <div className="text-2xl font-bold">{selectedTest.time_limit_minutes || 60}</div>
                      <div className="text-sm text-muted-foreground">Minutes</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                      <div className="text-2xl font-bold">{questions.length}</div>
                      <div className="text-sm text-muted-foreground">Questions</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <h4 className="font-medium text-foreground">Instructions:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Once started, the timer cannot be paused</li>
                      <li>Your test will be auto-submitted when time runs out</li>
                      <li>You can navigate between questions freely</li>
                      <li>Flag questions you want to review later</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBackToSelection} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleStartTest} className="flex-1 gap-2">
                      <PlayCircle className="h-5 w-5" />
                      Start Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* In Progress */}
          {testState === 'in-progress' && currentQuestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 lg:grid-cols-[1fr_280px]"
            >
              {/* Main Question Area */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge>{currentQuestion.max_marks} marks</Badge>
                        <Button
                          variant={flaggedQuestions.has(currentQuestion.id) ? "default" : "outline"}
                          size="sm"
                          onClick={handleToggleFlag}
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        {currentQuestion.question_text}
                      </p>
                    </div>

                    {currentQuestion.word_limit && (
                      <div className="text-sm text-muted-foreground">
                        Word limit: {currentQuestion.word_limit} words
                      </div>
                    )}

                    <Textarea
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Words: {wordCount}</span>
                      {currentQuestion.word_limit && (
                        <span className={wordCount > currentQuestion.word_limit ? 'text-destructive' : ''}>
                          {currentQuestion.word_limit - wordCount} words remaining
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button onClick={handleManualSubmit} className="gap-2">
                      <Send className="h-4 w-4" />
                      Submit Test
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Question Navigator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <QuestionNavigation
                      questions={questions}
                      currentIndex={currentQuestionIndex}
                      answeredQuestions={answeredQuestions}
                      flaggedQuestions={flaggedQuestions}
                      onQuestionSelect={setCurrentQuestionIndex}
                    />
                    <Separator />
                    <QuestionNavigationLegend />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Answered</span>
                      <span>{answeredQuestions.size}/{questions.length}</span>
                    </div>
                    <Progress value={(answeredQuestions.size / questions.length) * 100} />
                    <Button 
                      onClick={handleManualSubmit} 
                      className="w-full gap-2"
                      disabled={isSubmitting}
                    >
                      <Send className="h-4 w-4" />
                      Submit Test
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Submitted State */}
          {testState === 'submitted' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-12"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6" />
              <h2 className="text-2xl font-bold">Evaluating Your Answers</h2>
              <p className="text-muted-foreground mt-2">
                Please wait while we analyze your responses...
              </p>
            </motion.div>
          )}

          {/* Results */}
          {testState === 'results' && testResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <Card className="max-w-2xl mx-auto overflow-hidden">
                <div className={`p-6 text-center ${testResult.percentage >= 60 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <Trophy className={`h-16 w-16 mx-auto mb-4 ${testResult.percentage >= 60 ? 'text-success' : 'text-destructive'}`} />
                  <h2 className="text-4xl font-bold">{testResult.percentage}%</h2>
                  <p className="text-lg mt-2">
                    {testResult.totalScore} / {testResult.maxScore} marks
                  </p>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-success">{answeredQuestions.size}</div>
                      <div className="text-sm text-muted-foreground">Answered</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-destructive">
                        {questions.length - answeredQuestions.size}
                      </div>
                      <div className="text-sm text-muted-foreground">Skipped</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{questions.length}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question-wise Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Question-wise Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {testResult.questionResults.map((result, index) => (
                        <div key={result.questionId} className="p-4 rounded-lg border">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium">Question {index + 1}</span>
                            <Badge variant={result.score >= result.maxMarks * 0.6 ? "default" : "destructive"}>
                              {result.score}/{result.maxMarks}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {questions[index]?.question_text}
                          </p>
                          <Separator className="my-2" />
                          <p className="text-sm">{result.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleBackToSelection}>
                  Take Another Test
                </Button>
                <Button onClick={handleRetakeTest} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake This Test
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Confirmation Dialog */}
        <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Test?</AlertDialogTitle>
              <AlertDialogDescription>
                You have {questions.length - answeredQuestions.size} unanswered question(s). 
                Are you sure you want to submit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Test</AlertDialogCancel>
              <AlertDialogAction onClick={submitTest}>Submit Anyway</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
