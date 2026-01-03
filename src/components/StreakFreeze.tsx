import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, AlertTriangle, Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StreakFreezeProps {
  freezeCount: number;
  streakAtRisk: boolean;
  currentStreak: number;
  onUseFreeze: () => Promise<{ success: boolean; freezesRemaining: number; message: string } | null>;
  onAddFreezes: (count: number) => Promise<number | null>;
}

export function StreakFreeze({
  freezeCount,
  streakAtRisk,
  currentStreak,
  onUseFreeze,
  onAddFreezes,
}: StreakFreezeProps) {
  const [isUsing, setIsUsing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleUseFreeze = async () => {
    if (freezeCount <= 0) {
      toast.error('No freezes available');
      return;
    }

    setIsUsing(true);
    try {
      const result = await onUseFreeze();
      if (result?.success) {
        toast.success('Streak freeze applied!', {
          description: `Your ${currentStreak} day streak has been preserved.`,
        });
      } else {
        toast.info(result?.message || 'Freeze not needed');
      }
    } catch (error) {
      toast.error('Failed to use freeze');
    } finally {
      setIsUsing(false);
    }
  };

  const handleEarnFreeze = async () => {
    setIsAdding(true);
    try {
      const newCount = await onAddFreezes(1);
      if (newCount !== null) {
        toast.success('Freeze earned!', {
          description: `You now have ${newCount} freeze${newCount !== 1 ? 's' : ''} available.`,
        });
      }
    } catch (error) {
      toast.error('Failed to add freeze');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Snowflake className="h-5 w-5 text-cyan-500" />
          Streak Freezes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[...Array(Math.min(freezeCount, 5))].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Snowflake className="h-6 w-6 text-cyan-400" />
                </motion.div>
              ))}
              {freezeCount > 5 && (
                <Badge variant="secondary" className="ml-1">
                  +{freezeCount - 5}
                </Badge>
              )}
              {freezeCount === 0 && (
                <span className="text-sm text-muted-foreground">No freezes available</span>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-cyan-500 border-cyan-500/50">
            {freezeCount} available
          </Badge>
        </div>

        <AnimatePresence>
          {streakAtRisk && currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 border border-destructive/30 p-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Your {currentStreak} day streak is at risk!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You missed yesterday's practice. Use a freeze to preserve your streak.
                  </p>
                  {freezeCount > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleUseFreeze}
                      disabled={isUsing}
                      className="mt-2"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isUsing ? 'Applying...' : 'Use Freeze'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">
            Freezes protect your streak when you miss a day. Earn freezes by maintaining long streaks!
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEarnFreeze}
            disabled={isAdding}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? 'Adding...' : 'Earn Free Freeze (Demo)'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
