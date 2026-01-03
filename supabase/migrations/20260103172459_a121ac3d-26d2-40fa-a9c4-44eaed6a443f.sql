
-- First, let's make the user_id column nullable for template records
-- This allows system templates without requiring a real user

-- For syllabi - drop the NOT NULL constraint for templates
ALTER TABLE public.syllabi 
ALTER COLUMN user_id DROP NOT NULL;

-- For mock_tests - drop the NOT NULL constraint for templates  
ALTER TABLE public.mock_tests
ALTER COLUMN user_id DROP NOT NULL;

-- For practice_questions - drop the NOT NULL constraint for template questions
ALTER TABLE public.practice_questions
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow viewing templates with null user_id
DROP POLICY IF EXISTS "Users can view own syllabi" ON public.syllabi;
CREATE POLICY "Users can view own syllabi and templates" 
ON public.syllabi 
FOR SELECT 
USING ((auth.uid() = user_id) OR (is_template = true));

DROP POLICY IF EXISTS "Users can view own mock tests and templates" ON public.mock_tests;
CREATE POLICY "Users can view own mock tests and templates" 
ON public.mock_tests 
FOR SELECT 
USING ((auth.uid() = user_id) OR (is_template = true));

DROP POLICY IF EXISTS "Users can view questions for accessible mock tests" ON public.practice_questions;
CREATE POLICY "Users can view questions for accessible mock tests" 
ON public.practice_questions 
FOR SELECT 
USING ((auth.uid() = user_id) OR (mock_test_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM mock_tests 
  WHERE mock_tests.id = practice_questions.mock_test_id 
  AND mock_tests.is_template = true
)) OR (mock_test_id IS NULL AND user_id IS NULL));
