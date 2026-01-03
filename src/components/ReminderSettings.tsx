import { useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useReminders } from '@/hooks/useReminders';
import { useToast } from '@/hooks/use-toast';

export function ReminderSettings() {
  const { settings, isSupported, permission, enableReminders, disableReminders, updateReminderTime } = useReminders();
  const [time, setTime] = useState(settings.time);
  const { toast } = useToast();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enableReminders(time);
      if (success) {
        toast({
          title: 'Reminders enabled',
          description: `You'll be reminded to practice at ${time} daily.`,
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please allow notifications to enable reminders.',
          variant: 'destructive',
        });
      }
    } else {
      disableReminders();
      toast({
        title: 'Reminders disabled',
        description: 'You will no longer receive practice reminders.',
      });
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (settings.enabled) {
      updateReminderTime(newTime);
      toast({
        title: 'Reminder time updated',
        description: `You'll be reminded at ${newTime} daily.`,
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellOff className="h-4 w-4 text-muted-foreground" />
            Reminders Not Available
          </CardTitle>
          <CardDescription>
            Your browser doesn't support notifications.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Practice Reminders
        </CardTitle>
        <CardDescription>
          Get daily reminders to maintain your streak.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="reminder-toggle" className="flex items-center gap-2 cursor-pointer">
            {settings.enabled ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Daily Reminders</span>
          </Label>
          <Switch
            id="reminder-toggle"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="reminder-time" className="sr-only">Reminder Time</Label>
          <Input
            id="reminder-time"
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-32"
            disabled={!settings.enabled}
          />
          <span className="text-sm text-muted-foreground">
            {settings.enabled ? 'Reminder time' : 'Enable to set time'}
          </span>
        </div>

        {permission === 'denied' && (
          <p className="text-sm text-destructive">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        )}

        {settings.enabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                const notification = new Notification('🔔 Test Reminder', {
                  body: 'This is how your daily reminder will look!',
                  icon: '/favicon.ico',
                });
                setTimeout(() => notification.close(), 5000);
              } catch (e) {
                console.error('Failed to send test notification:', e);
              }
            }}
            className="w-full"
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
