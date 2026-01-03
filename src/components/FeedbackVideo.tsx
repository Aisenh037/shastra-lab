import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Target, Lightbulb, BarChart3, CheckCircle, ArrowUp, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface VideoSlide {
  title: string;
  content: string;
  icon: string;
  color: string;
  duration: number;
}

interface FeedbackVideoProps {
  slides: VideoSlide[];
  onComplete?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  target: Target,
  lightbulb: Lightbulb,
  chart: BarChart3,
  checkmark: CheckCircle,
  'arrow-up': ArrowUp,
};

const colorMap: Record<string, string> = {
  green: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
};

const bgColorMap: Record<string, string> = {
  green: 'bg-emerald-500/10',
  amber: 'bg-amber-500/10',
  blue: 'bg-blue-500/10',
  purple: 'bg-purple-500/10',
};

export function FeedbackVideo({ slides, onComplete }: FeedbackVideoProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalDuration = slides.reduce((acc, slide) => acc + slide.duration, 0);

  useEffect(() => {
    if (!isPlaying) return;

    const slide = slides[currentSlide];
    const intervalMs = 50;
    const increment = (intervalMs / (slide.duration * 1000)) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentSlide < slides.length - 1) {
            setCurrentSlide((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            onComplete?.();
            return 100;
          }
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, slides, onComplete]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentSlide(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const currentSlideData = slides[currentSlide];
  const IconComponent = iconMap[currentSlideData?.icon] || Star;
  const gradientClass = colorMap[currentSlideData?.color] || colorMap.blue;
  const bgClass = bgColorMap[currentSlideData?.color] || bgColorMap.blue;

  // Calculate overall progress
  const slidesCompleted = slides.slice(0, currentSlide).reduce((acc, s) => acc + s.duration, 0);
  const currentProgress = (currentSlideData?.duration || 0) * (progress / 100);
  const overallProgress = ((slidesCompleted + currentProgress) / totalDuration) * 100;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-background">
      {/* Video Display */}
      <div className={cn("relative aspect-video flex items-center justify-center", bgClass)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="text-center p-8 max-w-md"
          >
            {/* Icon */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center",
                `bg-gradient-to-br ${gradientClass}`
              )}
            >
              <IconComponent className="h-10 w-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-foreground mb-3"
            >
              {currentSlideData?.title}
            </motion.h3>

            {/* Content */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              {currentSlideData?.content}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentSlide
                  ? `bg-gradient-to-r ${gradientClass}`
                  : idx < currentSlide
                  ? "bg-foreground/30"
                  : "bg-foreground/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <Button
            size="icon"
            variant="outline"
            onClick={handlePlayPause}
            className="shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Progress bar */}
          <div className="flex-1">
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Restart */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRestart}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Time */}
          <span className="text-sm text-muted-foreground tabular-nums shrink-0">
            {currentSlide + 1}/{slides.length}
          </span>
        </div>
      </div>
    </div>
  );
}
