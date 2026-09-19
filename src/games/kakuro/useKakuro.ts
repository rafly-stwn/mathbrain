import { useState, useEffect, useCallback } from 'react';
import type { Difficulty } from '../../types';
import { getKakuroPuzzle, isKakuroComplete, type KakuroPuzzle } from './kakuroGenerator';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';

export type GamePhase = 'setup' | 'playing' | 'finished';

export const useKakuro = () => {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<KakuroPuzzle | null>(null);
  const [userGrid, setUserGrid] = useState<(number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const maxHints = 3;
  const [history, setHistory] = useState<(number | null)[][][]>([]);
  
  const addScore = useGameStore(state => state.addScore);

  useEffect(() => {
    let timer: number;
    if (phase === 'playing') {
      timer = window.setInterval(() => setElapsedTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const startGame = useCallback((diff: Difficulty) => {
    const p = getKakuroPuzzle(diff);
    setDifficulty(diff);
    setPuzzle(p);
    const initialGrid = Array(p.rows).fill(null).map(() => Array(p.cols).fill(null));
    setUserGrid(initialGrid);
    setHistory([initialGrid]);
    setPhase('playing');
    setElapsedTime(0);
    setMistakes(0);
    setHintsUsed(0);
    setSelectedCell(null);
  }, []);

  const selectCell = useCallback((r: number, c: number) => {
    if (phase !== 'playing' || !puzzle) return;
    if (puzzle.grid[r][c].type === 'white') {
      soundService.playClick();
      setSelectedCell([r, c]);
    }
  }, [phase, puzzle]);

  const inputNumber = useCallback((num: number) => {
    if (phase !== 'playing' || !puzzle || !selectedCell) return;
    const [r, c] = selectedCell;
    const cell = puzzle.grid[r][c];
    if (cell.type !== 'white') return;

    if (cell.solution !== num) {
      soundService.playWrong();
      setMistakes(m => m + 1);
    } else {
      soundService.playTilePlace();
    }

    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = num;
    setUserGrid(newGrid);
    setHistory(prev => [...prev, newGrid]);

    if (isKakuroComplete(puzzle, newGrid)) {
      soundService.playWin();
      setPhase('finished');
      const score = Math.max(0, 10000 - elapsedTime * 10 - mistakes * 500);
      addScore('kakuro', {
        gameId: 'kakuro',
        score,
        difficulty,
        date: new Date().toISOString(),
        duration: elapsedTime,
        correct: 1,
        wrong: mistakes,
      });
    }
  }, [phase, puzzle, selectedCell, userGrid, elapsedTime, mistakes, addScore, difficulty]);

  const eraseCell = useCallback(() => {
    if (phase !== 'playing' || !puzzle || !selectedCell) return;
    const [r, c] = selectedCell;
    soundService.playTileRecall();
    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = null;
    setUserGrid(newGrid);
    setHistory(prev => [...prev, newGrid]);
  }, [phase, puzzle, selectedCell, userGrid]);

  const undo = useCallback(() => {
    if (phase !== 'playing' || history.length <= 1) return;
    soundService.playTileRecall();
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setUserGrid(newHistory[newHistory.length - 1]);
  }, [phase, history]);

  const getHint = useCallback(() => {
    if (phase !== 'playing' || !puzzle || hintsUsed >= maxHints) return;
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const cell = puzzle.grid[r][c];
        if (cell.type === 'white' && userGrid[r][c] !== cell.solution) {
          const newGrid = userGrid.map(row => [...row]);
          newGrid[r][c] = cell.solution!;
          setUserGrid(newGrid);
          setHistory(prev => [...prev, newGrid]);
          setMistakes(m => m + 1); // penalize hint
          setHintsUsed(h => h + 1);
          if (isKakuroComplete(puzzle, newGrid)) {
            setPhase('finished');
            const score = Math.max(0, 10000 - elapsedTime * 10 - (mistakes + 1) * 500);
            addScore('kakuro', {
              gameId: 'kakuro',
              score,
              difficulty,
              date: new Date().toISOString(),
              duration: elapsedTime,
              correct: 1,
              wrong: mistakes + 1,
            });
          }
          return;
        }
      }
    }
  }, [phase, puzzle, userGrid, elapsedTime, mistakes, addScore, difficulty, hintsUsed, maxHints]);

  const restart = useCallback(() => {
    setPhase('setup');
  }, []);

  const getRunSum = useCallback(() => {
    if (!puzzle || !selectedCell) return null;
    const [r, c] = selectedCell;
    
    // Find row sum
    let rowStart = c;
    while (rowStart >= 0 && puzzle.grid[r][rowStart].type === 'white') rowStart--;
    const rightClue = puzzle.grid[r][rowStart]?.rightClue || 0;
    
    let currRowSum = 0;
    for (let i = rowStart + 1; i < puzzle.cols; i++) {
      if (puzzle.grid[r][i].type !== 'white') break;
      currRowSum += userGrid[r][i] || 0;
    }

    // Find col sum
    let colStart = r;
    while (colStart >= 0 && puzzle.grid[colStart][c].type === 'white') colStart--;
    const downClue = puzzle.grid[colStart][c]?.downClue || 0;
    
    let currColSum = 0;
    for (let i = colStart + 1; i < puzzle.rows; i++) {
      if (puzzle.grid[i][c].type !== 'white') break;
      currColSum += userGrid[i][c] || 0;
    }

    return { currRowSum, targetRow: rightClue, currColSum, targetCol: downClue };
  }, [puzzle, selectedCell, userGrid]);

  return {
    phase,
    difficulty,
    puzzle,
    userGrid,
    selectedCell,
    elapsedTime,
    mistakes,
    hintsUsed,
    maxHints,
    startGame,
    selectCell,
    inputNumber,
    eraseCell,
    undo,
    getHint,
    restart,
    getRunSum,
  };
};
