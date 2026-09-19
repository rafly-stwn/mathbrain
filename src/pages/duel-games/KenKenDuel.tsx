import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { Difficulty } from '../../types';

interface KenKenDuelProps {
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

type Operator = '+' | '-' | '×' | '÷' | '';

interface Cage {
  id: number;
  cells: [number, number][];
  target: number;
  op: Operator;
}

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateKenKenPuzzle(size: number, random: () => number) {
  // Generate valid Latin square
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < size; i++) {
      if (grid[r][i] === num) return false;
      if (grid[i][c] === num) return false;
    }
    return true;
  }

  function solve(r: number, c: number): boolean {
    if (r === size) return true;
    if (c === size) return solve(r + 1, 0);

    const nums = Array.from({ length: size }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    for (const num of nums) {
      if (isValid(r, c, num)) {
        grid[r][c] = num;
        if (solve(r, c + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  solve(0, 0);

  // Form cages
  const cages: Cage[] = [];
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  let cageId = 0;
  const ops: Operator[] = ['+', '-', '×'];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c]) continue;

      const cageSize = Math.floor(random() * 2) + 1; // 1 or 2 cells
      const cells: [number, number][] = [[r, c]];
      visited[r][c] = true;

      if (cageSize === 2) {
        const directions = [[0, 1], [1, 0]];
        for (const [dr, dc] of directions) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < size && nc < size && !visited[nr][nc]) {
            cells.push([nr, nc]);
            visited[nr][nc] = true;
            break;
          }
        }
      }

      const values = cells.map(([cr, cc]) => grid[cr][cc]);
      let target = values[0];
      let op: Operator = '';

      if (cells.length === 2) {
        const [a, b] = [Math.max(values[0], values[1]), Math.min(values[0], values[1])];
        op = ops[Math.floor(random() * ops.length)];
        if (op === '+') target = a + b;
        else if (op === '-') target = a - b;
        else if (op === '×') target = a * b;
      }

      cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

      cages.push({
        id: cageId++,
        cells,
        target,
        op
      });
    }
  }

  return { size, grid, cages };
}

export default function KenKenDuel({
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
}: KenKenDuelProps) {
  const size = difficulty === 'hard' ? 5 : 4;
  const [solution, setSolution] = useState<number[][]>([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [claimedBy, setClaimedBy] = useState<('none' | 'me' | 'opponent')[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(20);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Initialize KenKen puzzle using seed
  useEffect(() => {
    const random = createPrng(seed || 7777);
    const puzzle = generateKenKenPuzzle(size, random);

    setSolution(puzzle.grid);
    setCages(puzzle.cages);
    setGrid(Array.from({ length: size }, () => Array(size).fill(null)));
    setClaimedBy(Array.from({ length: size }, () => Array(size).fill('none')));
    setScore(0);
    setSelectedCell(null);
  }, [seed, size]);

  // Turn timer countdown (20 seconds)
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

  // Auto pass if time expires
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
    if (grid.length === size && grid.length > 0) {
      const isComplete = grid.every(row => row.every(cell => cell !== null));
      if (isComplete && onFinish) {
        onFinish(score);
      }
    }
  }, [grid, size, score, onFinish]);

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    if (grid[r]?.[c] !== null) return;
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

      // Check if cage is completed
      const cage = cages.find(cg => cg.cells.some(([cr, cc]) => cr === r && cc === c));
      if (cage && cage.cells.every(([cr, cc]) => newGrid[cr][cc] !== null)) {
        earned += 20; // Cage completion bonus!
      }

      const newScore = score + earned;
      setScore(newScore);
      setGrid(newGrid);
      setClaimedBy(newClaims);
      setSelectedCell(null);
      setFeedbackMsg(`Benar! +${earned} Poin 🎉`);
      setTimeout(() => setFeedbackMsg(null), 1200);

      // Progress
      const totalCells = size * size;
      const filledCells = newGrid.flat().filter(v => v !== null).length;
      const progress = Math.min(100, Math.round((filledCells / totalCells) * 100));

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
  }, [isMyTurn, selectedCell, grid, solution, claimedBy, score, cages, size, onScoreUpdate, onSendBoardMove]);

  // Find cage info for a cell (target label on top-left of cage)
  const getCageLabel = (r: number, c: number) => {
    const cage = cages.find(cg => cg.cells[0][0] === r && cg.cells[0][1] === c);
    if (!cage) return null;
    return `${cage.target}${cage.op}`;
  };

  // Helper to determine border styling based on cage boundaries
  const getCageBorders = (r: number, c: number) => {
    const myCage = cages.find(cg => cg.cells.some(([cr, cc]) => cr === r && cc === c));
    if (!myCage) return '';

    const hasTop = myCage.cells.some(([cr, cc]) => cr === r - 1 && cc === c);
    const hasBottom = myCage.cells.some(([cr, cc]) => cr === r + 1 && cc === c);
    const hasLeft = myCage.cells.some(([cr, cc]) => cr === r && cc === c - 1);
    const hasRight = myCage.cells.some(([cr, cc]) => cr === r && cc === c + 1);

    return `
      ${!hasTop ? 'border-t-2 border-t-charcoal' : 'border-t border-t-warmgray/20'}
      ${!hasBottom ? 'border-b-2 border-b-charcoal' : 'border-b border-b-warmgray/20'}
      ${!hasLeft ? 'border-l-2 border-l-charcoal' : 'border-l border-l-warmgray/20'}
      ${!hasRight ? 'border-r-2 border-r-charcoal' : 'border-r border-r-warmgray/20'}
    `;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-card shadow-card p-4 sm:p-6 border border-lavender/20 flex flex-col items-center relative overflow-hidden"
    >
      {/* Turn Banner & 20s Timer */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-lavender/15 mb-3">
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

      {/* KenKen Board */}
      <div
        className="grid gap-0 bg-white border-3 border-charcoal rounded-xl overflow-hidden shadow-sm select-none my-2"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          width: size === 5 ? '320px' : '280px',
          height: size === 5 ? '320px' : '280px',
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const claim = claimedBy[r]?.[c];
            const isMe = claim === 'me';
            const isOpp = claim === 'opponent';
            const cageLabel = getCageLabel(r, c);
            const borders = getCageBorders(r, c);

            let bgClass = 'bg-white';
            if (isMe) bgClass = 'bg-mint/30';
            else if (isOpp) bgClass = 'bg-sky/30';
            else if (isSelected) bgClass = 'bg-lavender/30';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${borders} ${bgClass} ${
                  isSelected ? 'ring-2 ring-inset ring-mint' : ''
                }`}
              >
                {/* Cage target label */}
                {cageLabel && (
                  <span className="absolute top-1 left-1.5 text-[11px] font-black text-charcoal/70 leading-none">
                    {cageLabel}
                  </span>
                )}

                {/* Digit */}
                {val !== null ? (
                  <span className={`text-2xl font-black ${isMe ? 'text-mint-900' : isOpp ? 'text-sky-900' : 'text-charcoal'}`}>
                    {val}
                  </span>
                ) : isSelected ? (
                  <span className="text-mint font-black text-lg animate-pulse">?</span>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Number Buttons (1..size) */}
      <div className="w-full max-w-xs mt-3 flex flex-col items-center">
        <div className="text-[11px] font-bold text-warmgray mb-1.5 text-center">
          {isMyTurn
            ? selectedCell
              ? `Pilih angka (1-${size}) untuk kotak terpilih:`
              : 'Klik kotak kosong pada sangkar terlebih dahulu'
            : `Menunggu giliran ${opponentName}...`}
        </div>

        <div className="flex justify-center gap-2">
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              type="button"
              disabled={!isMyTurn || !selectedCell}
              onClick={() => handleInputNumber(num)}
              className={`w-12 h-12 rounded-xl font-black text-xl flex items-center justify-center transition-all shadow-sm ${
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
