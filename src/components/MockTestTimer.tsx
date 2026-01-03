import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockTestTimerProps {
  minutes: number;
  seconds: number;
  percentRemaining: number;
  isTimeUp: boolean;
}

export function MockTestTimer({ minutes, seconds, percentRemaining, isTimeUp }: MockTestTimerProps) {
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isLowTime = percentRemaining < 20;
  const isCritical = percentRemaining < 10;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors duration-300",
        isTimeUp
          ? "bg-destructive/10 border-destructive text-destructive"
          : isCritical
          ? "bg-destructive/10 border-destructive text-destructive animate-pulse"
          : isLowTime
          ? "bg-warning/10 border-warning text-warning"
          : "bg-primary/10 border-primary text-primary"
      )}
    >
      {isLowTime ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-70">Time Remaining</span>
        <motion.span
          key={formattedTime}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-2xl font-mono font-bold tracking-wider"
        >
          {formattedTime}
        </motion.span>
      </div>

      {/* Progress arc */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-current opacity-20"
            strokeWidth="3"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-current"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={100}
            initial={{ strokeDashoffset: 100 - percentRemaining }}
            animate={{ strokeDashoffset: 100 - percentRemaining }}
            transition={{ duration: 0.5 }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
