import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { Difficulty } from '../../types';

interface SudokuDuelProps {
  difficulty: Difficulty;
  seed: number;
  myId: string;
  myName: string;
  opponentName: string;
  isMyTurn: boolean;
  currentTurnPlayerId: string;
  lastBoardMove: { id: string; moveData: any; score: number } | null;
  onSendBoardMove: (moveData: any, newScore: number) => void;
  onScoreUpdate: (score: number, streak: number, progress?: number) => void;
  onFinish?: (finalScore: number) => void;
}

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Check valid placement for board generation
function isValid(grid: (number | null)[][], row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[startRow + r][startCol + c] === num) return false;
    }
  }
  return true;
}

// Generate deterministic solution using PRNG
function solveSudoku(grid: (number | null)[][], random: () => number): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === null) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle nums with PRNG
        for (let i = nums.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        for (const num of nums) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (solveSudoku(grid, random)) return true;
            grid[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export default function SudokuDuel({
  difficulty,
  seed,
  myId,
  opponentName,
  isMyTurn,
  currentTurnPlayerId,
  lastBoardMove,
  onSendBoardMove,
  onScoreUpdate,
  onFinish,
}: SudokuDuelProps) {
  const [solution, setSolution] = useState<number[][]>([]);
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [claimedBy, setClaimedBy] = useState<('clue' | 'me' | 'opponent')[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(20);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Initialize board from seed
  useEffect(() => {
    const random = createPrng(seed || 12345);
    const fullGrid: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    solveSudoku(fullGrid, random);

    const finalSol = fullGrid.map(row => [...row]) as number[][];
    setSolution(finalSol);

    let cluesCount = 50; // easy
    if (difficulty === 'medium') cluesCount = 44;
    if (difficulty === 'hard') cluesCount = 38;

    const initialBoard: (number | null)[][] = finalSol.map(row => [...row]);
    const initialClaims: ('clue' | 'me' | 'opponent')[][] = Array(9).fill(null).map(() => Array(9).fill('clue'));

    let cellsToRemove = 81 - cluesCount;
    while (cellsToRemove > 0) {
      const r = Math.floor(random() * 9);
      const c = Math.floor(random() * 9);
      if (initialBoard[r][c] !== null) {
        initialBoard[r][c] = null;
        initialClaims[r][c] = 'opponent'; // placeholder
        cellsToRemove--;
      }
    }

    setGrid(initialBoard);
    setClaimedBy(initialClaims);
    setScore(0);
    setSelectedCell(null);
  }, [seed, difficulty]);

  // Turn countdown
  useEffect(() => {
    setTurnTimeLeft(20);
    const timer = setInterval(() => {
      setTurnTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTurnPlayerId]);

  // Auto-pass if turn expires
  useEffect(() => {
    if (isMyTurn && turnTimeLeft === 0) {
      setFeedbackMsg('Waktu berpikir habis! Giliran beralih.');
      setTimeout(() => setFeedbackMsg(null), 1500);
      onSendBoardMove({ type: 'pass' }, score);
    }
  }, [isMyTurn, turnTimeLeft, onSendBoardMove, score]);

  // Handle incoming move from opponent
  const prevMoveRef = useRef<any>(null);
  useEffect(() => {
    if (!lastBoardMove || lastBoardMove === prevMoveRef.current) return;
    prevMoveRef.current = lastBoardMove;

    if (lastBoardMove.id !== myId && lastBoardMove.moveData) {
      const { type, r, c, val } = lastBoardMove.moveData;
      if (type === 'place' && r >= 0 && c >= 0) {
        soundService.playTilePlace();
        setGrid(prev => {
          const next = prev.map(row => [...row]);
          next[r][c] = val;
          return next;
        });
        setClaimedBy(prev => {
          const next = prev.map(row => [...row]);
          next[r][c] = 'opponent';
          return next;
        });
        setSelectedCell(prev => (prev && prev[0] === r && prev[1] === c ? null : prev));
      }
    }
  }, [lastBoardMove, myId]);

  // Check completion
  useEffect(() => {
    if (grid.length === 9) {
      const isComplete = grid.every(row => row.every(cell => cell !== null));
      if (isComplete && onFinish) {
        onFinish(score);
      }
    }
  }, [grid, score, onFinish]);

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    if (claimedBy[r]?.[c] === 'clue' || grid[r]?.[c] !== null) return;
    soundService.playClick();
    setSelectedCell([r, c]);
  };

  const handleInputNumber = useCallback((num: number) => {
    if (!isMyTurn || !selectedCell) return;
    const [r, c] = selectedCell;
    if (grid[r][c] !== null) return;

    const isCorrect = solution[r]?.[c] === num;

    if (isCorrect) {
      soundService.playTilePlace();
      soundService.playCorrect();
      const newGrid = grid.map(row => [...row]);
      newGrid[r][c] = num;

      const newClaims = claimedBy.map(row => [...row]);
      newClaims[r][c] = 'me';

      let earned = 20;

      // Bonus if completing row, col, or box
      if (newGrid[r].every(v => v !== null)) earned += 15;
      if ([0, 1, 2, 3, 4, 5, 6, 7, 8].every(i => newGrid[i][c] !== null)) earned += 15;

      const newScore = score + earned;
      setScore(newScore);
      setGrid(newGrid);
      setClaimedBy(newClaims);
      setSelectedCell(null);
      setFeedbackMsg(`Benar! +${earned} Poin 🎉`);
      setTimeout(() => setFeedbackMsg(null), 1200);

      // Progress
      const totalEmpty = claimedBy.flat().filter(c => c !== 'clue').length;
      const filled = newGrid.flat().filter((v, idx) => v !== null && claimedBy.flat()[idx] !== 'clue').length;
      const progress = Math.min(100, Math.round((filled / Math.max(1, totalEmpty)) * 100));

      onScoreUpdate(newScore, 1, progress);
      onSendBoardMove({ type: 'place', r, c, val: num }, newScore);
    } else {
      soundService.playWrong();
      const penalty = Math.max(0, score - 5);
      setScore(penalty);
      setFeedbackMsg('Salah angka! -5 Poin. Giliran berpindah.');
      setTimeout(() => setFeedbackMsg(null), 1500);

      onScoreUpdate(penalty, 0);
      onSendBoardMove({ type: 'wrong', r, c, val: num }, penalty);
      setSelectedCell(null);
    }
  }, [isMyTurn, selectedCell, grid, solution, claimedBy, score, onScoreUpdate, onSendBoardMove]);

  // Keyboard support (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleInputNumber(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputNumber]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-card shadow-card p-3 sm:p-6 border border-lavender/20 flex flex-col items-center relative overflow-hidden"
    >
      {/* Turn Banner & 20s Timer */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-lavender/15 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-pill text-xs font-black flex items-center gap-1.5 ${
              isMyTurn
                ? 'bg-mint/30 text-charcoal border border-mint animate-pulse'
                : 'bg-sky/20 text-charcoal border border-sky/40'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isMyTurn ? 'Giliran Anda!' : `Giliran ${opponentName}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-black px-3 py-1 bg-cream rounded-pill text-charcoal border border-lavender/20">
          <Clock className={`w-3.5 h-3.5 ${turnTimeLeft <= 5 ? 'text-error animate-spin' : 'text-warmgray'}`} />
          <span className={turnTimeLeft <= 5 ? 'text-error font-extrabold' : ''}>{turnTimeLeft}s</span>
        </div>
      </div>

      {/* Turn Countdown Progress Bar */}
      <div className="w-full bg-cream rounded-full h-1.5 mb-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isMyTurn
              ? turnTimeLeft <= 5
                ? 'bg-error'
                : 'bg-mint'
              : 'bg-sky'
          }`}
          style={{ width: `${(turnTimeLeft / 20) * 100}%` }}
        />
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-2 px-3 py-1 rounded-pill text-xs font-black flex items-center gap-1.5 ${
              feedbackMsg.includes('Benar')
                ? 'bg-mint/30 text-charcoal border border-mint'
                : 'bg-error/20 text-error border border-error/30'
            }`}
          >
            {feedbackMsg.includes('Benar') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9x9 Sudoku Board */}
      <div className="w-full max-w-[340px] sm:max-w-[400px] aspect-square bg-charcoal border-2 sm:border-3 border-charcoal rounded-xl overflow-hidden shadow-sm select-none my-1">
        <div className="grid grid-cols-9 grid-rows-9 w-full h-full gap-px bg-charcoal">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const claim = claimedBy[r]?.[c];
              const isClue = claim === 'clue';
              const isMe = claim === 'me';
              const isOpp = claim === 'opponent';

              const rightBorder = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-charcoal' : '';
              const bottomBorder = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-charcoal' : '';

              let bgClass = 'bg-white';
              if (isClue) bgClass = 'bg-cream/70';
              else if (isMe) bgClass = 'bg-mint/30';
              else if (isOpp) bgClass = 'bg-sky/30';
              else if (isSelected) bgClass = 'bg-lavender/40';

              let textClass = 'text-charcoal font-black';
              if (isClue) textClass = 'text-charcoal/70 font-black';
              else if (isMe) textClass = 'text-mint-900 font-black';
              else if (isOpp) textClass = 'text-sky-900 font-black';

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`flex items-center justify-center cursor-pointer transition-colors text-base sm:text-xl font-bold relative ${bgClass} ${rightBorder} ${bottomBorder} ${
                    isSelected ? 'ring-2 ring-inset ring-lavender' : ''
                  }`}
                >
                  {val !== null ? (
                    <span className={textClass}>{val}</span>
                  ) : isSelected ? (
                    <span className="text-lavender font-extrabold text-sm animate-pulse">?</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Numpad (1-9) */}
      <div className="w-full max-w-xs mt-3 flex flex-col items-center">
        <div className="text-[11px] font-bold text-warmgray mb-1.5 text-center">
          {isMyTurn
            ? selectedCell
              ? 'Pilih angka 1-9 untuk kotak terpilih:'
              : 'Klik salah satu kotak kosong di papan terlebih dahulu'
            : `Menunggu giliran ${opponentName}...`}
        </div>

        <div className="grid grid-cols-9 gap-1 sm:gap-1.5 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              disabled={!isMyTurn || !selectedCell}
              onClick={() => handleInputNumber(num)}
              className={`h-10 rounded-lg font-black text-base flex items-center justify-center transition-all shadow-sm ${
                isMyTurn && selectedCell
                  ? 'bg-charcoal text-white hover:bg-black active:scale-90'
                  : 'bg-warmgray/20 text-warmgray cursor-not-allowed opacity-60'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
