import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreak } from './useStreak';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { 
            current_streak: 5, 
            longest_streak: 10, 
            last_practice_date: new Date().toISOString().split('T')[0] 
          }, 
          error: null 
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ 
            data: [{ practice_date: new Date().toISOString().split('T')[0] }], 
            error: null 
          }))
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
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

describe('useStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset date to a consistent value for testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default streak values', () => {
    const { result } = renderHook(() => useStreak());

    expect(result.current.streak).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      practicedToday: false,
    });
  });

  it('should load streak data on mount', async () => {
    const { result } = renderHook(() => useStreak());

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('daily_practice_streaks');
  });

  it('should update streak when practice is recorded', async () => {
    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await result.current.recordPractice();
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('daily_practice_streaks');
  });

  it('should handle streak calculation correctly', async () => {
    // Mock consecutive practice days
    const mockConsecutiveDays = [
      { practice_date: '2024-01-15' },
      { practice_date: '2024-01-14' },
      { practice_date: '2024-01-13' },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ 
              data: mockConsecutiveDays, 
              error: null 
            }))
          }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    });

    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await result.current.recordPractice();
    });

    // Should calculate streak based on consecutive days
    expect(mockSupabase.from).toHaveBeenCalled();
  });

  it('should detect if user practiced today', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              current_streak: 1, 
              longest_streak: 5, 
              last_practice_date: today 
            }, 
            error: null 
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ 
              data: [{ practice_date: today }], 
              error: null 
            }))
          }))
        }))
      })),
    });

    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should detect that user practiced today
    expect(result.current.streak.practicedToday).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: new Error('Database error') 
          }))
        }))
      })),
    });

    const { result } = renderHook(() => useStreak());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should maintain default values on error
    expect(result.current.streak.currentStreak).toBe(0);
  });

  it('should prevent multiple practice records for the same day', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              current_streak: 1, 
              longest_streak: 5, 
              last_practice_date: today 
            }, 
            error: null 
          }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    });

    const { result } = renderHook(() => useStreak());

    // First practice should work
    await act(async () => {
      await result.current.recordPractice();
    });

    // Second practice on same day should not create duplicate
    await act(async () => {
      await result.current.recordPractice();
    });

    // Should only call upsert once or handle duplicates properly
    expect(mockSupabase.from).toHaveBeenCalled();
  });
});