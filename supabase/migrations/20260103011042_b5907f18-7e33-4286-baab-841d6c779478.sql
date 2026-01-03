-- Create mock tests table for UPSC practice
CREATE TABLE public.mock_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL DEFAULT 'UPSC Mains',
  subject TEXT,
  time_limit_minutes INTEGER,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create practice questions table (for written answers)
CREATE TABLE public.practice_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'essay', -- essay, short_answer, case_study
  max_marks INTEGER NOT NULL DEFAULT 10,
  word_limit INTEGER,
  model_answer TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  topic TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answer submissions table
CREATE TABLE public.answer_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_image_url TEXT,
  submission_type TEXT NOT NULL DEFAULT 'typed', -- typed, handwritten
  status TEXT NOT NULL DEFAULT 'pending', -- pending, evaluating, evaluated
  score DECIMAL(5,2),
  max_score INTEGER,
  overall_feedback TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  paragraph_analysis JSONB DEFAULT '[]'::jsonb,
  format_suggestions TEXT,
  model_comparison TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  evaluated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_submissions ENABLE ROW LEVEL SECURITY;

-- Mock tests policies
CREATE POLICY "Users can view own mock tests and templates" ON public.mock_tests
  FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can create own mock tests" ON public.mock_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mock tests" ON public.mock_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mock tests" ON public.mock_tests
  FOR DELETE USING (auth.uid() = user_id);

-- Practice questions policies
CREATE POLICY "Users can view questions for accessible mock tests" ON public.practice_questions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.mock_tests WHERE id = mock_test_id AND (user_id = auth.uid() OR is_template = true))
  );

CREATE POLICY "Users can create own questions" ON public.practice_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON public.practice_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions" ON public.practice_questions
  FOR DELETE USING (auth.uid() = user_id);

-- Answer submissions policies
CREATE POLICY "Users can view own submissions" ON public.answer_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions" ON public.answer_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.answer_submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions" ON public.answer_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_mock_tests_updated_at
  BEFORE UPDATE ON public.mock_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practice_questions_updated_at
  BEFORE UPDATE ON public.practice_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for handwritten answer uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('answer-uploads', 'answer-uploads', true);

-- Storage policies for answer uploads
CREATE POLICY "Users can upload own answers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'answer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'answer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'answer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);