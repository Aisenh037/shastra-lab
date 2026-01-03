import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  variant?: 'card' | 'compact' | 'inline';
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  practicedToday,
  variant = 'card',
}: StreakDisplayProps) {
  const streakColor = currentStreak >= 7 
    ? 'text-orange-500' 
    : currentStreak >= 3 
    ? 'text-amber-500' 
    : 'text-muted-foreground';

  const streakBgColor = currentStreak >= 7 
    ? 'bg-orange-500/10' 
    : currentStreak >= 3 
    ? 'bg-amber-500/10' 
    : 'bg-muted/50';

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          animate={currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            streakBgColor
          )}
        >
          <Flame className={cn("h-4 w-4", streakColor)} />
          <span className={cn("font-bold text-sm", streakColor)}>
            {currentStreak}
          </span>
        </motion.div>
        {practicedToday && (
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        streakBgColor,
        currentStreak >= 7 ? 'border-orange-500/30' : currentStreak >= 3 ? 'border-amber-500/30' : 'border-border'
      )}>
        <motion.div
          animate={currentStreak > 0 ? { 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className={cn("h-8 w-8", streakColor)} />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold", streakColor)}>
              {currentStreak}
            </span>
            <span className="text-sm text-muted-foreground">day streak</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Best: {longestStreak} days
          </div>
        </div>
        {practicedToday && (
          <div className="ml-auto flex items-center gap-1 text-emerald-500 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Done today</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden",
      currentStreak >= 7 && "border-orange-500/30"
    )}>
      <CardHeader className={cn(
        "pb-2",
        streakBgColor
      )}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className={cn("h-5 w-5", streakColor)} />
          Daily Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <motion.div
              animate={currentStreak > 0 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-baseline gap-2"
            >
              <span className={cn("text-4xl font-bold", streakColor)}>
                {currentStreak}
              </span>
              <span className="text-muted-foreground">days</span>
            </motion.div>
            {practicedToday ? (
              <div className="flex items-center gap-1 text-emerald-500 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Practiced today</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Practice today to continue!
              </p>
            )}
          </div>

          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Longest</span>
            </div>
            <div className="text-2xl font-bold">{longestStreak}</div>
          </div>
        </div>

        {currentStreak > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Streak milestones
              </span>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30].map((milestone) => (
                <div
                  key={milestone}
                  className={cn(
                    "flex-1 p-2 rounded-lg text-center text-sm",
                    currentStreak >= milestone
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {milestone}d
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
