
-- Add freeze_count column to daily_practice_streaks table
ALTER TABLE public.daily_practice_streaks
ADD COLUMN IF NOT EXISTS freeze_count INTEGER NOT NULL DEFAULT 0;
