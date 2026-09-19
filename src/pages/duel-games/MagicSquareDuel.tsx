import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { Difficulty } from '../../types';

interface MagicSquareDuelProps {
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

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function MagicSquareDuel({
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
}: MagicSquareDuelProps) {
  const magicNumber = 15;

  const [solution, setSolution] = useState<number[][]>([]);
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [claimedBy, setClaimedBy] = useState<('clue' | 'me' | 'opponent')[][]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(20);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Initialize board deterministically using seed
  useEffect(() => {
    const random = createPrng(seed || 5555);
    const solIdx = Math.floor(random() * SOLUTIONS_3X3.length);
    const chosenSol = SOLUTIONS_3X3[solIdx];
    setSolution(chosenSol);

    let cluesCount = 4;
    if (difficulty === 'medium') cluesCount = 3;
    if (difficulty === 'hard') cluesCount = 2;

    const allPositions: { r: number; c: number }[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        allPositions.push({ r, c });
      }
    }

    // Seeded shuffle
    for (let i = allPositions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
    }

    const clueCoords = allPositions.slice(0, cluesCount);

    const initialGrid: (number | null)[][] = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    const initialClaims: ('clue' | 'me' | 'opponent')[][] = [
      ['me', 'me', 'me'],
      ['me', 'me', 'me'],
      ['me', 'me', 'me'],
    ];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        initialClaims[r][c] = 'opponent'; // placeholder
      }
    }

    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const usedNums = new Set<number>();

    clueCoords.forEach(({ r, c }) => {
      const val = chosenSol[r][c];
      initialGrid[r][c] = val;
      initialClaims[r][c] = 'clue';
      usedNums.add(val);
    });

    setGrid(initialGrid);
    setClaimedBy(initialClaims);
    setAvailableNumbers(nums.filter(n => !usedNums.has(n)));
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

  // Auto-pass if 20 seconds expire on your turn
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
        setAvailableNumbers(prev => prev.filter(n => n !== val));
        setSelectedCell(prev => (prev && prev[0] === r && prev[1] === c ? null : prev));
      }
    }
  }, [lastBoardMove, myId]);

  // Check completion
  useEffect(() => {
    if (grid.length === 3) {
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

  const handlePickNumber = (num: number) => {
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

      const newAvail = availableNumbers.filter(n => n !== num);

      // Points: +25 for claiming cell
      let earned = 25;

      // Check if completing a line sum to 15
      const rowFull = newGrid[r].every(v => v !== null);
      if (rowFull && newGrid[r].reduce((a, b) => (a || 0) + (b || 0), 0) === 15) {
        earned += 15;
      }
      const colFull = [0, 1, 2].every(i => newGrid[i][c] !== null);
      if (colFull && (newGrid[0][c]! + newGrid[1][c]! + newGrid[2][c]!) === 15) {
        earned += 15;
      }

      const newScore = score + earned;
      setScore(newScore);
      setGrid(newGrid);
      setClaimedBy(newClaims);
      setAvailableNumbers(newAvail);
      setSelectedCell(null);
      setFeedbackMsg(`Benar! +${earned} Poin 🎉`);
      setTimeout(() => setFeedbackMsg(null), 1200);

      // Progress percentage
      const totalCellsToFill = 9 - claimedBy.flat().filter(c => c === 'clue').length;
      const filledCells = newGrid.flat().filter(v => v !== null).length - (9 - totalCellsToFill);
      const progress = Math.min(100, Math.round((filledCells / totalCellsToFill) * 100));

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
  };

  // Row and column sums for indicators
  const getRowSum = (r: number) => {
    let sum = 0;
    for (let c = 0; c < 3; c++) {
      if (grid[r]?.[c] !== null) sum += grid[r][c]!;
    }
    return sum;
  };

  const getColSum = (c: number) => {
    let sum = 0;
    for (let r = 0; r < 3; r++) {
      if (grid[r]?.[c] !== null) sum += grid[r][c]!;
    }
    return sum;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-card shadow-card p-4 sm:p-6 border border-lavender/20 flex flex-col items-center relative overflow-hidden"
    >
      {/* Turn Banner & 20s Timer */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-lavender/15 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-pill text-xs font-black flex items-center gap-1.5 ${
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
      <div className="w-full bg-cream rounded-full h-1.5 mb-4 overflow-hidden">
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

      {/* Rules clue */}
      <div className="text-xs text-warmgray text-center mb-3">
        Target Jumlah Setiap Baris & Kolom: <strong className="text-charcoal font-black">{magicNumber}</strong>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-3 px-3 py-1.5 rounded-pill text-xs font-black flex items-center gap-1.5 ${
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

      {/* 3x3 Magic Square Board */}
      <div className="relative p-2 bg-cream/50 rounded-2xl border-2 border-lavender/30 my-2">
        <div className="grid grid-cols-3 gap-2.5">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const claim = claimedBy[r]?.[c];
              const isClue = claim === 'clue';
              const isMe = claim === 'me';
              const isOpp = claim === 'opponent';

              return (
                <motion.div
                  key={`${r}-${c}`}
                  whileHover={isMyTurn && !isClue && val === null ? { scale: 1.05 } : {}}
                  whileTap={isMyTurn && !isClue && val === null ? { scale: 0.95 } : {}}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex flex-col items-center justify-center font-black text-2xl sm:text-3xl transition-all cursor-pointer select-none relative shadow-sm ${
                    isClue
                      ? 'bg-cream text-warmgray border-2 border-dashed border-lavender/40 cursor-default'
                      : isMe
                      ? 'bg-mint/30 border-2 border-mint text-charcoal shadow-inner'
                      : isOpp
                      ? 'bg-sky/30 border-2 border-sky text-charcoal shadow-inner'
                      : isSelected
                      ? 'bg-white border-4 border-mint ring-4 ring-mint/20 shadow-md'
                      : isMyTurn
                      ? 'bg-white hover:bg-mint/10 border-2 border-lavender/30 hover:border-mint'
                      : 'bg-white border-2 border-lavender/20 cursor-not-allowed opacity-80'
                  }`}
                >
                  <span>{val !== null ? val : isSelected ? '?' : ''}</span>

                  {/* Owner Label badge */}
                  {isMe && (
                    <span className="absolute bottom-1 text-[9px] font-black uppercase text-mint-800 tracking-wider">
                      Anda
                    </span>
                  )}
                  {isOpp && (
                    <span className="absolute bottom-1 text-[9px] font-black uppercase text-sky-800 tracking-wider">
                      {opponentName.slice(0, 5)}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Row sum indicators right */}
        <div className="absolute -right-7 top-2 bottom-2 flex flex-col justify-around text-xs font-bold text-warmgray">
          {[0, 1, 2].map(r => (
            <span key={r} className="w-5 text-center">
              ={getRowSum(r)}
            </span>
          ))}
        </div>

        {/* Col sum indicators bottom */}
        <div className="absolute -bottom-6 left-2 right-2 flex justify-around text-xs font-bold text-warmgray">
          {[0, 1, 2].map(c => (
            <span key={c} className="w-16 sm:w-20 text-center">
              ={getColSum(c)}
            </span>
          ))}
        </div>
      </div>

      {/* Available Numbers Palette */}
      <div className="w-full max-w-sm mt-8 pt-2 flex flex-col items-center">
        <div className="text-xs font-bold text-warmgray mb-2">
          {isMyTurn
            ? selectedCell
              ? 'Pilih angka untuk mengisi kotak terpilih:'
              : 'Klik salah satu kotak kosong di atas terlebih dahulu'
            : `Menunggu giliran ${opponentName}...`}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {availableNumbers.map(num => (
            <button
              key={num}
              type="button"
              disabled={!isMyTurn || !selectedCell}
              onClick={() => handlePickNumber(num)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-black text-xl flex items-center justify-center transition-all shadow-sm ${
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
