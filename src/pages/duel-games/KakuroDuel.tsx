import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { Difficulty } from '../../types';

interface KakuroDuelProps {
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

type CellType = 'block' | 'clue' | 'white';

interface KakuroCell {
  type: CellType;
  downClue?: number;
  rightClue?: number;
  solution?: number;
}

interface KakuroPuzzle {
  rows: number;
  cols: number;
  grid: KakuroCell[][];
}

const easyPuzzles: KakuroPuzzle[] = [
  {
    rows: 4,
    cols: 4,
    grid: [
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', downClue: 6 }, { type: 'clue', downClue: 11 }],
      [{ type: 'block' }, { type: 'clue', rightClue: 5, downClue: 4 }, { type: 'white', solution: 1 }, { type: 'white', solution: 4 }],
      [{ type: 'clue', rightClue: 12 }, { type: 'white', solution: 3 }, { type: 'white', solution: 2 }, { type: 'white', solution: 7 }],
      [{ type: 'clue', rightClue: 4 }, { type: 'white', solution: 1 }, { type: 'white', solution: 3 }, { type: 'block' }]
    ]
  }
];

const mediumPuzzles: KakuroPuzzle[] = [
  {
    rows: 5,
    cols: 5,
    grid: [
      [{ type: 'block' }, { type: 'clue', downClue: 11 }, { type: 'clue', downClue: 5 }, { type: 'block' }, { type: 'block' }],
      [{ type: 'clue', rightClue: 9 }, { type: 'white', solution: 8 }, { type: 'white', solution: 1 }, { type: 'clue', downClue: 17 }, { type: 'clue', downClue: 12 }],
      [{ type: 'clue', rightClue: 21 }, { type: 'white', solution: 3 }, { type: 'white', solution: 4 }, { type: 'white', solution: 9 }, { type: 'white', solution: 5 }],
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', rightClue: 12, downClue: 1 }, { type: 'white', solution: 5 }, { type: 'white', solution: 7 }],
      [{ type: 'block' }, { type: 'clue', rightClue: 4 }, { type: 'white', solution: 1 }, { type: 'white', solution: 3 }, { type: 'block' }]
    ]
  }
];

const hardPuzzles: KakuroPuzzle[] = [
  {
    rows: 6,
    cols: 6,
    grid: [
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', downClue: 17 }, { type: 'clue', downClue: 4 }, { type: 'block' }, { type: 'block' }],
      [{ type: 'block' }, { type: 'clue', rightClue: 8, downClue: 10 }, { type: 'white', solution: 5 }, { type: 'white', solution: 3 }, { type: 'clue', downClue: 25 }, { type: 'clue', downClue: 7 }],
      [{ type: 'clue', rightClue: 22 }, { type: 'white', solution: 2 }, { type: 'white', solution: 8 }, { type: 'white', solution: 1 }, { type: 'white', solution: 7 }, { type: 'white', solution: 4 }],
      [{ type: 'clue', rightClue: 12 }, { type: 'white', solution: 8 }, { type: 'white', solution: 4 }, { type: 'clue', rightClue: 12, downClue: 6 }, { type: 'white', solution: 9 }, { type: 'white', solution: 3 }],
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', rightClue: 8 }, { type: 'white', solution: 5 }, { type: 'white', solution: 3 }, { type: 'block' }],
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', rightClue: 7 }, { type: 'white', solution: 1 }, { type: 'white', solution: 6 }, { type: 'block' }]
    ]
  }
];

export default function KakuroDuel({
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
}: KakuroDuelProps) {
  const [puzzle, setPuzzle] = useState<KakuroPuzzle | null>(null);
  const [userGrid, setUserGrid] = useState<(number | null)[][]>([]);
  const [claimedBy, setClaimedBy] = useState<('none' | 'me' | 'opponent')[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(20);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Initialize deterministic puzzle from seed
  useEffect(() => {
    let list = easyPuzzles;
    if (difficulty === 'medium') list = mediumPuzzles;
    if (difficulty === 'hard') list = hardPuzzles;

    const p = list[(seed || 0) % list.length];
    setPuzzle(p);
    setUserGrid(Array.from({ length: p.rows }, () => Array(p.cols).fill(null)));
    setClaimedBy(Array.from({ length: p.rows }, () => Array(p.cols).fill('none')));
    setScore(0);
    setSelectedCell(null);
  }, [seed, difficulty]);

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
        setUserGrid(prev => {
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
    if (!puzzle) return;
    let allWhiteFilled = true;
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        if (puzzle.grid[r][c].type === 'white' && userGrid[r]?.[c] === null) {
          allWhiteFilled = false;
          break;
        }
      }
    }
    if (allWhiteFilled && userGrid.length > 0 && onFinish) {
      onFinish(score);
    }
  }, [userGrid, puzzle, score, onFinish]);

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn || !puzzle) return;
    if (puzzle.grid[r][c].type !== 'white' || userGrid[r][c] !== null) return;
    soundService.playClick();
    setSelectedCell([r, c]);
  };

  const handleInputNumber = useCallback((num: number) => {
    if (!isMyTurn || !selectedCell || !puzzle) return;
    const [r, c] = selectedCell;
    const cell = puzzle.grid[r][c];
    if (cell.type !== 'white' || userGrid[r][c] !== null) return;

    const isCorrect = cell.solution === num;

    if (isCorrect) {
      soundService.playTilePlace();
      soundService.playCorrect();
      const newGrid = userGrid.map(row => [...row]);
      newGrid[r][c] = num;

      const newClaims = claimedBy.map(row => [...row]);
      newClaims[r][c] = 'me';

      let earned = 20;

      // Check horizontal or vertical completion
      let hFull = true;
      let cIdx = c - 1;
      while (cIdx >= 0 && puzzle.grid[r][cIdx].type === 'white') {
        if (newGrid[r][cIdx] === null) hFull = false;
        cIdx--;
      }
      cIdx = c + 1;
      while (cIdx < puzzle.cols && puzzle.grid[r][cIdx].type === 'white') {
        if (newGrid[r][cIdx] === null) hFull = false;
        cIdx++;
      }
      if (hFull) earned += 15;

      const newScore = score + earned;
      setScore(newScore);
      setUserGrid(newGrid);
      setClaimedBy(newClaims);
      setSelectedCell(null);
      setFeedbackMsg(`Benar! +${earned} Poin 🎉`);
      setTimeout(() => setFeedbackMsg(null), 1200);

      // Calculate progress
      let totalWhite = 0;
      let filledWhite = 0;
      for (let i = 0; i < puzzle.rows; i++) {
        for (let j = 0; j < puzzle.cols; j++) {
          if (puzzle.grid[i][j].type === 'white') {
            totalWhite++;
            if (newGrid[i][j] !== null) filledWhite++;
          }
        }
      }
      const progress = Math.min(100, Math.round((filledWhite / Math.max(1, totalWhite)) * 100));

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
  }, [isMyTurn, selectedCell, puzzle, userGrid, claimedBy, score, onScoreUpdate, onSendBoardMove]);

  if (!puzzle) return null;

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

      {/* Kakuro Board */}
      <div
        className="grid gap-1 bg-charcoal p-2 rounded-2xl border-3 border-charcoal shadow-sm select-none my-2"
        style={{
          gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
          maxWidth: '360px',
        }}
      >
        {puzzle.grid.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const val = userGrid[r]?.[c];
            const claim = claimedBy[r]?.[c];
            const isMe = claim === 'me';
            const isOpp = claim === 'opponent';

            if (cell.type === 'block') {
              return (
                <div
                  key={`${r}-${c}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-charcoal/90 rounded-lg"
                />
              );
            }

            if (cell.type === 'clue') {
              return (
                <div
                  key={`${r}-${c}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-[#3d4547] text-white rounded-lg relative overflow-hidden text-[10px] sm:text-xs font-bold font-mono"
                >
                  {/* Diagonal Line */}
                  <div className="absolute inset-0 border-t border-white/20 transform rotate-45 origin-top-left scale-150" />
                  {/* Down Clue */}
                  {cell.downClue && (
                    <div className="absolute bottom-1 left-1.5 text-[#FFE5A0]">
                      {cell.downClue}
                    </div>
                  )}
                  {/* Right Clue */}
                  {cell.rightClue && (
                    <div className="absolute top-1 right-1.5 text-[#A8D8EA]">
                      {cell.rightClue}
                    </div>
                  )}
                </div>
              );
            }

            // White Cell
            let bgClass = 'bg-white';
            if (isMe) bgClass = 'bg-mint/30';
            else if (isOpp) bgClass = 'bg-sky/30';
            else if (isSelected) bgClass = 'bg-lavender/40';

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-xl sm:text-2xl font-black relative ${bgClass} ${
                  isSelected ? 'ring-2 ring-inset ring-mint' : ''
                }`}
              >
                {val !== null ? (
                  <span className={isMe ? 'text-mint-900' : isOpp ? 'text-sky-900' : 'text-charcoal'}>
                    {val}
                  </span>
                ) : isSelected ? (
                  <span className="text-mint font-black text-sm animate-pulse">?</span>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Number Palette (1-9) */}
      <div className="w-full max-w-xs mt-3 flex flex-col items-center">
        <div className="text-[11px] font-bold text-warmgray mb-1.5 text-center">
          {isMyTurn
            ? selectedCell
              ? 'Pilih angka 1-9 untuk kotak terpilih:'
              : 'Klik salah satu kotak putih kosong terlebih dahulu'
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
