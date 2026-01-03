import { useEffect, useState } from 'react';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { FileText, BookOpen, HelpCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { StreakDisplay } from '@/components/StreakDisplay';

interface Stats {
  totalPapers: number;
  totalQuestions: number;
  totalSyllabi: number;
  analyzedQuestions: number;
}

interface DifficultyData {
  name: string;
  value: number;
  color: string;
}

interface TopicData {
  topic: string;
  count: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { streak } = useStreak();
  const [stats, setStats] = useState<Stats>({
    totalPapers: 0,
    totalQuestions: 0,
    totalSyllabi: 0,
    analyzedQuestions: 0,
  });
  const [difficultyData, setDifficultyData] = useState<DifficultyData[]>([]);
  const [topTopics, setTopTopics] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch papers count
      const { count: papersCount } = await supabase
        .from('exam_papers')
        .select('*', { count: 'exact', head: true });

      // Fetch syllabi count
      const { count: syllabiCount } = await supabase
        .from('syllabi')
        .select('*', { count: 'exact', head: true });

      // Fetch questions with analysis
      const { data: questions, count: questionsCount } = await supabase
        .from('questions')
        .select('difficulty, topic, is_analyzed', { count: 'exact' });

      const analyzedCount = questions?.filter(q => q.is_analyzed).length || 0;

      // Calculate difficulty distribution
      const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
      questions?.forEach(q => {
        if (q.difficulty && q.is_analyzed) {
          difficultyCount[q.difficulty as keyof typeof difficultyCount]++;
        }
      });

      setDifficultyData([
        { name: 'Easy', value: difficultyCount.Easy, color: 'hsl(var(--success))' },
        { name: 'Medium', value: difficultyCount.Medium, color: 'hsl(var(--warning))' },
        { name: 'Hard', value: difficultyCount.Hard, color: 'hsl(var(--destructive))' },
      ]);

      // Calculate topic distribution
      const topicCount: Record<string, number> = {};
      questions?.forEach(q => {
        if (q.topic && q.is_analyzed) {
          topicCount[q.topic] = (topicCount[q.topic] || 0) + 1;
        }
      });

      const sortedTopics = Object.entries(topicCount)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopTopics(sortedTopics);

      setStats({
        totalPapers: papersCount || 0,
        totalQuestions: questionsCount || 0,
        totalSyllabi: syllabiCount || 0,
        analyzedQuestions: analyzedCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Papers', value: stats.totalPapers, icon: FileText, color: 'text-primary' },
    { label: 'Total Questions', value: stats.totalQuestions, icon: HelpCircle, color: 'text-accent' },
    { label: 'Analyzed', value: stats.analyzedQuestions, icon: TrendingUp, color: 'text-success' },
    { label: 'Syllabi', value: stats.totalSyllabi, icon: BookOpen, color: 'text-warning' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header with Streak */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your exam analysis.
            </p>
          </div>
          <StreakDisplay
            currentStreak={streak.currentStreak}
            longestStreak={streak.longestStreak}
            practicedToday={streak.practicedToday}
            variant="compact"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.label} 
              variant="shastra"
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Distribution */}
          <Card variant="decorated" className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty Distribution</CardTitle>
              <CardDescription>Breakdown of question difficulty levels</CardDescription>
            </CardHeader>
            <CardContent>
              {difficultyData.some(d => d.value > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {difficultyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {difficultyData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No analyzed questions yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Topics */}
          <Card variant="decorated" className="animate-slide-up" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Top Topics</CardTitle>
              <CardDescription>Most frequently appearing topics</CardDescription>
            </CardHeader>
            <CardContent>
              {topTopics.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topTopics} layout="vertical">
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="topic" 
                        type="category" 
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No topic data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card variant="ornate" className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/analyze">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <span>Analyze New Paper</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/syllabi">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span>Manage Syllabi</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/questions">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col gap-2">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <span>View Question Bank</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
