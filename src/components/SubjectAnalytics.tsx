import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BookOpen, Target, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  created_at: string;
  score: number | null;
  max_score: number | null;
  question: {
    subject: string | null;
    topic: string | null;
  } | null;
}

interface SubjectAnalyticsProps {
  submissions: Submission[];
}

interface SubjectStats {
  subject: string;
  totalSubmissions: number;
  averagePercentage: number;
  trend: 'up' | 'down' | 'neutral';
  recentPercentage: number;
  topics: TopicStats[];
}

interface TopicStats {
  topic: string;
  count: number;
  averagePercentage: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(280 67% 50%)',
  'hsl(200 95% 45%)',
  'hsl(350 89% 60%)',
];

export default function SubjectAnalytics({ submissions }: SubjectAnalyticsProps) {
  const subjectStats = useMemo(() => {
    const subjectMap = new Map<string, Submission[]>();
    
    submissions.forEach(s => {
      const subject = s.question?.subject || 'Uncategorized';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, []);
      }
      subjectMap.get(subject)!.push(s);
    });

    const stats: SubjectStats[] = [];
    
    subjectMap.forEach((subs, subject) => {
      const sortedSubs = [...subs].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const avgPercentage = subs.reduce((acc, s) => 
        acc + ((s.score || 0) / (s.max_score || 10) * 100), 0
      ) / subs.length;
      
      // Calculate trend
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (sortedSubs.length >= 2) {
        const recentHalf = sortedSubs.slice(-Math.ceil(sortedSubs.length / 2));
        const olderHalf = sortedSubs.slice(0, Math.floor(sortedSubs.length / 2));
        
        const recentAvg = recentHalf.reduce((acc, s) => 
          acc + ((s.score || 0) / (s.max_score || 10) * 100), 0
        ) / recentHalf.length;
        
        const olderAvg = olderHalf.length > 0 
          ? olderHalf.reduce((acc, s) => 
              acc + ((s.score || 0) / (s.max_score || 10) * 100), 0
            ) / olderHalf.length
          : recentAvg;
        
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';
      }
      
      // Get recent percentage
      const recentSubs = sortedSubs.slice(-3);
      const recentPercentage = recentSubs.reduce((acc, s) => 
        acc + ((s.score || 0) / (s.max_score || 10) * 100), 0
      ) / recentSubs.length;
      
      // Topic breakdown
      const topicMap = new Map<string, { count: number; totalPercentage: number }>();
      subs.forEach(s => {
        const topic = s.question?.topic || 'General';
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { count: 0, totalPercentage: 0 });
        }
        const t = topicMap.get(topic)!;
        t.count++;
        t.totalPercentage += (s.score || 0) / (s.max_score || 10) * 100;
      });
      
      const topics: TopicStats[] = [];
      topicMap.forEach((data, topic) => {
        topics.push({
          topic,
          count: data.count,
          averagePercentage: Math.round(data.totalPercentage / data.count),
        });
      });
      
      stats.push({
        subject,
        totalSubmissions: subs.length,
        averagePercentage: Math.round(avgPercentage),
        trend,
        recentPercentage: Math.round(recentPercentage),
        topics: topics.sort((a, b) => b.count - a.count),
      });
    });
    
    return stats.sort((a, b) => b.totalSubmissions - a.totalSubmissions);
  }, [submissions]);

  const radarData = useMemo(() => {
    return subjectStats.slice(0, 6).map(s => ({
      subject: s.subject.length > 12 ? s.subject.substring(0, 12) + '...' : s.subject,
      score: s.averagePercentage,
      fullMark: 100,
    }));
  }, [subjectStats]);

  const pieData = useMemo(() => {
    return subjectStats.slice(0, 6).map(s => ({
      name: s.subject,
      value: s.totalSubmissions,
    }));
  }, [subjectStats]);

  const barData = useMemo(() => {
    return subjectStats.slice(0, 8).map(s => ({
      subject: s.subject.length > 15 ? s.subject.substring(0, 15) + '...' : s.subject,
      average: s.averagePercentage,
      recent: s.recentPercentage,
    }));
  }, [subjectStats]);

  if (submissions.length === 0) {
    return null;
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-rose-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Subject-wise Analytics</h2>
      </div>

      {/* Overview Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart - Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="subject" type="category" width={100} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}%`, 
                      name === 'average' ? 'Overall Avg' : 'Recent Avg'
                    ]}
                  />
                  <Bar dataKey="average" fill="hsl(var(--primary))" name="average" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="recent" fill="hsl(var(--primary) / 0.5)" name="recent" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart - Skills Overview */}
        {radarData.length >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Skills Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="subject" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.3)"
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Avg Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submission Distribution Pie */}
      {pieData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} submissions`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{entry.name}</span>
                    <Badge variant="secondary" className="text-xs">{entry.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Subject Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectStats.map((subject) => (
          <Card key={subject.subject} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{subject.subject}</CardTitle>
                {getTrendIcon(subject.trend)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {subject.totalSubmissions} attempts
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className={cn("text-lg font-bold", getScoreColor(subject.averagePercentage))}>
                  {subject.averagePercentage}%
                </span>
              </div>
              <Progress 
                value={subject.averagePercentage} 
                className="h-2"
              />
              
              {subject.topics.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Top Topics</p>
                  <div className="space-y-2">
                    {subject.topics.slice(0, 3).map((topic) => (
                      <div key={topic.topic} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{topic.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", getScoreColor(topic.averagePercentage))}>
                            {topic.averagePercentage}%
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {topic.count}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
