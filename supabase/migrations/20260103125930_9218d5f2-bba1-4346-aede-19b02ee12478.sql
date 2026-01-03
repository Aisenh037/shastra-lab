-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Users can view all achievements (for leaderboard display)
CREATE POLICY "Users can view all achievements"
ON public.achievements
FOR SELECT
USING (true);

-- Only system can insert achievements (via function)
CREATE POLICY "System can insert achievements"
ON public.achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
RETURNS TABLE (
  achievement_key text,
  newly_unlocked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tests_completed integer;
  v_high_scores integer;
  v_user_rank bigint;
  v_achievement text;
  v_newly_unlocked boolean;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(DISTINCT id),
    COUNT(DISTINCT CASE WHEN max_score > 0 AND (score::numeric / max_score) >= 0.9 THEN id END)
  INTO v_tests_completed, v_high_scores
  FROM answer_submissions
  WHERE user_id = p_user_id AND status = 'evaluated';

  -- Get user rank
  SELECT rank INTO v_user_rank
  FROM (
    SELECT 
      a.user_id,
      RANK() OVER (ORDER BY SUM(a.score) / NULLIF(SUM(a.max_score), 0) DESC) as rank
    FROM answer_submissions a
    WHERE a.status = 'evaluated'
    GROUP BY a.user_id
  ) ranked
  WHERE ranked.user_id = p_user_id;

  -- Check each achievement
  -- First Test
  IF v_tests_completed >= 1 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'first_test')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Test Veteran (10 tests)
  IF v_tests_completed >= 10 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'test_veteran')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Test Master (25 tests)
  IF v_tests_completed >= 25 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'test_master')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- High Scorer (90%+ on any test)
  IF v_high_scores >= 1 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'high_scorer')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Consistent Excellence (90%+ on 5 tests)
  IF v_high_scores >= 5 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'consistent_excellence')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Perfectionist (90%+ on 10 tests)
  IF v_high_scores >= 10 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'perfectionist')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Top 10
  IF v_user_rank IS NOT NULL AND v_user_rank <= 10 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'top_10')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Top 3
  IF v_user_rank IS NOT NULL AND v_user_rank <= 3 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'top_3')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Champion (#1)
  IF v_user_rank IS NOT NULL AND v_user_rank = 1 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'champion')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Return all user achievements
  RETURN QUERY
  SELECT a.achievement_key, false as newly_unlocked
  FROM achievements a
  WHERE a.user_id = p_user_id;
END;
$$;

-- Function to get user achievements
CREATE OR REPLACE FUNCTION public.get_user_achievements(p_user_id uuid)
RETURNS TABLE (
  achievement_key text,
  unlocked_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT achievement_key, unlocked_at
  FROM achievements
  WHERE user_id = p_user_id
  ORDER BY unlocked_at DESC;
$$;