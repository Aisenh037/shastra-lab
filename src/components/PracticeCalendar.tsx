import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfWeek, 
  startOfMonth,
  endOfMonth,
  addDays, 
  isToday, 
  isSameDay, 
  isSameMonth,
  subWeeks, 
  addWeeks,
  subMonths,
  addMonths,
  eachDayOfInterval,
  getDay
} from 'date-fns';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Calendar, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PracticeCalendarProps {
  className?: string;
}

export function PracticeCalendar({ className }: PracticeCalendarProps) {
  const { user } = useAuth();
  const [practiceDates, setPracticeDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  useEffect(() => {
    async function fetchPracticeDates() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('answer_submissions')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

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

  const getPracticeCountOnDay = (day: Date) => {
    return practiceDates.filter(practiceDate => isSameDay(practiceDate, day)).length;
  };

  const didPracticeOnDay = (day: Date) => getPracticeCountOnDay(day) > 0;

  const practiceCountThisWeek = weekDays.filter(day => didPracticeOnDay(day)).length;

  // Week navigation
  const goToPreviousWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Month navigation
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToCurrentMonth = () => setCurrentMonth(new Date());
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  // Get all days in the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate calendar grid (6 weeks max)
  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Adjust for Monday start
  const totalDays = adjustedStartDay + daysInMonth.length;
  const weeksNeeded = Math.ceil(totalDays / 7);
  const calendarDays = Array.from({ length: weeksNeeded * 7 }, (_, i) => addDays(calendarStart, i));

  // Calculate practice stats for month
  const practiceCountThisMonth = daysInMonth.filter(day => didPracticeOnDay(day)).length;

  // Get heatmap intensity (0-4 scale)
  const getHeatmapIntensity = (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-muted/50';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/40';
      case 3: return 'bg-primary/60';
      case 4: return 'bg-primary/80';
      default: return 'bg-muted/50';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Practice Calendar
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
            Practice Calendar
          </CardTitle>
          <Tabs value={view} onValueChange={(v) => setView(v as 'week' | 'month')}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {view === 'week' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                {practiceCountThisWeek > 0 && (
                  <span className="ml-2 text-primary font-medium">
                    • {practiceCountThisWeek} day{practiceCountThisWeek !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {format(currentMonth, 'MMMM yyyy')}
                {practiceCountThisMonth > 0 && (
                  <span className="ml-2 text-primary font-medium">
                    • {practiceCountThisMonth} day{practiceCountThisMonth !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={goToCurrentMonth}
                  disabled={isCurrentMonth}
                >
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid with heatmap */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const isFuture = day > new Date();
                const practiceCount = getPracticeCountOnDay(day);
                const intensity = getHeatmapIntensity(practiceCount);

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-md text-sm transition-all cursor-default",
                          inMonth ? getHeatmapColor(intensity) : "bg-transparent",
                          !inMonth && "text-muted-foreground/30",
                          today && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          isFuture && inMonth && "opacity-50",
                          practiceCount > 0 && "font-semibold"
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    </TooltipTrigger>
                    {inMonth && !isFuture && (
                      <TooltipContent>
                        <p className="font-medium">{format(day, 'EEEE, MMM d')}</p>
                        <p className="text-xs text-muted-foreground">
                          {practiceCount === 0 
                            ? 'No practice' 
                            : `${practiceCount} submission${practiceCount !== 1 ? 's' : ''}`}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>

            {/* Heatmap legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={cn("w-3 h-3 rounded-sm", getHeatmapColor(level))}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
