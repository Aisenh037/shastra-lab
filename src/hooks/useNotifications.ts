import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
  });

  useEffect(() => {
    const isSupported = 'Notification' in window;
    setState({
      permission: isSupported ? Notification.permission : 'denied',
      isSupported,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!state.isSupported || state.permission !== 'granted') {
        console.log('Notifications not available or not permitted');
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return notification;
      } catch (error) {
        console.error('Failed to send notification:', error);
        return null;
      }
    },
    [state.isSupported, state.permission]
  );

  const notifyEvaluationComplete = useCallback(
    (score: number, maxScore: number) => {
      const percentage = Math.round((score / maxScore) * 100);
      const emoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '👍' : '📚';
      
      return sendNotification(`${emoji} Evaluation Complete!`, {
        body: `You scored ${score}/${maxScore} (${percentage}%). Click to view detailed feedback.`,
        tag: 'evaluation-complete',
        requireInteraction: true,
      });
    },
    [sendNotification]
  );

  return {
    ...state,
    requestPermission,
    sendNotification,
    notifyEvaluationComplete,
  };
}
