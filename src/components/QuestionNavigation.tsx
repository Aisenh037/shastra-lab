import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  max_marks: number;
}

interface QuestionNavigationProps {
  questions: Question[];
  currentIndex: number;
  answeredQuestions: Set<string>;
  flaggedQuestions: Set<string>;
  onQuestionSelect: (index: number) => void;
}

export function QuestionNavigation({
  questions,
  currentIndex,
  answeredQuestions,
  flaggedQuestions,
  onQuestionSelect,
}: QuestionNavigationProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question, index) => {
        const isAnswered = answeredQuestions.has(question.id);
        const isFlagged = flaggedQuestions.has(question.id);
        const isCurrent = index === currentIndex;

        return (
          <motion.button
            key={question.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuestionSelect(index)}
            className={cn(
              "relative w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200",
              "flex items-center justify-center",
              isCurrent
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                : isAnswered
                ? "bg-success/20 text-success border border-success/30"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {index + 1}
            
            {/* Status indicator */}
            {isAnswered && !isCurrent && (
              <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-success bg-background rounded-full" />
            )}
            {isFlagged && (
              <AlertCircle className="absolute -top-1 -right-1 h-4 w-4 text-warning bg-background rounded-full" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export function QuestionNavigationLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-primary" />
        <span>Current</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-success/20 border border-success/30" />
        <span>Answered</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-muted" />
        <span>Not answered</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-warning" />
        <span>Flagged for review</span>
      </div>
    </div>
  );
}
