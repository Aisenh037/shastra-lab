-- Drop the existing function first to change return type
DROP FUNCTION IF EXISTS public.get_user_streak(uuid);

-- Recreate get_user_streak with freeze info
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id uuid)
RETURNS TABLE(current_streak integer, longest_streak integer, last_practice_date date, practiced_today boolean, freeze_count integer, streak_at_risk boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ds.current_streak, 0),
    COALESCE(ds.longest_streak, 0),
    ds.last_practice_date,
    COALESCE(ds.last_practice_date = CURRENT_DATE, FALSE),
    COALESCE(ds.freeze_count, 0),
    COALESCE(ds.last_practice_date < v_yesterday AND ds.last_practice_date IS NOT NULL, FALSE)
  FROM daily_practice_streaks ds
  WHERE ds.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, FALSE, 0, FALSE;
  END IF;
END;
$$;