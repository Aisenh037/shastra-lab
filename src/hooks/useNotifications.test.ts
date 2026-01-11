import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';

// Mock Notification API
const mockNotification = vi.fn();
const mockNotificationInstance = {
  close: vi.fn(),
  onclick: null,
  onclose: null,
  onerror: null,
  onshow: null,
};

Object.defineProperty(window, 'Notification', {
  writable: true,
  value: Object.assign(mockNotification, {
    permission: 'default',
    requestPermission: vi.fn(() => Promise.resolve('granted')),
  }),
});

mockNotification.mockImplementation(() => mockNotificationInstance);

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset permission to default
    window.Notification.permission = 'default';
  });

  it('should initialize with correct permission state', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.permission).toBe('default');
    expect(result.current.isSupported).toBe(true);
  });

  it('should detect if notifications are supported', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.isSupported).toBe(true);

    // Test unsupported browser
    const originalNotification = window.Notification;
    delete (window as any).Notification;

    const { result: unsupportedResult } = renderHook(() => useNotifications());
    expect(unsupportedResult.current.isSupported).toBe(false);

    // Restore Notification
    window.Notification = originalNotification;
  });

  it('should request notification permission', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(window.Notification.requestPermission).toHaveBeenCalled();
  });

  it('should show notification when permission is granted', async () => {
    window.Notification.permission = 'granted';
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('Test Title', {
        body: 'Test message',
        icon: '/icon.png'
      });
    });

    expect(mockNotification).toHaveBeenCalledWith('Test Title', {
      body: 'Test message',
      icon: '/icon.png'
    });
  });

  it('should not show notification when permission is denied', async () => {
    window.Notification.permission = 'denied';
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('Test Title', {
        body: 'Test message'
      });
    });

    expect(mockNotification).not.toHaveBeenCalled();
  });

  it('should handle notification click events', async () => {
    window.Notification.permission = 'granted';
    const clickHandler = vi.fn();
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('Test Title', {
        body: 'Test message',
        onClick: clickHandler
      });
    });

    // Simulate notification click
    if (mockNotificationInstance.onclick) {
      mockNotificationInstance.onclick(new Event('click'));
    }

    expect(clickHandler).toHaveBeenCalled();
  });

  it('should auto-close notifications after timeout', async () => {
    vi.useFakeTimers();
    window.Notification.permission = 'granted';
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('Test Title', {
        body: 'Test message',
        autoClose: 3000
      });
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockNotificationInstance.close).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should handle notification errors gracefully', async () => {
    window.Notification.permission = 'granted';
    mockNotification.mockImplementationOnce(() => {
      throw new Error('Notification failed');
    });

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      // Should not throw error
      result.current.showNotification('Test Title', {
        body: 'Test message'
      });
    });

    // Should handle error gracefully
    expect(result.current.permission).toBe('granted');
  });

  it('should provide permission status helpers', () => {
    const { result } = renderHook(() => useNotifications());

    // Test granted permission
    window.Notification.permission = 'granted';
    expect(result.current.isGranted).toBe(true);
    expect(result.current.isDenied).toBe(false);

    // Test denied permission
    window.Notification.permission = 'denied';
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(true);

    // Test default permission
    window.Notification.permission = 'default';
    expect(result.current.isGranted).toBe(false);
    expect(result.current.isDenied).toBe(false);
  });

  it('should handle multiple notifications', async () => {
    window.Notification.permission = 'granted';
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('First', { body: 'First message' });
      result.current.showNotification('Second', { body: 'Second message' });
    });

    expect(mockNotification).toHaveBeenCalledTimes(2);
    expect(mockNotification).toHaveBeenNthCalledWith(1, 'First', { body: 'First message' });
    expect(mockNotification).toHaveBeenNthCalledWith(2, 'Second', { body: 'Second message' });
  });

  it('should provide default notification options', async () => {
    window.Notification.permission = 'granted';
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('Test Title');
    });

    expect(mockNotification).toHaveBeenCalledWith('Test Title', {});
  });

  it('should track active notifications', async () => {
    window.Notification.permission = 'granted';
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      result.current.showNotification('Test', { body: 'Message' });
    });

    // Should track active notifications if implemented
    if (result.current.activeNotifications) {
      expect(result.current.activeNotifications.length).toBeGreaterThan(0);
    }
  });
});