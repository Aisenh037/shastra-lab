import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdownTimer } from './useCountdownTimer';

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct values', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 5 })
    );

    expect(result.current.timeRemaining).toBe(300); // 5 minutes = 300 seconds
    expect(result.current.minutes).toBe(5);
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isTimeUp).toBe(false);
    expect(result.current.percentRemaining).toBe(100);
    expect(result.current.formatTime()).toBe('05:00');
  });

  it('should auto-start when autoStart is true', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 1, autoStart: true })
    );

    expect(result.current.isRunning).toBe(true);
  });

  it('should start and pause correctly', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 2 })
    );

    // Initially not running
    expect(result.current.isRunning).toBe(false);

    // Start the timer
    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    // Pause the timer
    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('should countdown correctly', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 1 })
    );

    act(() => {
      result.current.start();
    });

    // Advance time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.timeRemaining).toBe(30);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(30);
    expect(result.current.formatTime()).toBe('00:30');
  });

  it('should call onTimeUp when timer reaches zero', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 1, onTimeUp })
    );

    act(() => {
      result.current.start();
    });

    // Advance time by 60 seconds (1 minute)
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isTimeUp).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('should reset correctly', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 2 })
    );

    // Start and run for some time
    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(30000); // 30 seconds
    });

    expect(result.current.timeRemaining).toBe(90); // 2 minutes - 30 seconds

    // Reset to original time
    act(() => {
      result.current.reset();
    });

    expect(result.current.timeRemaining).toBe(120); // Back to 2 minutes
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isTimeUp).toBe(false);
  });

  it('should reset with new time', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 2 })
    );

    // Reset with new time (3 minutes)
    act(() => {
      result.current.reset(3);
    });

    expect(result.current.timeRemaining).toBe(180); // 3 minutes
    expect(result.current.minutes).toBe(3);
    expect(result.current.seconds).toBe(0);
  });

  it('should calculate percent remaining correctly', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 2 })
    );

    act(() => {
      result.current.start();
    });

    // Advance by 60 seconds (half the time)
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.percentRemaining).toBe(50);
  });

  it('should format time correctly for different values', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 1 })
    );

    // Test various time formats
    act(() => {
      result.current.reset(10); // 10 minutes
    });
    expect(result.current.formatTime()).toBe('10:00');

    act(() => {
      result.current.reset(1.5); // 1.5 minutes = 90 seconds
    });
    expect(result.current.formatTime()).toBe('01:30');

    act(() => {
      result.current.reset(0.1); // 0.1 minutes = 6 seconds
    });
    expect(result.current.formatTime()).toBe('00:06');
  });

  it('should not start if time remaining is zero', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 1 })
    );

    // Run timer to completion
    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isRunning).toBe(false);

    // Try to start again - should not start
    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('should handle rapid start/pause operations', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialMinutes: 1 })
    );

    // Rapid start/pause
    act(() => {
      result.current.start();
      result.current.pause();
      result.current.start();
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeRemaining).toBe(60);
  });

  it('should update onTimeUp callback when it changes', () => {
    let callbackCount = 0;
    const initialCallback = () => { callbackCount += 1; };
    const newCallback = () => { callbackCount += 10; };

    const { result, rerender } = renderHook(
      ({ onTimeUp }) => useCountdownTimer({ initialMinutes: 1, onTimeUp }),
      { initialProps: { onTimeUp: initialCallback } }
    );

    // Change the callback
    rerender({ onTimeUp: newCallback });

    act(() => {
      result.current.start();
    });

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Should use the new callback
    expect(callbackCount).toBe(10);
  });
});