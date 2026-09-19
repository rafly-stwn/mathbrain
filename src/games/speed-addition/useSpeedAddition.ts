import { useState, useEffect, useCallback } from 'react';
import type { Difficulty } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';

interface Problem {
  a: number;
  b: number;
  c?: number;
  answer: number;
}

export interface SpeedAdditionState {
  phase: 'setup' | 'playing' | 'finished';
  difficulty: Difficulty;
  timeLeft: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  wrong: number;
  currentProblem: Problem;
  feedback: 'correct' | 'wrong' | null;
  history: Array<{ problem: string; userAnswer: number; correctAnswer: number; isCorrect: boolean }>;
}

const generateProblem = (difficulty: Difficulty): Problem => {
  if (difficulty === 'easy') {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  } else if (difficulty === 'medium') {
    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * 90) + 10;
    return { a, b, answer: a + b };
  } else {
    const a = Math.floor(Math.random() * 90) + 10;
    const b = Math.floor(Math.random() * 90) + 10;
    const c = Math.floor(Math.random() * 90) + 10;
    return { a, b, c, answer: a + b + c };
  }
};

export const useSpeedAddition = () => {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<Problem>({ a: 0, b: 0, answer: 0 });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [history, setHistory] = useState<SpeedAdditionState['history']>([]);
  
  const { addScore } = useGameStore();

  const startGame = useCallback(() => {
    setPhase('playing');
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(0);
    setWrong(0);
    setHistory([]);
    setCurrentProblem(generateProblem(difficulty));
  }, [difficulty]);

  const submitAnswer = useCallback((userAnswer: number) => {
    if (phase !== 'playing') return;
    
    const isCorrect = userAnswer === currentProblem.answer;
    
    const problemString = currentProblem.c 
      ? `${currentProblem.a} + ${currentProblem.b} + ${currentProblem.c}`
      : `${currentProblem.a} + ${currentProblem.b}`;

    setHistory(prev => [{
      problem: problemString,
      userAnswer,
      correctAnswer: currentProblem.answer,
      isCorrect
    }, ...prev]);

    if (isCorrect) {
      soundService.playCorrect();
      setScore(s => s + 1);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
      setCorrect(c => c + 1);
      setFeedback('correct');
      setTimeout(() => setFeedback(null), 300);
    } else {
      soundService.playWrong();
      setStreak(0);
      setWrong(w => w + 1);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
    }
    
    setCurrentProblem(generateProblem(difficulty));
  }, [phase, currentProblem, difficulty]);

  useEffect(() => {
    if (phase === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timer);
            setPhase('finished');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'finished') {
      soundService.playWin();
      addScore('speed-addition', {
        gameId: 'speed-addition',
        score,
        difficulty,
        date: new Date().toISOString(),
        duration: 60,
        correct,
        wrong
      });
    }
  }, [phase, score, difficulty, correct, wrong, addScore]);

  const restart = useCallback(() => {
    setPhase('setup');
  }, []);

  return {
    phase,
    difficulty,
    setDifficulty,
    timeLeft,
    score,
    streak,
    bestStreak,
    correct,
    wrong,
    currentProblem,
    feedback,
    history,
    startGame,
    submitAnswer,
    restart
  };
};

