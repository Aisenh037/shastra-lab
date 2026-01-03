-- Create a function to get leaderboard data safely
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  total_score numeric,
  total_max_score integer,
  percentage numeric,
  tests_completed integer,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as user_id,
    COALESCE(p.full_name, split_part(p.email, '@', 1)) as display_name,
    COALESCE(SUM(a.score), 0) as total_score,
    COALESCE(SUM(a.max_score), 0)::integer as total_max_score,
    CASE 
      WHEN COALESCE(SUM(a.max_score), 0) > 0 
      THEN ROUND((COALESCE(SUM(a.score), 0) / SUM(a.max_score)) * 100, 1)
      ELSE 0 
    END as percentage,
    COUNT(DISTINCT a.id)::integer as tests_completed,
    RANK() OVER (
      ORDER BY 
        CASE 
          WHEN COALESCE(SUM(a.max_score), 0) > 0 
          THEN (COALESCE(SUM(a.score), 0) / SUM(a.max_score))
          ELSE 0 
        END DESC
    ) as rank
  FROM profiles p
  LEFT JOIN answer_submissions a ON a.user_id = p.id AND a.status = 'evaluated'
  GROUP BY p.id, p.full_name, p.email
  HAVING COUNT(a.id) > 0
  ORDER BY percentage DESC
  LIMIT 100;
$$;

-- Create a function to get user's rank
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id uuid)
RETURNS TABLE (
  rank bigint,
  total_users bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_scores AS (
    SELECT 
      user_id,
      CASE 
        WHEN SUM(max_score) > 0 
        THEN (SUM(score) / SUM(max_score))
        ELSE 0 
      END as percentage
    FROM answer_submissions
    WHERE status = 'evaluated'
    GROUP BY user_id
  ),
  ranked AS (
    SELECT 
      user_id,
      RANK() OVER (ORDER BY percentage DESC) as rank
    FROM user_scores
  )
  SELECT 
    COALESCE((SELECT rank FROM ranked WHERE user_id = p_user_id), 0) as rank,
    (SELECT COUNT(DISTINCT user_id) FROM user_scores) as total_users;
$$;