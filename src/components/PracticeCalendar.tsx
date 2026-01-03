import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, isToday, isSameDay, subWeeks, addWeeks } from 'date-fns';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface PracticeCalendarProps {
  className?: string;
}

export function PracticeCalendar({ className }: PracticeCalendarProps) {
  const { user } = useAuth();
  const [practiceDates, setPracticeDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    async function fetchPracticeDates() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all answer submissions to determine practice days
        const { data, error } = await supabase
          .from('answer_submissions')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Extract unique dates
        const dates = data?.map(row => new Date(row.created_at)) || [];
        setPracticeDates(dates);
      } catch (error) {
        console.error('Error fetching practice dates:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPracticeDates();
  }, [user]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const didPracticeOnDay = (day: Date) => {
    return practiceDates.some(practiceDate => 
      isSameDay(practiceDate, day)
    );
  };

  const practiceCountThisWeek = weekDays.filter(day => didPracticeOnDay(day)).length;

  const goToPreviousWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Practice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Practice
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={goToCurrentWeek}
              disabled={isCurrentWeek}
            >
              Today
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          {practiceCountThisWeek > 0 && (
            <span className="ml-2 text-primary font-medium">
              • {practiceCountThisWeek} day{practiceCountThisWeek !== 1 ? 's' : ''} practiced
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const practiced = didPracticeOnDay(day);
            const today = isToday(day);
            const isFuture = day > new Date();

            return (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-all",
                  practiced 
                    ? "bg-primary/10 border-2 border-primary" 
                    : "bg-muted/50 border-2 border-transparent",
                  today && !practiced && "border-primary/50",
                  isFuture && "opacity-50"
                )}
              >
                <span className={cn(
                  "text-xs font-medium mb-1",
                  practiced ? "text-primary" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  practiced ? "text-primary" : "text-foreground",
                  today && "underline decoration-2 underline-offset-2"
                )}>
                  {format(day, 'd')}
                </span>
                <div className="mt-1">
                  {practiced ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className={cn(
                      "h-5 w-5",
                      isFuture ? "text-muted-foreground/30" : "text-muted-foreground/50"
                    )} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
