import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format
  lastNotified: string | null; // ISO date string
}

const STORAGE_KEY = 'practice-reminder-settings';
const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  time: '09:00',
  lastNotified: null,
};

export function useReminders() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const { permission, isSupported, requestPermission, sendNotification } = useNotifications();

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse reminder settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: ReminderSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  // Enable reminders
  const enableReminders = useCallback(async (time: string) => {
    if (!isSupported) return false;

    const granted = permission === 'granted' || await requestPermission();
    if (granted) {
      saveSettings({ enabled: true, time, lastNotified: settings.lastNotified });
      return true;
    }
    return false;
  }, [isSupported, permission, requestPermission, saveSettings, settings.lastNotified]);

  // Disable reminders
  const disableReminders = useCallback(() => {
    saveSettings({ ...settings, enabled: false });
  }, [saveSettings, settings]);

  // Update reminder time
  const updateReminderTime = useCallback((time: string) => {
    saveSettings({ ...settings, time });
  }, [saveSettings, settings]);

  // Check and send reminder if needed
  const checkAndNotify = useCallback((practicedToday: boolean) => {
    if (!settings.enabled || practicedToday) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Don't notify if already notified today
    if (settings.lastNotified === today) return;

    const [hours, minutes] = settings.time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // Only notify if current time is past reminder time
    if (now >= reminderTime) {
      const notification = sendNotification('📝 Time to Practice!', {
        body: "Don't break your streak! Take a few minutes to practice today.",
        tag: 'practice-reminder',
        requireInteraction: true,
      });

      if (notification) {
        saveSettings({ ...settings, lastNotified: today });
      }
    }
  }, [settings, sendNotification, saveSettings]);

  // Set up periodic check for reminders
  useEffect(() => {
    if (!settings.enabled) return;

    // Check immediately
    const checkReminder = () => {
      const practicedToday = false; // Will be passed from component
      checkAndNotify(practicedToday);
    };

    // Check every minute
    const interval = setInterval(checkReminder, 60000);
    
    return () => clearInterval(interval);
  }, [settings.enabled, checkAndNotify]);

  return {
    settings,
    isSupported,
    permission,
    enableReminders,
    disableReminders,
    updateReminderTime,
    checkAndNotify,
  };
}
