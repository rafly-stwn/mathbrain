import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';
import type { Difficulty } from '../../types';


const getTimePerColumn = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return 60;
    case 'medium': return 45;
    case 'hard': return 30;
  }
};

const getTotalColumns = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return 5;
    case 'medium': return 8;
    case 'hard': return 10;
  }
};

const generateColumns = (difficulty: Difficulty) => {
  const numColumns = getTotalColumns(difficulty);
  const columns = [];
  for (let i = 0; i < numColumns; i++) {
    const col = [];
    for (let j = 0; j < 50; j++) {
      col.push(Math.floor(Math.random() * 9) + 1);
    }
    columns.push(col);
  }
  return columns;
};

export const useKraepelin = () => {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [columns, setColumns] = useState<number[][]>([]);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [correctCounts, setCorrectCounts] = useState<number[]>([]);
  const [wrongCounts, setWrongCounts] = useState<number[]>([]);
  const [timeLeftInColumn, setTimeLeftInColumn] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const addScore = useGameStore(state => state.addScore);
  const scores = useGameStore(state => state.scores);
  
  const timerRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    const newColumns = generateColumns(difficulty);
    const numCols = getTotalColumns(difficulty);
    setColumns(newColumns);
    setPhase('playing');
    setCurrentColumnIndex(0);
    setCurrentRowIndex(0);
    setAnswers(Array.from({ length: numCols }, () => []));
    setCorrectCounts(Array.from({ length: numCols }, () => 0));
    setWrongCounts(Array.from({ length: numCols }, () => 0));
    setTimeLeftInColumn(getTimePerColumn(difficulty));
    setTotalCorrect(0);
    setTotalWrong(0);
    setTotalAnswered(0);
    setFeedback(null);
  }, [difficulty]);

  const endGame = useCallback(() => {
    soundService.playWin();
    setPhase('finished');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const nextColumn = useCallback(() => {
    if (currentColumnIndex >= getTotalColumns(difficulty) - 1) {
      endGame();
    } else {
      setCurrentColumnIndex(prev => prev + 1);
      setCurrentRowIndex(0);
      setTimeLeftInColumn(getTimePerColumn(difficulty));
      setFeedback(null);
    }
  }, [currentColumnIndex, difficulty, endGame]);

  const submitDigit = useCallback((digit: number) => {
    if (phase !== 'playing') return;

    const currentColumn = columns[currentColumnIndex];
    if (!currentColumn || currentRowIndex >= currentColumn.length - 1) return;

    const num1 = currentColumn[currentRowIndex];
    const num2 = currentColumn[currentRowIndex + 1];
    const expected = (num1 + num2) % 10;
    
    const isCorrect = expected === digit;

    setAnswers(prev => {
      const next = [...prev];
      next[currentColumnIndex] = [...next[currentColumnIndex]];
      next[currentColumnIndex][currentRowIndex] = digit;
      return next;
    });

    if (isCorrect) {
      soundService.playCorrect();
      setCorrectCounts(prev => {
        const next = [...prev];
        next[currentColumnIndex]++;
        return next;
      });
      setTotalCorrect(prev => prev + 1);
      setFeedback('correct');
    } else {
      soundService.playWrong();
      setWrongCounts(prev => {
        const next = [...prev];
        next[currentColumnIndex]++;
        return next;
      });
      setTotalWrong(prev => prev + 1);
      setFeedback('wrong');
    }
    
    setTotalAnswered(prev => prev + 1);

    if (currentRowIndex >= currentColumn.length - 2) {
      nextColumn();
    } else {
      setCurrentRowIndex(prev => prev + 1);
    }
  }, [phase, columns, currentColumnIndex, currentRowIndex, nextColumn]);

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeLeftInColumn(prev => {
          if (prev <= 1) {
            nextColumn();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, nextColumn]);

  useEffect(() => {
    if (phase === 'finished') {
      addScore('kraepelin', {
        gameId: 'kraepelin',
        score: totalCorrect,
        difficulty,
        date: new Date().toISOString(),
        duration: getTotalColumns(difficulty) * getTimePerColumn(difficulty),
        correct: totalCorrect,
        wrong: totalWrong
      });
    }
  }, [phase, totalCorrect, difficulty, totalWrong, addScore]);

  const bestScore = (scores['kraepelin']?.scores || [])
    .filter(s => s.difficulty === difficulty)
    .sort((a, b) => b.score - a.score)[0]?.score || scores['kraepelin']?.bestScore || 0;

  return {
    phase,
    difficulty,
    setDifficulty,
    columns,
    currentColumnIndex,
    currentRowIndex,
    answers,
    correctCounts,
    wrongCounts,
    timeLeftInColumn,
    totalCorrect,
    totalWrong,
    totalAnswered,
    feedback,
    bestScore,
    startGame,
    submitDigit,
    setPhase
  };
};
