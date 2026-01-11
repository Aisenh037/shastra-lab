import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAchievements } from './useAchievements';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ 
        data: [
          { 
            id: '1', 
            achievement_type: 'streak_milestone', 
            title: '7-Day Streak',
            description: 'Maintained a 7-day practice streak',
            icon: '🔥',
            unlocked_at: '2024-01-10T10:00:00Z',
            progress: 100
          },
          { 
            id: '2', 
            achievement_type: 'submission_count', 
            title: 'First Steps',
            description: 'Submitted your first answer',
            icon: '🎯',
            unlocked_at: '2024-01-05T15:30:00Z',
            progress: 100
          }
        ], 
        error: null 
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('useAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.achievements).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.unlockedCount).toBe(0);
  });

  it('should load achievements on mount', async () => {
    const { result } = renderHook(() => useAchievements());

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('achievements');
    expect(result.current.loading).toBe(false);
  });

  it('should calculate unlocked achievements count', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.unlockedCount).toBe(2);
  });

  it('should filter achievements by type', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const streakAchievements = result.current.getAchievementsByType('streak_milestone');
    expect(streakAchievements).toHaveLength(1);
    expect(streakAchievements[0].title).toBe('7-Day Streak');

    const submissionAchievements = result.current.getAchievementsByType('submission_count');
    expect(submissionAchievements).toHaveLength(1);
    expect(submissionAchievements[0].title).toBe('First Steps');
  });

  it('should check if specific achievement is unlocked', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isUnlocked('streak_milestone')).toBe(true);
    expect(result.current.isUnlocked('submission_count')).toBe(true);
    expect(result.current.isUnlocked('nonexistent_type')).toBe(false);
  });

  it('should unlock new achievement', async () => {
    const { result } = renderHook(() => useAchievements());

    const newAchievement = {
      achievement_type: 'perfect_score',
      title: 'Perfect Score',
      description: 'Achieved 100% on an answer',
      icon: '⭐',
      progress: 100
    };

    await act(async () => {
      await result.current.unlockAchievement(newAchievement);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('achievements');
    expect(mockSupabase.from().insert).toHaveBeenCalled();
  });

  it('should update achievement progress', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await result.current.updateProgress('streak_milestone', 50);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('achievements');
    expect(mockSupabase.from().update).toHaveBeenCalled();
  });

  it('should get recent achievements', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const recentAchievements = result.current.getRecentAchievements(1);
    expect(recentAchievements).toHaveLength(1);
    expect(recentAchievements[0].title).toBe('7-Day Streak'); // Most recent
  });

  it('should calculate total progress', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const totalProgress = result.current.getTotalProgress();
    expect(totalProgress).toBe(200); // 100 + 100 from both achievements
  });

  it('should handle errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error('Database error') 
        }))
      })),
    });

    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should handle error gracefully
    expect(result.current.achievements).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should prevent duplicate achievements', async () => {
    const { result } = renderHook(() => useAchievements());

    // Try to unlock an achievement that already exists
    const duplicateAchievement = {
      achievement_type: 'streak_milestone',
      title: '7-Day Streak',
      description: 'Maintained a 7-day practice streak',
      icon: '🔥',
      progress: 100
    };

    await act(async () => {
      await result.current.unlockAchievement(duplicateAchievement);
    });

    // Should not insert duplicate
    expect(mockSupabase.from().insert).not.toHaveBeenCalled();
  });

  it('should sort achievements by unlock date', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const achievements = result.current.achievements;
    expect(achievements[0].unlocked_at).toBe('2024-01-10T10:00:00Z'); // Most recent first
    expect(achievements[1].unlocked_at).toBe('2024-01-05T15:30:00Z');
  });

  it('should provide achievement statistics', async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const stats = result.current.getStats();
    expect(stats.total).toBe(2);
    expect(stats.unlocked).toBe(2);
    expect(stats.completionRate).toBe(100);
  });
});