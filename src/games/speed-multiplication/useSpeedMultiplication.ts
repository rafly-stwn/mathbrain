import { useState, useCallback, useEffect, useRef } from 'react';
import type { Difficulty, GameScore } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';

interface SpeedMultiplicationState {
  phase: 'setup' | 'playing' | 'finished';
  difficulty: Difficulty;
  timeLeft: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  wrong: number;
  currentProblem: { a: number; b: number; answer: number };
  feedback: 'correct' | 'wrong' | null;
  history: Array<{ problem: string; userAnswer: number; correctAnswer: number; isCorrect: boolean }>;
}

const GAME_DURATION = 60;

const generateProblem = (difficulty: Difficulty) => {
  let a = 0;
  let b = 0;
  
  if (difficulty === 'easy') {
    a = Math.floor(Math.random() * 8) + 2; // 2-9
    b = Math.floor(Math.random() * 8) + 2; // 2-9
  } else if (difficulty === 'medium') {
    a = Math.floor(Math.random() * 89) + 11; // 11-99
    b = Math.floor(Math.random() * 8) + 2; // 2-9
    // Swap occasionally for variety
    if (Math.random() > 0.5) {
      const temp = a;
      a = b;
      b = temp;
    }
  } else {
    // Hard: 11-30 × 11-30
    a = Math.floor(Math.random() * 20) + 11;
    b = Math.floor(Math.random() * 20) + 11;
  }
  
  return { a, b, answer: a * b };
};

export const useSpeedMultiplication = () => {
  const [state, setState] = useState<SpeedMultiplicationState>({
    phase: 'setup',
    difficulty: 'easy',
    timeLeft: GAME_DURATION,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    currentProblem: { a: 0, b: 0, answer: 0 },
    feedback: null,
    history: [],
  });

  const addScore = useGameStore(state => state.addScore);
  const timerRef = useRef<number | null>(null);

  const startGame = useCallback((difficulty: Difficulty) => {
    setState({
      phase: 'playing',
      difficulty,
      timeLeft: GAME_DURATION,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      wrong: 0,
      currentProblem: generateProblem(difficulty),
      feedback: null,
      history: [],
    });
  }, []);

  const finishGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    soundService.playWin();
    
    setState(prev => {
      const scoreObj: GameScore = {
        gameId: 'speed-multiplication',
        score: prev.score,
        difficulty: prev.difficulty,
        date: new Date().toISOString(),
        duration: GAME_DURATION,
        correct: prev.correct,
        wrong: prev.wrong,
      };
      
      addScore('speed-multiplication', scoreObj);
      
      return { ...prev, phase: 'finished' };
    });
  }, [addScore]);

  useEffect(() => {
    if (state.phase === 'playing' && state.timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current!);
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else if (state.timeLeft === 0 && state.phase === 'playing') {
      finishGame();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, state.timeLeft, finishGame]);

  const submitAnswer = useCallback((userAnswer: number) => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      
      const isCorrect = userAnswer === prev.currentProblem.answer;
      
      if (isCorrect) {
        soundService.playCorrect();
      } else {
        soundService.playWrong();
      }
      
      let newScore = prev.score;
      let newStreak = prev.streak;
      let newBestStreak = prev.bestStreak;
      
      if (isCorrect) {
        newStreak += 1;
        newBestStreak = Math.max(prev.bestStreak, newStreak);
        
        // Base points depend on difficulty
        const basePoints = prev.difficulty === 'easy' ? 10 : prev.difficulty === 'medium' ? 20 : 40;
        // Streak bonus
        const streakBonus = Math.floor(newStreak / 5) * 5;
        
        newScore += basePoints + streakBonus;
      } else {
        newStreak = 0;
        // No negative points, but lose streak
      }
      
      const historyItem = {
        problem: `${prev.currentProblem.a} × ${prev.currentProblem.b}`,
        userAnswer,
        correctAnswer: prev.currentProblem.answer,
        isCorrect
      };
      
      return {
        ...prev,
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        currentProblem: generateProblem(prev.difficulty),
        feedback: isCorrect ? 'correct' : 'wrong',
        history: [...prev.history, historyItem]
      };
    });
    
    // Clear feedback after a short delay
    setTimeout(() => {
      setState(prev => prev.phase === 'playing' ? { ...prev, feedback: null } : prev);
    }, 500);
    
  }, []);

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'setup',
      timeLeft: GAME_DURATION,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      wrong: 0,
      feedback: null,
      history: [],
    }));
  }, []);

  return {
    ...state,
    startGame,
    submitAnswer,
    resetGame
  };
};

