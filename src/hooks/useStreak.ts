import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  practicedToday: boolean;
  freezeCount: number;
  streakAtRisk: boolean;
}

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    practicedToday: false,
    freezeCount: 0,
    streakAtRisk: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreak({
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: null,
        practicedToday: false,
        freezeCount: 0,
        streakAtRisk: false,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_streak' as any, {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        const row = data[0] as any;
        setStreak({
          currentStreak: row.current_streak ?? 0,
          longestStreak: row.longest_streak ?? 0,
          lastPracticeDate: row.last_practice_date,
          practicedToday: row.practiced_today ?? false,
          freezeCount: row.freeze_count ?? 0,
          streakAtRisk: row.streak_at_risk ?? false,
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

  const useFreeze = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('use_streak_freeze' as any, {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        const row = data[0] as any;
        if (row.success) {
          setStreak(prev => ({
            ...prev,
            freezeCount: row.freezes_remaining ?? 0,
            streakAtRisk: false,
          }));
        }
        return {
          success: row.success,
          freezesRemaining: row.freezes_remaining,
          message: row.message,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error using freeze:', error);
      return null;
    }
  }, [user]);

  const addFreezes = useCallback(async (count: number = 1) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('add_streak_freezes' as any, {
        p_user_id: user.id,
        p_count: count,
      });

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        const row = data[0] as any;
        setStreak(prev => ({
          ...prev,
          freezeCount: row.new_freeze_count ?? prev.freezeCount + count,
        }));
        return row.new_freeze_count;
      }
      
      return null;
    } catch (error) {
      console.error('Error adding freezes:', error);
      return null;
    }
  }, [user]);

  const recoverStreak = useCallback(async (daysToRecover: number = 1) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('recover_streak' as any, {
        p_user_id: user.id,
        p_days_to_recover: daysToRecover,
      });

      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
        const row = data[0] as any;
        if (row.success) {
          setStreak(prev => ({
            ...prev,
            currentStreak: row.new_streak ?? prev.currentStreak,
            freezeCount: row.freezes_remaining ?? 0,
            streakAtRisk: false,
          }));
        }
        return {
          success: row.success,
          newStreak: row.new_streak,
          freezesUsed: row.freezes_used,
          freezesRemaining: row.freezes_remaining,
          message: row.message,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error recovering streak:', error);
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
    useFreeze,
    addFreezes,
    recoverStreak,
  };
}
