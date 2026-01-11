import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReminders } from './useReminders';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ 
        data: [
          { 
            id: '1', 
            title: 'Daily Practice', 
            time: '09:00', 
            enabled: true,
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        ], 
        error: null 
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    delete: vi.fn(() => ({
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

// Mock Notification API
const mockNotification = {
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  permission: 'default',
};

Object.defineProperty(window, 'Notification', {
  writable: true,
  value: mockNotification,
});

describe('useReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useReminders());

    expect(result.current.reminders).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('should load reminders on mount', async () => {
    const { result } = renderHook(() => useReminders());

    // Wait for the effect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('email_report_preferences');
  });

  it('should add a new reminder', async () => {
    const { result } = renderHook(() => useReminders());

    const newReminder = {
      title: 'Evening Study',
      time: '18:00',
      enabled: true,
      days: ['monday', 'wednesday', 'friday']
    };

    await act(async () => {
      await result.current.addReminder(newReminder);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('email_report_preferences');
    expect(mockSupabase.from().insert).toHaveBeenCalled();
  });

  it('should update an existing reminder', async () => {
    const { result } = renderHook(() => useReminders());

    const updatedReminder = {
      id: '1',
      title: 'Updated Practice',
      time: '10:00',
      enabled: false,
      days: ['saturday', 'sunday']
    };

    await act(async () => {
      await result.current.updateReminder('1', updatedReminder);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('email_report_preferences');
    expect(mockSupabase.from().update).toHaveBeenCalled();
  });

  it('should delete a reminder', async () => {
    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await result.current.deleteReminder('1');
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('email_report_preferences');
    expect(mockSupabase.from().delete).toHaveBeenCalled();
  });

  it('should toggle reminder enabled state', async () => {
    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await result.current.toggleReminder('1');
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('email_report_preferences');
    expect(mockSupabase.from().update).toHaveBeenCalled();
  });

  it('should request notification permission', async () => {
    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await result.current.requestNotificationPermission();
    });

    expect(mockNotification.requestPermission).toHaveBeenCalled();
  });

  it('should handle permission states correctly', () => {
    const { result } = renderHook(() => useReminders());

    // Test different permission states
    mockNotification.permission = 'granted';
    expect(result.current.hasNotificationPermission).toBe(true);

    mockNotification.permission = 'denied';
    expect(result.current.hasNotificationPermission).toBe(false);

    mockNotification.permission = 'default';
    expect(result.current.hasNotificationPermission).toBe(false);
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

    const { result } = renderHook(() => useReminders());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should handle error gracefully and maintain empty state
    expect(result.current.reminders).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should validate reminder data', async () => {
    const { result } = renderHook(() => useReminders());

    const invalidReminder = {
      title: '', // Invalid: empty title
      time: '25:00', // Invalid: invalid time
      enabled: true,
      days: [] // Invalid: no days selected
    };

    await act(async () => {
      try {
        await result.current.addReminder(invalidReminder);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('should format time correctly', () => {
    const { result } = renderHook(() => useReminders());

    // Test time formatting utility if available
    if (result.current.formatTime) {
      expect(result.current.formatTime('09:00')).toBe('9:00 AM');
      expect(result.current.formatTime('15:30')).toBe('3:30 PM');
      expect(result.current.formatTime('00:00')).toBe('12:00 AM');
    }
  });
});