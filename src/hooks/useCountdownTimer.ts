import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownTimerOptions {
  initialMinutes: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

interface UseCountdownTimerReturn {
  timeRemaining: number; // in seconds
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isTimeUp: boolean;
  percentRemaining: number;
  start: () => void;
  pause: () => void;
  reset: (newMinutes?: number) => void;
  formatTime: () => string;
}

export function useCountdownTimer({
  initialMinutes,
  onTimeUp,
  autoStart = false,
}: UseCountdownTimerOptions): UseCountdownTimerReturn {
  const initialSeconds = initialMinutes * 60;
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  const initialSecondsRef = useRef(initialSeconds);

  // Keep callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    initialSecondsRef.current = initialMinutes * 60;
  }, [initialMinutes]);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsTimeUp(true);
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const start = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true);
    }
  }, [timeRemaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newMinutes?: number) => {
    const seconds = newMinutes ? newMinutes * 60 : initialSecondsRef.current;
    setTimeRemaining(seconds);
    setIsRunning(false);
    setIsTimeUp(false);
  }, []);

  const formatTime = useCallback(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentRemaining = (timeRemaining / initialSecondsRef.current) * 100;

  return {
    timeRemaining,
    minutes,
    seconds,
    isRunning,
    isTimeUp,
    percentRemaining,
    start,
    pause,
    reset,
    formatTime,
  };
}
