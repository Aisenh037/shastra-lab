import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import { useStreak } from '@/hooks/useStreak';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AchievementBadge, 
  AchievementProgress, 
  ACHIEVEMENTS 
} from '@/components/AchievementBadge';
import { StreakDisplay } from '@/components/StreakDisplay';
import { motion } from 'framer-motion';
import { Trophy, Star, Lock, Flame, Target, Medal, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_INFO = {
  tests: { label: 'Tests', icon: Target, color: 'text-blue-500' },
  scores: { label: 'Scores', icon: Star, color: 'text-yellow-500' },
  ranking: { label: 'Ranking', icon: Medal, color: 'text-amber-500' },
  streaks: { label: 'Streaks', icon: Flame, color: 'text-orange-500' },
};

export default function Achievements() {
  const { user } = useAuth();
  const { achievements, unlockedKeys, isLoading, checkAndUpdate } = useAchievements();
  const { streak, isLoading: streakLoading } = useStreak();

  // Check for new achievements when page loads
  useEffect(() => {
    if (user) {
      checkAndUpdate();
    }
  }, [user, checkAndUpdate]);

  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedCount = unlockedKeys.length;
  const totalCount = allAchievements.length;

  // Group achievements by category
  const categorizedAchievements = allAchievements.reduce((acc, achievement) => {
    const category = achievement.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof allAchievements>);

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Common';
      case 'rare': return 'Rare';
      case 'epic': return 'Epic';
      case 'legendary': return 'Legendary';
      default: return rarity;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-emerald-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Achievements
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your milestones and unlock badges
          </p>
        </div>

        {/* Streak Card */}
        {streakLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <StreakDisplay
            currentStreak={streak.currentStreak}
            longestStreak={streak.longestStreak}
            practicedToday={streak.practicedToday}
            variant="card"
          />
        )}

        {/* Progress Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  {unlockedCount} of {totalCount} Achievements Unlocked
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {unlockedCount === 0 
                    ? "Complete tests to start earning achievements!"
                    : unlockedCount === totalCount
                    ? "Congratulations! You've unlocked all achievements!"
                    : `Keep going! ${totalCount - unlockedCount} more to unlock.`}
                </p>
                <div className="mt-3">
                  <AchievementProgress unlockedCount={unlockedCount} totalCount={totalCount} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unlocked Achievements */}
        {unlockedKeys.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Unlocked ({unlockedKeys.length})
              </CardTitle>
              <CardDescription>
                Achievements you've earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {unlockedKeys.map((key, index) => {
                    const achievement = ACHIEVEMENTS[key];
                    if (!achievement) return null;
                    
                    const unlockedData = achievements.find(a => a.achievement_key === key);
                    const unlockedDate = unlockedData 
                      ? new Date(unlockedData.unlocked_at).toLocaleDateString()
                      : '';

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2",
                          achievement.bgColor,
                          achievement.borderColor
                        )}>
                          <AchievementBadge 
                            achievementKey={key} 
                            size="lg" 
                            showTooltip={false}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={cn("font-bold", achievement.color)}>
                                {achievement.name}
                              </h3>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                getRarityColor(achievement.rarity),
                                "bg-background/50"
                              )}>
                                {getRarityLabel(achievement.rarity)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            {unlockedDate && (
                              <p className="text-xs text-muted-foreground/70 mt-2">
                                Unlocked on {unlockedDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Locked Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Locked ({totalCount - unlockedCount})
            </CardTitle>
            <CardDescription>
              Achievements waiting to be unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {allAchievements
                  .filter(a => !unlockedKeys.includes(a.key))
                  .map((achievement, index) => (
                    <motion.div
                      key={achievement.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-muted bg-muted/30 opacity-60">
                        <AchievementBadge 
                          achievementKey={achievement.key} 
                          unlocked={false}
                          size="lg" 
                          showTooltip={false}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-muted-foreground">
                              {achievement.name}
                            </h3>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full bg-muted",
                              "text-muted-foreground"
                            )}>
                              {getRarityLabel(achievement.rarity)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
