-- Create table to track daily practice streaks
CREATE TABLE public.daily_practice_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.daily_practice_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own streaks" 
ON public.daily_practice_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" 
ON public.daily_practice_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" 
ON public.daily_practice_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_daily_practice_streaks_updated_at
BEFORE UPDATE ON public.daily_practice_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update streak when user practices
CREATE OR REPLACE FUNCTION public.update_practice_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, streak_extended BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_practice DATE;
  v_today DATE := CURRENT_DATE;
  v_streak_extended BOOLEAN := FALSE;
BEGIN
  -- Get or create streak record
  SELECT ds.current_streak, ds.longest_streak, ds.last_practice_date
  INTO v_current_streak, v_longest_streak, v_last_practice
  FROM daily_practice_streaks ds
  WHERE ds.user_id = p_user_id;

  IF NOT FOUND THEN
    -- First time practicing
    INSERT INTO daily_practice_streaks (user_id, current_streak, longest_streak, last_practice_date)
    VALUES (p_user_id, 1, 1, v_today);
    
    RETURN QUERY SELECT 1, 1, TRUE;
    RETURN;
  END IF;

  -- Check if already practiced today
  IF v_last_practice = v_today THEN
    RETURN QUERY SELECT v_current_streak, v_longest_streak, FALSE;
    RETURN;
  END IF;

  -- Check if practiced yesterday (continue streak)
  IF v_last_practice = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    v_streak_extended := TRUE;
    IF v_current_streak > v_longest_streak THEN
      v_longest_streak := v_current_streak;
    END IF;
  ELSE
    -- Streak broken, start fresh
    v_current_streak := 1;
    v_streak_extended := TRUE;
  END IF;

  -- Update the record
  UPDATE daily_practice_streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_practice_date = v_today
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_streak_extended;
END;
$$;

-- Function to get user's streak info
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, last_practice_date DATE, practiced_today BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ds.current_streak, 0),
    COALESCE(ds.longest_streak, 0),
    ds.last_practice_date,
    COALESCE(ds.last_practice_date = CURRENT_DATE, FALSE)
  FROM daily_practice_streaks ds
  WHERE ds.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, FALSE;
  END IF;
END;
$$;

-- Add streak-based achievements to check_achievements function
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
RETURNS TABLE(achievement_key text, newly_unlocked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tests_completed integer;
  v_high_scores integer;
  v_user_rank bigint;
  v_current_streak integer;
  v_longest_streak integer;
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

  -- Get streak info
  SELECT ds.current_streak, ds.longest_streak
  INTO v_current_streak, v_longest_streak
  FROM daily_practice_streaks ds
  WHERE ds.user_id = p_user_id;

  v_current_streak := COALESCE(v_current_streak, 0);
  v_longest_streak := COALESCE(v_longest_streak, 0);

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

  -- Streak achievements
  -- Week Warrior (7 day streak)
  IF v_longest_streak >= 7 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'week_warrior')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Fortnight Fighter (14 day streak)
  IF v_longest_streak >= 14 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'fortnight_fighter')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Monthly Master (30 day streak)
  IF v_longest_streak >= 30 THEN
    INSERT INTO achievements (user_id, achievement_key)
    VALUES (p_user_id, 'monthly_master')
    ON CONFLICT (user_id, achievement_key) DO NOTHING;
  END IF;

  -- Return all user achievements
  RETURN QUERY
  SELECT a.achievement_key, false as newly_unlocked
  FROM achievements a
  WHERE a.user_id = p_user_id;
END;
$$;