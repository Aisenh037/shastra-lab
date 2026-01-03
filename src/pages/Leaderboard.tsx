import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Target, 
  Crown,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_score: number;
  total_max_score: number;
  percentage: number;
  tests_completed: number;
  rank: number;
}

interface UserRank {
  rank: number;
  total_users: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      fetchUserRank();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) throw error;
      
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_rank', { 
        p_user_id: user.id 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setUserRank(data[0]);
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-600';
      default:
        return '';
    }
  };

  const currentUserEntry = leaderboard.find(entry => entry.user_id === user?.id);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Top performers across all mock tests
          </p>
        </div>

        {/* User's Rank Card */}
        {userRank && userRank.rank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/20">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Rank</p>
                      <p className="text-3xl font-bold text-foreground">
                        #{userRank.rank}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Out of</p>
                    <p className="text-2xl font-bold text-foreground">
                      {userRank.total_users} users
                    </p>
                  </div>
                  {currentUserEntry && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Your Score</p>
                      <p className="text-2xl font-bold text-primary">
                        {currentUserEntry.percentage}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Rankings based on overall test performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-12 flex-1" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Rankings Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Complete some mock tests to appear on the leaderboard!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user?.id;
                  
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                        entry.rank <= 3 
                          ? getRankBadgeClass(entry.rank)
                          : "bg-muted/50 hover:bg-muted",
                        isCurrentUser && entry.rank > 3 && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn(
                            entry.rank <= 3 ? "bg-background/50" : "bg-primary/10",
                            "text-sm font-medium"
                          )}>
                            {entry.display_name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={cn(
                            "font-medium",
                            entry.rank <= 3 ? "text-inherit" : "text-foreground"
                          )}>
                            {entry.display_name}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className={cn(
                            "text-sm",
                            entry.rank <= 3 ? "opacity-80" : "text-muted-foreground"
                          )}>
                            {entry.tests_completed} test{entry.tests_completed !== 1 ? 's' : ''} completed
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className={cn(
                          "text-2xl font-bold",
                          entry.rank <= 3 ? "text-inherit" : "text-foreground"
                        )}>
                          {entry.percentage}%
                        </p>
                        <p className={cn(
                          "text-sm",
                          entry.rank <= 3 ? "opacity-80" : "text-muted-foreground"
                        )}>
                          {entry.total_score}/{entry.total_max_score}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">{leaderboard.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Score</p>
                  <p className="text-2xl font-bold">
                    {leaderboard[0]?.percentage || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Trophy className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {leaderboard.length > 0 
                      ? Math.round(leaderboard.reduce((sum, e) => sum + e.percentage, 0) / leaderboard.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
