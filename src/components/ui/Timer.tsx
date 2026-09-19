import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export interface TimerProps {
  seconds: number;
  isRunning: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  variant?: 'default' | 'danger';
}

const Timer: React.FC<TimerProps> = ({
  seconds,
  isRunning,
  onComplete,
  onTick,
  variant = 'default',
}) => {
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const intervalId = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (onTickRef.current) {
          onTickRef.current(next);
        }
        if (next <= 0) {
          clearInterval(intervalId);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, remaining]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isDanger = remaining <= 10 && remaining > 0;
  
  return (
    <motion.div
      animate={isDanger ? { scale: [1, 1.05, 1] } : {}}
      transition={isDanger ? { repeat: Infinity, duration: 1 } : {}}
      className={`rounded-pill px-4 py-2 font-bold text-lg inline-flex items-center justify-center transition-colors
        ${isDanger || variant === 'danger' ? 'bg-error/20 text-error' : 'bg-warmgray/20 text-charcoal'}`}
    >
      {formatTime(remaining)}
    </motion.div>
  );
};

export default Timer;

