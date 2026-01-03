import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Achievement {
  achievement_key: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_achievements', {
        p_user_id: user.id,
      });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkAndUpdateAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_achievements', {
        p_user_id: user.id,
      });

      if (error) throw error;
      
      // Refresh achievements after check
      await fetchAchievements();
      
      return data;
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [user, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockedKeys = achievements.map(a => a.achievement_key);

  return {
    achievements,
    unlockedKeys,
    isLoading,
    refresh: fetchAchievements,
    checkAndUpdate: checkAndUpdateAchievements,
  };
}
