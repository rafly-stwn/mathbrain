import { useState, useEffect, useCallback } from 'react';
import type { Difficulty } from '../../types';
import { generateKenKen, isPuzzleSolved, isCageValid } from './kenkenGenerator';
import type { KenKenPuzzle } from './kenkenGenerator';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';

export type GamePhase = 'setup' | 'playing' | 'finished';

export function useKenKen() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<KenKenPuzzle | null>(null);
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
      timer = window.setInterval(() => {
        setElapsedTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const startGame = useCallback((diff: Difficulty) => {
    const newPuzzle = generateKenKen(diff);
    setDifficulty(diff);
    setPuzzle(newPuzzle);
    
    const initialGrid = Array.from({ length: newPuzzle.size }, () => Array(newPuzzle.size).fill(null));
    setUserGrid(initialGrid);
    setHistory([initialGrid]);
    setSelectedCell(null);
    setElapsedTime(0);
    setMistakes(0);
    setHintsUsed(0);
    setPhase('playing');
  }, []);

  const selectCell = useCallback((r: number, c: number) => {
    if (phase !== 'playing') return;
    soundService.playClick();
    setSelectedCell([r, c]);
  }, [phase]);

  const pushHistory = useCallback((newGrid: (number | null)[][]) => {
    setHistory(prev => [...prev, newGrid]);
  }, []);

  const inputNumber = useCallback((num: number) => {
    if (phase !== 'playing' || !selectedCell || !puzzle) return;
    const [r, c] = selectedCell;

    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = num;

    // Check for obvious mistakes (duplicates in row/col)
    let isMistake = false;
    for (let i = 0; i < puzzle.size; i++) {
      if (i !== c && newGrid[r][i] === num) isMistake = true;
      if (i !== r && newGrid[i][c] === num) isMistake = true;
    }

    // Check cage validity if fully filled
    const cage = puzzle.cages.find(cg => cg.cells.some(([cr, cc]) => cr === r && cc === c));
    if (cage) {
      if (!isCageValid(cage, newGrid)) {
         // if all cells in cage are filled and it's invalid, it's a mistake
         const allFilled = cage.cells.every(([cr, cc]) => newGrid[cr][cc] !== null);
         if (allFilled) isMistake = true;
      }
    }

    if (isMistake) {
      soundService.playWrong();
      setMistakes(m => m + 1);
    } else {
      soundService.playTilePlace();
    }

    setUserGrid(newGrid);
    pushHistory(newGrid);

    if (isPuzzleSolved(puzzle, newGrid)) {
      soundService.playWin();
      setPhase('finished');
      // Calculate score based on difficulty and performance
      let baseScore = 1000;
      if (difficulty === 'medium') baseScore = 2000;
      if (difficulty === 'hard') baseScore = 3000;
      
      const timePenalty = elapsedTime * 2;
      const mistakePenalty = mistakes * 50;
      const finalScore = Math.max(100, baseScore - timePenalty - mistakePenalty);

      addScore('kenken', {
        gameId: 'kenken',
        score: finalScore,
        difficulty,
        date: new Date().toISOString(),
        duration: elapsedTime,
        correct: puzzle.size * puzzle.size,
        wrong: mistakes
      });
    }
  }, [phase, selectedCell, puzzle, userGrid, pushHistory, elapsedTime, mistakes, difficulty, addScore]);

  const eraseCell = useCallback(() => {
    if (phase !== 'playing' || !selectedCell) return;
    const [r, c] = selectedCell;
    if (userGrid[r][c] === null) return;

    soundService.playTileRecall();
    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = null;
    setUserGrid(newGrid);
    pushHistory(newGrid);
  }, [phase, selectedCell, userGrid, pushHistory]);

  const undo = useCallback(() => {
    if (phase !== 'playing' || history.length <= 1) return;
    soundService.playTileRecall();
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setUserGrid(newHistory[newHistory.length - 1]);
  }, [phase, history]);

  const getHint = useCallback(() => {
    if (phase !== 'playing' || !puzzle || hintsUsed >= maxHints) return;
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (userGrid[r][c] === null) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (emptyCells.length === 0) return;

    const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const correctValue = puzzle.grid[r][c];

    const newGrid = userGrid.map(row => [...row]);
    newGrid[r][c] = correctValue;
    setUserGrid(newGrid);
    pushHistory(newGrid);
    setSelectedCell([r, c]);
    setHintsUsed(h => h + 1);
    
    // Check win condition for hint
    if (isPuzzleSolved(puzzle, newGrid)) {
       setPhase('finished');
    }
  }, [phase, puzzle, userGrid, pushHistory, hintsUsed, maxHints]);

  const restart = useCallback(() => {
    setPhase('setup');
  }, []);

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
    history,
    startGame,
    selectCell,
    inputNumber,
    eraseCell,
    undo,
    getHint,
    restart,
    setPhase
  };
}
