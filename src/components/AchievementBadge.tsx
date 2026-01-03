import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Award,
  Star,
  Zap,
  Crown,
  Medal,
  Target,
  Flame,
  Sparkles,
  Calendar,
  CalendarCheck,
  CalendarDays,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: 'tests' | 'scores' | 'ranking' | 'streaks';
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  first_test: {
    key: 'first_test',
    name: 'First Steps',
    description: 'Complete your first test',
    icon: Star,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    rarity: 'common',
    category: 'tests',
  },
  test_veteran: {
    key: 'test_veteran',
    name: 'Test Veteran',
    description: 'Complete 10 tests',
    icon: Target,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    rarity: 'common',
    category: 'tests',
  },
  test_master: {
    key: 'test_master',
    name: 'Test Master',
    description: 'Complete 25 tests',
    icon: Award,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    rarity: 'rare',
    category: 'tests',
  },
  high_scorer: {
    key: 'high_scorer',
    name: 'High Scorer',
    description: 'Score 90%+ on a test',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    rarity: 'common',
    category: 'scores',
  },
  consistent_excellence: {
    key: 'consistent_excellence',
    name: 'Consistent Excellence',
    description: 'Score 90%+ on 5 tests',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    rarity: 'rare',
    category: 'scores',
  },
  perfectionist: {
    key: 'perfectionist',
    name: 'Perfectionist',
    description: 'Score 90%+ on 10 tests',
    icon: Sparkles,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    rarity: 'epic',
    category: 'scores',
  },
  top_10: {
    key: 'top_10',
    name: 'Rising Star',
    description: 'Reach top 10 on leaderboard',
    icon: Medal,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    rarity: 'rare',
    category: 'ranking',
  },
  top_3: {
    key: 'top_3',
    name: 'Elite Performer',
    description: 'Reach top 3 on leaderboard',
    icon: Trophy,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    rarity: 'epic',
    category: 'ranking',
  },
  champion: {
    key: 'champion',
    name: 'Champion',
    description: 'Reach #1 on leaderboard',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20',
    borderColor: 'border-yellow-500/50',
    rarity: 'legendary',
    category: 'ranking',
  },
  week_warrior: {
    key: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day practice streak',
    icon: Calendar,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    rarity: 'common',
    category: 'streaks',
  },
  fortnight_fighter: {
    key: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day practice streak',
    icon: CalendarCheck,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    rarity: 'rare',
    category: 'streaks',
  },
  monthly_master: {
    key: 'monthly_master',
    name: 'Monthly Master',
    description: 'Maintain a 30-day practice streak',
    icon: CalendarDays,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    rarity: 'epic',
    category: 'streaks',
  },
};

interface AchievementBadgeProps {
  achievementKey: string;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  animate?: boolean;
}

export function AchievementBadge({
  achievementKey,
  unlocked = true,
  size = 'md',
  showTooltip = true,
  animate = true,
}: AchievementBadgeProps) {
  const achievement = ACHIEVEMENTS[achievementKey];
  
  if (!achievement) return null;

  const Icon = achievement.icon;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const badge = (
    <motion.div
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={animate ? { scale: 1.1 } : undefined}
      className={cn(
        "rounded-full flex items-center justify-center border-2 transition-all duration-300",
        sizeClasses[size],
        unlocked
          ? [achievement.bgColor, achievement.borderColor]
          : "bg-muted/50 border-muted-foreground/20 grayscale opacity-50"
      )}
    >
      <Icon className={cn(
        iconSizes[size],
        unlocked ? achievement.color : "text-muted-foreground"
      )} />
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <div className="text-center">
          <p className={cn("font-medium", unlocked ? achievement.color : "text-muted-foreground")}>
            {achievement.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {achievement.description}
          </p>
          {!unlocked && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic">
              Not yet unlocked
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface AchievementShowcaseProps {
  unlockedAchievements: string[];
  showLocked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementShowcase({
  unlockedAchievements,
  showLocked = false,
  size = 'md',
}: AchievementShowcaseProps) {
  const allAchievementKeys = Object.keys(ACHIEVEMENTS);
  const displayAchievements = showLocked 
    ? allAchievementKeys 
    : unlockedAchievements;

  if (displayAchievements.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No achievements unlocked yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayAchievements.map((key, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <AchievementBadge
            achievementKey={key}
            unlocked={unlockedAchievements.includes(key)}
            size={size}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function AchievementProgress({
  unlockedCount,
  totalCount = Object.keys(ACHIEVEMENTS).length,
}: {
  unlockedCount: number;
  totalCount?: number;
}) {
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Achievements</span>
        <span className="font-medium">{unlockedCount}/{totalCount}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
