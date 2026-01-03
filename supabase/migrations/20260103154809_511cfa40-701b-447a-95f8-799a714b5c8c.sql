-- Create function to recover a lost streak using multiple freezes
CREATE OR REPLACE FUNCTION public.recover_streak(p_user_id uuid, p_days_to_recover integer DEFAULT 1)
RETURNS TABLE(success boolean, new_streak integer, freezes_used integer, freezes_remaining integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_freeze_count INTEGER;
  v_last_practice DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_days_missed INTEGER;
  v_freezes_needed INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get current streak data
  SELECT ds.freeze_count, ds.last_practice_date, ds.current_streak, ds.longest_streak
  INTO v_freeze_count, v_last_practice, v_current_streak, v_longest_streak
  FROM daily_practice_streaks ds
  WHERE ds.user_id = p_user_id;

  -- Check if user has streak record
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 'No streak history found'::text;
    RETURN;
  END IF;

  -- Check if streak is actually lost (more than 1 day gap)
  v_days_missed := v_today - v_last_practice - 1;
  
  IF v_days_missed <= 0 THEN
    RETURN QUERY SELECT FALSE, v_current_streak, 0, v_freeze_count, 'Streak is not lost - no recovery needed'::text;
    RETURN;
  END IF;

  -- Limit recovery to requested days or actual days missed
  v_freezes_needed := LEAST(p_days_to_recover, v_days_missed);
  
  -- Each day of recovery costs 2 freezes
  v_freezes_needed := v_freezes_needed * 2;

  -- Check if user has enough freezes
  IF v_freeze_count < v_freezes_needed THEN
    RETURN QUERY SELECT FALSE, 0, 0, v_freeze_count, 
      format('Not enough freezes. Need %s freezes to recover %s day(s), but only have %s', 
        v_freezes_needed, LEAST(p_days_to_recover, v_days_missed), v_freeze_count)::text;
    RETURN;
  END IF;

  -- Perform recovery: restore streak and deduct freezes
  UPDATE daily_practice_streaks
  SET 
    freeze_count = freeze_count - v_freezes_needed,
    current_streak = v_current_streak,
    last_practice_date = v_today - INTERVAL '1 day',
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT 
    TRUE, 
    v_current_streak, 
    v_freezes_needed, 
    v_freeze_count - v_freezes_needed,
    format('Successfully recovered streak! Used %s freezes.', v_freezes_needed)::text;
END;
$$;