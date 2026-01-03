import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Brain, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">ExamAnalyzer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Transform Exam Papers into{' '}
              <span className="text-primary">Actionable Insights</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              AI-powered exam analysis platform for educators, coaching institutes, and exam preparation organizations. Extract, classify, and analyze questions automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8">
                  Start Analyzing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl font-display font-bold mb-4">
              Powerful Features for Exam Analysis
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze competitive exam papers and identify important topics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Question Extraction',
                description: 'Paste raw exam text and let AI automatically extract individual questions, preserving original wording.',
              },
              {
                icon: Brain,
                title: 'AI Classification',
                description: 'Automatically classify questions by topic, assign difficulty levels, and generate academic importance explanations.',
              },
              {
                icon: BarChart3,
                title: 'Topic Frequency Analysis',
                description: 'Analyze patterns across multiple papers to identify high-weightage topics and exam trends.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="p-8 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <h2 className="text-3xl font-display font-bold mb-6">
                Why Choose ExamAnalyzer?
              </h2>
              <p className="text-muted-foreground mb-8">
                Built for educational institutions that need to analyze exam patterns at scale. Save hours of manual work and get deeper insights.
              </p>
              <ul className="space-y-4">
                {[
                  'Support for UPSC, JEE, NEET, and custom syllabi',
                  'Batch analysis of multiple exam papers',
                  'Export data in JSON/CSV formats',
                  'Role-based access for teams',
                  'Trend analysis across years',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 lg:p-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '10K+', label: 'Questions Analyzed' },
                  { value: '500+', label: 'Papers Processed' },
                  { value: '98%', label: 'Accuracy Rate' },
                  { value: '50+', label: 'Institutions' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-4">
                    <p className="text-3xl lg:text-4xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground mb-6">
            Ready to Analyze Your First Paper?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join educators and coaching institutes already using ExamAnalyzer to gain insights from exam papers.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">ExamAnalyzer</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ExamAnalyzer. Built for educators.
          </p>
        </div>
      </footer>
    </div>
  );
}
