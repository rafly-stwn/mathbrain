import { useState, useEffect, useCallback } from 'react';
import type { Difficulty } from '../../types';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';
import { generateSudoku } from './sudokuGenerator';

type Grid = (number | null)[][];
type Notes = boolean[][][]; // notes[r][c][1..9] -> boolean (0 index is ignored)
type HistoryState = { grid: Grid; notes: Notes };

export const useSudoku = () => {
  const { addScore } = useGameStore();

  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [grid, setGrid] = useState<Grid>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [initialClues, setInitialClues] = useState<boolean[][]>(Array(9).fill(null).map(() => Array(9).fill(false)));
  const [solution, setSolution] = useState<number[][]>(Array(9).fill(null).map(() => Array(9).fill(0)));
  const [notes, setNotes] = useState<Notes>(Array(9).fill(null).map(() => Array(9).fill(null).map(() => Array(10).fill(false))));
  
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const maxMistakes = 3;
  const maxHints = 3;
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [history, setHistory] = useState<HistoryState[]>([]);

  // Timer
  useEffect(() => {
    let timer: number;
    if (phase === 'playing') {
      timer = window.setInterval(() => setElapsedTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const deepCloneGrid = (g: Grid): Grid => g.map(row => [...row]);
  const deepCloneNotes = (n: Notes): Notes => n.map(row => row.map(cell => [...cell]));

  const saveHistory = useCallback((newGrid: Grid, newNotes: Notes) => {
    setHistory(prev => [...prev, { grid: deepCloneGrid(newGrid), notes: deepCloneNotes(newNotes) }]);
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    const { initialGrid, solution: sol } = generateSudoku(diff);
    setDifficulty(diff);
    setSolution(sol);
    setGrid(initialGrid);
    setInitialClues(initialGrid.map(row => row.map(cell => cell !== null)));
    setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => Array(10).fill(false))));
    setSelectedCell(null);
    setIsNotesMode(false);
    setMistakes(0);
    setHintsUsed(0);
    setElapsedTime(0);
    setHistory([]);
    setPhase('playing');
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    if (phase !== 'playing') return;
    soundService.playClick();
    setSelectedCell([row, col]);
  }, [phase]);

  const toggleNotesMode = useCallback(() => {
    soundService.playClick();
    setIsNotesMode(prev => !prev);
  }, []);

  const checkWinCondition = useCallback((currentGrid: Grid) => {
    // Check if grid is full and matches solution
    let isComplete = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] !== solution[r][c]) {
          isComplete = false;
          break;
        }
      }
    }
    if (isComplete) {
      soundService.playWin();
      setPhase('finished');
      const timePenalty = elapsedTime * 2;
      const mistakePenalty = mistakes * 100;
      const hintPenalty = hintsUsed * 50;
      const finalScore = Math.max(100, 1000 - timePenalty - mistakePenalty - hintPenalty);
      
      addScore('sudoku', {
        gameId: 'sudoku',
        score: finalScore,
        difficulty,
        date: new Date().toISOString(),
        duration: elapsedTime,
        correct: 81 - mistakes, // Rough proxy
        wrong: mistakes
      });
    }
  }, [solution, elapsedTime, mistakes, hintsUsed, difficulty, addScore]);

  const inputNumber = useCallback((num: number) => {
    if (phase !== 'playing' || !selectedCell) return;
    const [r, c] = selectedCell;
    if (initialClues[r][c]) return; // Cannot edit initial clues

    const currentCellVal = grid[r][c];

    if (isNotesMode) {
      if (currentCellVal !== null) return; // Can't add notes if cell is filled
      soundService.playClick();
      const newNotes = deepCloneNotes(notes);
      newNotes[r][c][num] = !newNotes[r][c][num];
      saveHistory(grid, notes);
      setNotes(newNotes);
    } else {
      // Normal mode
      if (currentCellVal === num) return; // Same number, do nothing

      if (solution[r][c] !== num) {
        // Wrong number
        soundService.playWrong();
        setMistakes(m => {
          const newMistakes = m + 1;
          if (newMistakes >= maxMistakes) {
            setPhase('finished');
          }
          return newMistakes;
        });
        // Still place it as a mistake feedback
      } else {
        soundService.playTilePlace();
      }

      const newGrid = deepCloneGrid(grid);
      const newNotes = deepCloneNotes(notes);

      newGrid[r][c] = num;

      // Auto-clear notes in row, col, subgrid if correct
      if (solution[r][c] === num) {
        for (let i = 0; i < 9; i++) {
          newNotes[r][i][num] = false;
          newNotes[i][c][num] = false;
        }
        const startRow = Math.floor(r / 3) * 3;
        const startCol = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            newNotes[startRow + i][startCol + j][num] = false;
          }
        }
      }

      saveHistory(grid, notes);
      setGrid(newGrid);
      setNotes(newNotes);
      checkWinCondition(newGrid);
    }
  }, [phase, selectedCell, initialClues, grid, isNotesMode, notes, solution, saveHistory, checkWinCondition, maxMistakes]);

  const eraseCell = useCallback(() => {
    if (phase !== 'playing' || !selectedCell) return;
    const [r, c] = selectedCell;
    if (initialClues[r][c]) return;

    if (grid[r][c] !== null) {
      soundService.playTileRecall();
      const newGrid = deepCloneGrid(grid);
      newGrid[r][c] = null;
      saveHistory(grid, notes);
      setGrid(newGrid);
    } else {
      // Clear notes if cell is empty
      let hasNotes = false;
      for (let i = 1; i <= 9; i++) {
        if (notes[r][c][i]) hasNotes = true;
      }
      if (hasNotes) {
        const newNotes = deepCloneNotes(notes);
        for (let i = 1; i <= 9; i++) newNotes[r][c][i] = false;
        saveHistory(grid, notes);
        setNotes(newNotes);
      }
    }
  }, [phase, selectedCell, initialClues, grid, notes, saveHistory]);

  const undo = useCallback(() => {
    if (phase !== 'playing' || history.length === 0) return;
    const prevState = history[history.length - 1];
    setGrid(prevState.grid);
    setNotes(prevState.notes);
    setHistory(prev => prev.slice(0, -1));
  }, [phase, history]);

  const getHint = useCallback(() => {
    if (phase !== 'playing' || hintsUsed >= maxHints) return;
    
    // Find empty or wrong cells
    const availableCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== solution[r][c]) {
          availableCells.push([r, c]);
        }
      }
    }

    if (availableCells.length === 0) return;

    const [hr, hc] = availableCells[Math.floor(Math.random() * availableCells.length)];
    const correctNum = solution[hr][hc];

    const newGrid = deepCloneGrid(grid);
    const newNotes = deepCloneNotes(notes);
    newGrid[hr][hc] = correctNum;

    // Clear notes for hint
    for (let i = 0; i < 9; i++) {
      newNotes[hr][i][correctNum] = false;
      newNotes[i][hc][correctNum] = false;
    }
    const startRow = Math.floor(hr / 3) * 3;
    const startCol = Math.floor(hc / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        newNotes[startRow + i][startCol + j][correctNum] = false;
      }
    }

    saveHistory(grid, notes);
    setGrid(newGrid);
    setNotes(newNotes);
    setHintsUsed(h => h + 1);
    checkWinCondition(newGrid);
  }, [phase, hintsUsed, grid, solution, notes, saveHistory, checkWinCondition]);

  const restart = useCallback(() => {
    startGame(difficulty);
  }, [startGame, difficulty]);

  return {
    phase,
    setPhase,
    difficulty,
    grid,
    initialClues,
    solution,
    notes,
    selectedCell,
    isNotesMode,
    mistakes,
    maxMistakes,
    elapsedTime,
    hintsUsed,
    maxHints,
    historyLength: history.length,
    startGame,
    selectCell,
    inputNumber,
    eraseCell,
    toggleNotesMode,
    undo,
    getHint,
    restart
  };
};
