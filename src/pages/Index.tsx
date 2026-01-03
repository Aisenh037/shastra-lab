import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Target, ArrowRight, CheckCircle, Sparkles, Users, Globe } from 'lucide-react';

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
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">ShastraLab</span>
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
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Inspired by the Ancient Shastra Tradition
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Engineering{' '}
              <span className="text-primary">Exam-Ready Answers</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              ShastraLab is an AI-powered answer evaluation platform that teaches aspirants how to think, structure, and write like an examiner — reviving ancient discipline with modern AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8">
                  Start Your Journey
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

      {/* Problem Section */}
      <section className="py-16 bg-destructive/5 border-y border-destructive/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-display font-bold mb-4">
              The Problem
            </h2>
            <p className="text-lg text-muted-foreground">
              Millions of aspirants prepare for UPSC and state civil services, but fail not because they lack knowledge — <span className="font-semibold text-foreground">they fail because they cannot structure their answers the way examiners think.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Insight Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-primary font-medium mb-4">
              <Sparkles className="h-5 w-5" />
              The Insight
            </div>
            <p className="text-xl lg:text-2xl font-display">
              India has always solved complex problems through <span className="font-bold text-primary">Shastra</span> — a disciplined system of thinking, structure, and method. But modern exam preparation ignores this tradition.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl font-display font-bold mb-4">
              How ShastraLab Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A Shastra-inspired framework for mastering answer writing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: BookOpen,
                title: 'Upload Your Answer',
                description: 'Write your answer by hand or type it. Upload a photo of your handwritten answer — our AI reads it perfectly.',
              },
              {
                step: '02',
                icon: Brain,
                title: 'Shastra Framework Analysis',
                description: 'Your answer is evaluated using a Shastra-inspired framework — structure, relevance, depth, and examiner expectations.',
              },
              {
                step: '03',
                icon: Target,
                title: 'Visual Mentoring',
                description: 'Receive personalized feedback through text and AI-generated examiner videos that teach you how to improve.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="relative p-8 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute -top-4 left-6 px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
                  {feature.step}
                </div>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 mt-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <h2 className="text-3xl font-display font-bold mb-6">
                Democratizing High-Quality Mentorship
              </h2>
              <p className="text-muted-foreground mb-8">
                ShastraLab makes disciplined learning accessible, scalable, and fair — especially for students who cannot afford expensive coaching.
              </p>
              <ul className="space-y-4">
                {[
                  'Examiner-level feedback at a fraction of coaching cost',
                  'Available 24/7 — practice anytime, anywhere',
                  'Supports UPSC, State PSC, and descriptive exams',
                  'Handwritten answer recognition with 98% accuracy',
                  'AI video mentoring for visual learners',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 lg:p-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '50K+', label: 'Answers Evaluated', icon: BookOpen },
                  { value: '15K+', label: 'Happy Aspirants', icon: Users },
                  { value: '98%', label: 'OCR Accuracy', icon: Target },
                  { value: '29', label: 'States Covered', icon: Globe },
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

      {/* Vision Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary-foreground mb-6">
            Our Vision
          </h2>
          <p className="text-primary-foreground/90 text-xl mb-8 max-w-2xl mx-auto font-medium">
            To become the global standard for descriptive answer evaluation, starting from India's most demanding exams.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Join the Movement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">ShastraLab</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ShastraLab. Engineering exam-ready answers.
          </p>
        </div>
      </footer>
    </div>
  );
}
