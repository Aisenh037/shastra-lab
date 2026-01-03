import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  practicedToday: boolean;
}

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    practicedToday: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreak({
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: null,
        practicedToday: false,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const row = data[0];
        setStreak({
          currentStreak: row.current_streak ?? 0,
          longestStreak: row.longest_streak ?? 0,
          lastPracticeDate: row.last_practice_date,
          practicedToday: row.practiced_today ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const recordPractice = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('update_practice_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const row = data[0];
        setStreak(prev => ({
          ...prev,
          currentStreak: row.current_streak ?? 0,
          longestStreak: row.longest_streak ?? 0,
          practicedToday: true,
        }));
        
        return {
          currentStreak: row.current_streak,
          longestStreak: row.longest_streak,
          streakExtended: row.streak_extended,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error recording practice:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    isLoading,
    refresh: fetchStreak,
    recordPractice,
  };
}
