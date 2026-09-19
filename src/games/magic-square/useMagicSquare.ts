import { useState, useEffect, useCallback } from 'react';
import type { Difficulty } from '../../types';
import { soundService } from '../../services/soundService';

interface MagicSquareState {
  phase: 'setup' | 'playing' | 'finished';
  difficulty: Difficulty;
  gridSize: number;
  magicNumber: number;
  solution: number[][];
  grid: (number | null)[][];
  clues: boolean[][];
  selectedCell: [number, number] | null;
  availableNumbers: number[];
  elapsedTime: number;
  errors: number;
  hintsUsed: number;
}

const SOLUTIONS_3X3 = [
  [[8, 1, 6], [3, 5, 7], [4, 9, 2]],
  [[6, 1, 8], [7, 5, 3], [2, 9, 4]],
  [[4, 3, 8], [9, 5, 1], [2, 7, 6]],
  [[2, 7, 6], [9, 5, 1], [4, 3, 8]],
  [[6, 7, 2], [1, 5, 9], [8, 3, 4]],
  [[8, 3, 4], [1, 5, 9], [6, 7, 2]],
  [[2, 9, 4], [7, 5, 3], [6, 1, 8]],
  [[4, 9, 2], [3, 5, 7], [8, 1, 6]]
];

const SOLUTION_4X4 = [
  [16, 3, 2, 13],
  [5, 10, 11, 8],
  [9, 6, 7, 12],
  [4, 15, 14, 1]
];

const generatePuzzle = (difficulty: Difficulty) => {
  let gridSize = 3;
  let magicNumber = 15;
  let solution: number[][] = [];
  let cluesToKeep = 5; // easy

  if (difficulty === 'easy') {
    solution = SOLUTIONS_3X3[Math.floor(Math.random() * SOLUTIONS_3X3.length)];
    cluesToKeep = 5;
  } else if (difficulty === 'medium') {
    solution = SOLUTIONS_3X3[Math.floor(Math.random() * SOLUTIONS_3X3.length)];
    cluesToKeep = 3;
  } else if (difficulty === 'hard') {
    gridSize = 4;
    magicNumber = 34;
    solution = SOLUTION_4X4;
    cluesToKeep = 7; // remove 9 numbers
  }

  const grid: (number | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  const clues: boolean[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
  
  const allPositions = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      allPositions.push({ r, c });
    }
  }

  // Shuffle positions
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  const cluePositions = allPositions.slice(0, cluesToKeep);
  let availableNumbers: number[] = [];
  for (let i = 1; i <= gridSize * gridSize; i++) {
    availableNumbers.push(i);
  }

  cluePositions.forEach(({ r, c }) => {
    const val = solution[r][c];
    grid[r][c] = val;
    clues[r][c] = true;
    availableNumbers = availableNumbers.filter(n => n !== val);
  });

  return {
    gridSize,
    magicNumber,
    solution,
    grid,
    clues,
    availableNumbers: availableNumbers.sort((a, b) => a - b)
  };
};

export const useMagicSquare = () => {
  const [state, setState] = useState<MagicSquareState>({
    phase: 'setup',
    difficulty: 'easy',
    gridSize: 3,
    magicNumber: 15,
    solution: [],
    grid: [],
    clues: [],
    selectedCell: null,
    availableNumbers: [],
    elapsedTime: 0,
    errors: 0,
    hintsUsed: 0
  });

  // Timer
  useEffect(() => {
    let timer: number;
    if (state.phase === 'playing') {
      timer = window.setInterval(() => {
        setState(s => ({ ...s, elapsedTime: s.elapsedTime + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.phase]);

  const startGame = useCallback((difficulty: Difficulty) => {
    const puzzle = generatePuzzle(difficulty);
    setState({
      phase: 'playing',
      difficulty,
      ...puzzle,
      selectedCell: null,
      elapsedTime: 0,
      errors: 0,
      hintsUsed: 0
    });
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    if (state.phase !== 'playing' || state.clues[row][col]) return;
    soundService.playClick();
    setState(s => ({ ...s, selectedCell: [row, col] }));
  }, [state.phase, state.clues]);

  const placeNumber = useCallback((num: number) => {
    if (state.phase !== 'playing' || !state.selectedCell) return;
    const [r, c] = state.selectedCell;

    if (state.solution[r][c] === num) {
      // Correct
      soundService.playTilePlace();
      const newGrid = state.grid.map(row => [...row]);
      newGrid[r][c] = num;
      
      const newAvailable = state.availableNumbers.filter(n => n !== num);
      
      let isComplete = true;
      for (let i = 0; i < state.gridSize; i++) {
        for (let j = 0; j < state.gridSize; j++) {
          if (newGrid[i][j] === null) isComplete = false;
        }
      }

      if (isComplete) {
        soundService.playWin();
      }

      setState(s => ({
        ...s,
        grid: newGrid,
        availableNumbers: newAvailable,
        selectedCell: null,
        phase: isComplete ? 'finished' : 'playing'
      }));
    } else {
      // Wrong
      soundService.playWrong();
      setState(s => ({ ...s, errors: s.errors + 1 }));
    }
  }, [state]);

  const removeNumber = useCallback((row: number, col: number) => {
    if (state.phase !== 'playing' || state.clues[row][col]) return;
    const val = state.grid[row][col];
    if (val === null) return;

    soundService.playTileRecall();
    const newGrid = state.grid.map(r => [...r]);
    newGrid[row][col] = null;

    setState(s => ({
      ...s,
      grid: newGrid,
      availableNumbers: [...s.availableNumbers, val].sort((a, b) => a - b),
    }));
  }, [state.phase, state.clues, state.grid]);

  const getRowSum = useCallback((row: number) => {
    let sum = 0;
    let complete = true;
    for (let c = 0; c < state.gridSize; c++) {
      if (state.grid[row][c] === null) complete = false;
      else sum += state.grid[row][c] as number;
    }
    return { sum, complete };
  }, [state.grid, state.gridSize]);

  const getColSum = useCallback((col: number) => {
    let sum = 0;
    let complete = true;
    for (let r = 0; r < state.gridSize; r++) {
      if (state.grid[r][col] === null) complete = false;
      else sum += state.grid[r][col] as number;
    }
    return { sum, complete };
  }, [state.grid, state.gridSize]);

  const getDiagSum = useCallback((type: 'main' | 'anti') => {
    let sum = 0;
    let complete = true;
    for (let i = 0; i < state.gridSize; i++) {
      const c = type === 'main' ? i : state.gridSize - 1 - i;
      if (state.grid[i][c] === null) complete = false;
      else sum += state.grid[i][c] as number;
    }
    return { sum, complete };
  }, [state.grid, state.gridSize]);

  const playAgain = useCallback(() => {
    setState(s => ({ ...s, phase: 'setup' }));
  }, []);

  return {
    state,
    startGame,
    selectCell,
    placeNumber,
    removeNumber,
    getRowSum,
    getColSum,
    getDiagSum,
    playAgain
  };
};
