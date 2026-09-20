import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { BOARD_SIZE, RACK_SIZE, BOARD_MULTIPLIERS, MAX_ZERO_MOVES } from '../../games/math-scrabble/constants';
import { createTileBag, drawTiles } from '../../games/math-scrabble/tileBag';
import { validateMove } from '../../games/math-scrabble/mathValidator';
import { soundService } from '../../services/soundService';
import type { BoardCell, Tile, Placement } from '../../games/math-scrabble/types';
import type { Difficulty } from '../../types';

interface MathScrabbleDuelProps {
  difficulty: Difficulty;
  seed: number;
  myId: string;
  opponentName: string;
  isMyTurn: boolean;
  currentTurnPlayerId: string;
  lastBoardMove: { id: string; moveData: any; score: number } | null;
  matchDuration: number;
  onSendBoardMove: (moveData: any, newScore: number) => void;
  onScoreUpdate: (score: number, streak: number, progress?: number) => void;
  onFinish?: (finalScore: number) => void;
}

export default function MathScrabbleDuel({
  myId,
  opponentName,
  isMyTurn,
  lastBoardMove,
  matchDuration = 1200,
  onSendBoardMove,
  onScoreUpdate,
  onFinish,
}: MathScrabbleDuelProps) {
  const [board, setBoard] = useState<BoardCell[][]>([]);
  const [tileBag, setTileBag] = useState<Tile[]>([]);
  const [rack, setRack] = useState<Tile[]>([]);
  const [selectedRackTile, setSelectedRackTile] = useState<Tile | null>(null);
  const [pendingPlacements, setPendingPlacements] = useState<Placement[]>([]);

  // Dual Chess Clocks
  const [myTime, setMyTime] = useState(matchDuration);
  const [oppTime, setOppTime] = useState(matchDuration);

  // Match Statistics (matching user requirements)
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(1);
  const [zeroMoves, setZeroMoves] = useState(0);
  const [passesCount, setPassesCount] = useState(0);
  const [usedTilesCount, setUsedTilesCount] = useState(0);
  const [remainingBagCount, setRemainingBagCount] = useState(84); // 100 total - 16 initial dealt = 84

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [exchangeMode, setExchangeMode] = useState(false);
  const [selectedForExchange, setSelectedForExchange] = useState<string[]>([]);

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Initialize board and random tile bag ONCE on mount
  // Crucial fix: Do NOT re-initialize on turn change or myId changes
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initialBoard: BoardCell[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: BoardCell[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        row.push({
          r,
          c,
          multiplier: BOARD_MULTIPLIERS[r][c],
          tile: null,
        });
      }
      initialBoard.push(row);
    }
    setBoard(initialBoard);

    // Truly randomized tile bag so each player gets diverse, unique cards
    const bag = createTileBag(undefined, myId ? myId.slice(0, 4) : undefined);
    const { drawn: initialRack, remaining: remainingBag } = drawTiles(bag, RACK_SIZE);

    setRack(initialRack);
    setTileBag(remainingBag);
    setMyTime(matchDuration);
    setOppTime(matchDuration);
    setScore(0);
    setTurn(1);
    setZeroMoves(0);
    setPassesCount(0);
    setUsedTilesCount(0);
    setRemainingBagCount(84);
    setPendingPlacements([]);
    setSelectedRackTile(null);
  }, [matchDuration, myId]);

  // 2. Chess clock ticker (ticks down only for the player whose turn it is)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMyTurn) {
        setMyTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onFinish) onFinish(score);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setOppTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, score, onFinish]);

  // 3. Handle incoming moves from opponent
  const prevMoveRef = useRef<any>(null);
  useEffect(() => {
    if (!lastBoardMove || lastBoardMove === prevMoveRef.current) return;
    prevMoveRef.current = lastBoardMove;

    if (lastBoardMove.id !== myId && lastBoardMove.moveData) {
      const { type, placements, remainingClock } = lastBoardMove.moveData;

      if (remainingClock !== undefined) {
        setOppTime(remainingClock);
      }

      if (type === 'play' && Array.isArray(placements)) {
        soundService.playTilePlace();
        setBoard(prev => {
          const next = prev.map(row => row.map(cell => ({ ...cell })));
          placements.forEach((p: Placement) => {
            next[p.r][p.c].tile = p.tile;
            next[p.r][p.c].owner = 'opponent';
          });
          return next;
        });

        setUsedTilesCount(prev => prev + placements.length);
        setRemainingBagCount(prev => Math.max(0, prev - placements.length));
        setZeroMoves(0);
        setTurn(prev => prev + 1);
        setFeedbackMsg({
          type: 'info',
          text: `${opponentName} memainkan ${placements.length} kartu (+${lastBoardMove.score} pts). Giliran Anda!`,
        });
      } else if (type === 'exchange') {
        soundService.playExchange();
        setZeroMoves(prev => prev + 1);
        setTurn(prev => prev + 1);
        setFeedbackMsg({ type: 'info', text: `${opponentName} menukar kartu. Giliran Anda!` });
      } else if (type === 'pass') {
        soundService.playPass();
        setZeroMoves(prev => prev + 1);
        setPassesCount(prev => prev + 1);
        setTurn(prev => prev + 1);
        setFeedbackMsg({ type: 'info', text: `${opponentName} melewatkan giliran. Giliran Anda!` });
      }

      if (zeroMoves + 1 >= MAX_ZERO_MOVES && onFinish) {
        onFinish(score);
      }
    }
  }, [lastBoardMove, myId, opponentName, score, zeroMoves, onFinish]);

  // Tile Selection on Rack
  const selectRackTile = useCallback((tile: Tile) => {
    if (!isMyTurn) return;
    soundService.playClick();
    setSelectedRackTile(prev => (prev?.id === tile.id ? null : tile));
  }, [isMyTurn]);

  // Place Tile on Board
  const placeTile = useCallback((r: number, c: number) => {
    if (!isMyTurn || !selectedRackTile) return;
    if (board[r][c].tile !== null) return;
    if (pendingPlacements.some(p => p.r === r && p.c === c)) return;

    soundService.playTilePlace();
    const newPlacements = [...pendingPlacements, { r, c, tile: selectedRackTile }];
    setPendingPlacements(newPlacements);
    setRack(prev => prev.filter(t => t.id !== selectedRackTile.id));
    setSelectedRackTile(null);
  }, [isMyTurn, selectedRackTile, board, pendingPlacements]);

  // Recall single placed tile
  const recallTile = useCallback((r: number, c: number) => {
    const placed = pendingPlacements.find(p => p.r === r && p.c === c);
    if (!placed) return;

    soundService.playTileRecall();
    setPendingPlacements(prev => prev.filter(p => !(p.r === r && p.c === c)));
    setRack(prev => [...prev, placed.tile]);
  }, [pendingPlacements]);

  // Recall all pending tiles
  const recallAllTiles = useCallback(() => {
    if (pendingPlacements.length === 0) return;
    soundService.playTileRecall();
    const recalledTiles = pendingPlacements.map(p => p.tile);
    setRack(prev => [...prev, ...recalledTiles]);
    setPendingPlacements([]);
  }, [pendingPlacements]);

  // Action: Mainkan (Play Move)
  const handlePlayMove = useCallback(() => {
    if (!isMyTurn) return;
    if (pendingPlacements.length === 0) {
      soundService.playWrong();
      setFeedbackMsg({ type: 'error', text: 'Letakkan kartu ubin ke papan terlebih dahulu!' });
      return;
    }

    const validation = validateMove(board, pendingPlacements);
    if (!validation.valid) {
      soundService.playWrong();
      setFeedbackMsg({ type: 'error', text: validation.error || 'Persamaan matematika tidak valid!' });
      return;
    }

    soundService.playCorrect();
    const earned = validation.score || 0;
    const newScore = score + earned;
    const placedCount = pendingPlacements.length;

    // Commit to board
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    pendingPlacements.forEach(p => {
      newBoard[p.r][p.c].tile = p.tile;
      newBoard[p.r][p.c].owner = 'me';
    });

    // Draw replacements
    const needed = RACK_SIZE - rack.length;
    const { drawn, remaining } = drawTiles(tileBag, needed);
    const newRack = [...rack, ...drawn];

    setBoard(newBoard);
    setScore(newScore);
    setTileBag(remaining);
    setRack(newRack);
    setUsedTilesCount(prev => prev + placedCount);
    setRemainingBagCount(prev => Math.max(0, prev - placedCount));
    setPendingPlacements([]);
    setZeroMoves(0);
    setPassesCount(0);
    setTurn(prev => prev + 1);

    const eqTexts = validation.equations?.map(e => `${e.text} (+${e.score})`).join(', ') || '';
    setFeedbackMsg({
      type: 'success',
      text: `Benar! Persamaan: ${eqTexts} (+${earned} Poin)!`,
    });

    onScoreUpdate(newScore, 1);
    onSendBoardMove(
      {
        type: 'play',
        placements: pendingPlacements,
        remainingClock: myTime,
      },
      newScore
    );

    // Game over check
    if (remaining.length === 0 && newRack.length === 0 && onFinish) {
      onFinish(newScore);
    }
  }, [isMyTurn, pendingPlacements, board, score, rack, tileBag, myTime, onScoreUpdate, onSendBoardMove, onFinish]);

  // Action: Tukar (Exchange Tiles)
  const handleExchangeConfirm = useCallback(() => {
    if (!isMyTurn || selectedForExchange.length === 0) return;
    soundService.playExchange();
    recallAllTiles();

    const tilesToReturn = rack.filter(t => selectedForExchange.includes(t.id));
    const keptTiles = rack.filter(t => !selectedForExchange.includes(t.id));

    // Put back into bag & draw
    const newBag = [...tileBag, ...tilesToReturn];
    const { drawn, remaining } = drawTiles(newBag, tilesToReturn.length);

    setRack([...keptTiles, ...drawn]);
    setTileBag(remaining);
    setZeroMoves(prev => prev + 1);
    setTurn(prev => prev + 1);
    setSelectedForExchange([]);
    setExchangeMode(false);
    setFeedbackMsg({ type: 'info', text: `${tilesToReturn.length} kartu berhasil ditukar.` });

    onSendBoardMove(
      {
        type: 'exchange',
        count: tilesToReturn.length,
        remainingClock: myTime,
      },
      score
    );

    if (zeroMoves + 1 >= MAX_ZERO_MOVES && onFinish) {
      onFinish(score);
    }
  }, [isMyTurn, selectedForExchange, rack, tileBag, myTime, score, zeroMoves, recallAllTiles, onSendBoardMove, onFinish]);

  // Action: Lewat (Pass Turn)
  const handlePassTurn = useCallback(() => {
    if (!isMyTurn) return;
    soundService.playPass();
    recallAllTiles();

    const newZero = zeroMoves + 1;
    const newPasses = passesCount + 1;

    setZeroMoves(newZero);
    setPassesCount(newPasses);
    setTurn(prev => prev + 1);
    setFeedbackMsg({ type: 'info', text: 'Giliran dilewati.' });

    onSendBoardMove(
      {
        type: 'pass',
        remainingClock: myTime,
      },
      score
    );

    if (newZero >= MAX_ZERO_MOVES && onFinish) {
      onFinish(score);
    }
  }, [isMyTurn, zeroMoves, passesCount, score, myTime, recallAllTiles, onSendBoardMove, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col w-full max-w-4xl mx-auto px-2 py-1 select-none"
    >
      {/* 1. KHUSUS MATH SCRABBLE: HITUNGAN MENIT & STATISTIK KARTU (TANPA SKOR DOUBLE) */}
      <div className="w-full bg-white rounded-2xl p-2.5 sm:p-4 shadow-card border border-lavender/30 mb-3 flex flex-col gap-2">
        {/* Row 1: Dual Chess Clocks (2 Baris per Kartu agar Responsif di HP) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Player 1 (Kamu) Chess Clock */}
          <div
            className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col justify-between ${
              isMyTurn
                ? 'bg-mint/20 border-mint ring-2 ring-mint/30 shadow-xs'
                : 'bg-cream/50 border-warmgray/15'
            }`}
          >
            {/* Baris 1: Nama & Status (Giliran / Menunggu) */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs sm:text-sm font-black text-charcoal">Kamu</span>
              {isMyTurn ? (
                <span className="text-[9.5px] sm:text-[10px] px-1.5 py-0.5 bg-mint text-charcoal rounded-pill font-black animate-pulse flex items-center gap-1 leading-none shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-charcoal"></span> Giliran
                </span>
              ) : (
                <span className="text-[9.5px] sm:text-[10px] text-warmgray font-semibold leading-none">Menunggu</span>
              )}
            </div>

            {/* Baris 2: Timer di Bawah Nama */}
            <div className={`text-base sm:text-xl font-black font-mono flex items-center gap-1.5 ${
              isMyTurn ? 'text-charcoal' : 'text-warmgray'
            }`}>
              <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isMyTurn ? 'text-charcoal animate-spin' : 'text-warmgray/40'}`} />
              <span>{formatClock(myTime)}</span>
            </div>
          </div>

          {/* Player 2 (Lawan) Chess Clock */}
          <div
            className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col justify-between ${
              !isMyTurn
                ? 'bg-sky/20 border-sky ring-2 ring-sky/30 shadow-xs'
                : 'bg-cream/50 border-warmgray/15'
            }`}
          >
            {/* Baris 1: Nama & Status (Giliran / Menunggu) */}
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs sm:text-sm font-black text-charcoal truncate max-w-[75px] sm:max-w-[130px]">{opponentName}</span>
              {!isMyTurn ? (
                <span className="text-[9.5px] sm:text-[10px] px-1.5 py-0.5 bg-sky text-charcoal rounded-pill font-black animate-pulse flex items-center gap-1 leading-none shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-charcoal"></span> Giliran
                </span>
              ) : (
                <span className="text-[9.5px] sm:text-[10px] text-warmgray font-semibold leading-none">Menunggu</span>
              )}
            </div>

            {/* Baris 2: Timer di Bawah Nama */}
            <div className={`text-base sm:text-xl font-black font-mono flex items-center gap-1.5 ${
              !isMyTurn ? 'text-charcoal' : 'text-warmgray'
            }`}>
              <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${!isMyTurn ? 'text-charcoal animate-spin' : 'text-warmgray/40'}`} />
              <span>{formatClock(oppTime)}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Status Kartu & Putaran (Ringkas untuk HP) */}
        <div className="grid grid-cols-5 gap-1 text-center text-xs font-bold bg-cream/70 py-1.5 px-1.5 sm:px-2.5 rounded-xl border border-lavender/15">
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-warmgray uppercase tracking-wider font-bold">Putaran</span>
            <span className="text-xs sm:text-sm font-black text-charcoal">{turn}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-warmgray uppercase tracking-wider font-bold">Sisa</span>
            <span className="text-xs sm:text-sm font-black text-charcoal">{remainingBagCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-warmgray uppercase tracking-wider font-bold">Terpakai</span>
            <span className="text-xs sm:text-sm font-black text-charcoal">{usedTilesCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-warmgray uppercase tracking-wider font-bold">Six Zero</span>
            <span className="text-xs sm:text-sm font-black text-charcoal">{zeroMoves}/6</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] text-warmgray uppercase tracking-wider font-bold">Lewat</span>
            <span className="text-xs sm:text-sm font-black text-charcoal">{passesCount}</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-2 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-mint/30 text-charcoal border border-mint'
                : feedbackMsg.type === 'error'
                ? 'bg-error/20 text-error border border-error/30'
                : 'bg-sky/20 text-charcoal border border-sky/30'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : feedbackMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-error" />
            ) : (
              <Info className="w-4 h-4 text-sky-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. 15x15 MULTIPLIER BOARD */}
      <div className="flex-1 w-full overflow-auto flex justify-center py-1">
        <div
          className="grid gap-[2px] bg-[#2C2E43] p-1.5 rounded-xl shadow-lg select-none"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            width: '100%',
            maxWidth: '540px',
            aspectRatio: '1 / 1',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const pending = pendingPlacements.find(p => p.r === r && p.c === c);
              const tile = cell.tile || pending?.tile || null;
              const isPending = Boolean(pending);
              const isCenter = r === 7 && c === 7;
              const isMine = cell.owner === 'me' || isPending;
              const isOpp = cell.owner === 'opponent';

              let bgClass = 'bg-white';
              let multPrefix = '';
              let multSuffix = '';
              let labelClass = '';

              if (cell.multiplier === 'x3_score') {
                bgClass = 'bg-[#F26B6B]';
                multPrefix = 'X3';
                multSuffix = 'SCORE';
                labelClass = 'text-white';
              } else if (cell.multiplier === 'x2_score') {
                bgClass = 'bg-[#F8A5A5]';
                multPrefix = 'X2';
                multSuffix = 'SCORE';
                labelClass = 'text-white';
              } else if (cell.multiplier === 'x3_point') {
                bgClass = 'bg-[#4A90E2]';
                multPrefix = 'X3';
                multSuffix = 'POINT';
                labelClass = 'text-white';
              } else if (cell.multiplier === 'x2_point') {
                bgClass = 'bg-[#A8D8EA]';
                multPrefix = 'X2';
                multSuffix = 'POINT';
                labelClass = 'text-charcoal';
              } else if (isCenter) {
                bgClass = 'bg-[#FCE38A]';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => {
                    if (isPending) {
                      recallTile(r, c);
                    } else if (cell.tile === null && selectedRackTile && isMyTurn) {
                      placeTile(r, c);
                    }
                  }}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-[3px] transition-all cursor-pointer overflow-hidden ${bgClass} ${
                    isPending
                      ? 'ring-2 ring-mint ring-offset-1 z-10 animate-pulse'
                      : isMyTurn && selectedRackTile && cell.tile === null
                      ? 'hover:opacity-80'
                      : ''
                  }`}
                >
                  {/* Multiplier background label when empty */}
                  {!tile && (
                    <>
                      {isCenter ? (
                        <span className="text-xs sm:text-sm leading-none">⭐️</span>
                      ) : multPrefix ? (
                        <div className={`flex flex-col items-center justify-center leading-none select-none gap-[1px] ${labelClass}`}>
                          <span className="text-[4.5px] sm:text-[7.5px] font-black leading-none">
                            {multPrefix}
                          </span>
                          <span className="text-[3.5px] sm:text-[6px] font-extrabold uppercase leading-none tracking-tight">
                            {multSuffix}
                          </span>
                        </div>
                      ) : null}
                    </>
                  )}

                  {/* Tile display */}
                  {tile && (
                    <div
                      className={`w-full h-full rounded-[3px] flex flex-col items-center justify-center relative shadow-xs ${
                        isMine
                          ? 'bg-[#FFF5DB] border border-[#D8C7A5]'
                          : isOpp
                          ? 'bg-[#E3F2FD] border border-[#90CAF9]'
                          : 'bg-[#FFF5DB] border border-[#D8C7A5]'
                      }`}
                    >
                      <span className="font-black text-xs sm:text-base text-charcoal leading-none">
                        {tile.char}
                      </span>
                      <span className="absolute bottom-0.5 right-0.5 text-[6.5px] sm:text-[8.5px] font-black text-warmgray leading-none">
                        {tile.value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. RACK (Rak 8 Ubin) */}
      <div className="w-full mt-2 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-sm px-2 text-xs font-bold text-warmgray mb-1">
          <span>{isMyTurn ? 'Rak Kartu Anda (Pilih untuk diletakkan):' : `Giliran ${opponentName}...`}</span>
          {pendingPlacements.length > 0 && (
            <button onClick={recallAllTiles} className="text-xs text-rose-500 hover:underline font-bold">
              Tarik Semua ({pendingPlacements.length})
            </button>
          )}
        </div>

        {/* Rack container */}
        <div className="w-full max-w-md bg-[#2C2E43] p-1.5 sm:p-2 rounded-2xl shadow-md border-2 border-charcoal/10 flex justify-center items-center gap-1 sm:gap-2">
          {rack.map(tile => {
            const isSelected = selectedRackTile?.id === tile.id;
            const isMarkedExchange = selectedForExchange.includes(tile.id);

            return (
              <motion.div
                key={tile.id}
                whileHover={isMyTurn ? { y: -3 } : {}}
                whileTap={isMyTurn ? { scale: 0.93 } : {}}
                onClick={() => {
                  if (!isMyTurn) return;
                  if (exchangeMode) {
                    setSelectedForExchange(prev =>
                      prev.includes(tile.id) ? prev.filter(id => id !== tile.id) : [...prev, tile.id]
                    );
                  } else {
                    selectRackTile(tile);
                  }
                }}
                className={`flex-1 max-w-[42px] h-10 sm:h-13 bg-[#FFF5DB] border-2 rounded-xl flex flex-col items-center justify-center relative cursor-pointer shadow-sm transition-all ${
                  isSelected
                    ? 'border-mint ring-3 ring-mint/40 -translate-y-1.5'
                    : isMarkedExchange
                    ? 'border-error bg-error/20 ring-2 ring-error'
                    : 'border-[#D8C7A5]'
                } ${!isMyTurn ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <span className="font-black text-sm sm:text-lg text-charcoal leading-none">
                  {tile.char}
                </span>
                <span className="absolute bottom-0.5 right-1 text-[7px] sm:text-[9px] font-black text-warmgray leading-none">
                  {tile.value}
                </span>

                {isMarkedExchange && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error text-white text-[9px] font-black flex items-center justify-center">
                    ✓
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. ACTION BUTTONS (Mainkan, Tukar, Lewat) */}
      <div className="w-full max-w-md mx-auto mt-2.5 flex flex-col gap-2">
        {exchangeMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                soundService.playClick();
                setExchangeMode(false);
                setSelectedForExchange([]);
              }}
              className="flex-1 py-2.5 rounded-button bg-gray-200 text-charcoal font-bold text-xs hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              onClick={handleExchangeConfirm}
              disabled={selectedForExchange.length === 0 || !isMyTurn}
              className="flex-1 py-2.5 rounded-button bg-charcoal text-white font-extrabold text-xs hover:bg-black disabled:opacity-50"
            >
              Tukar {selectedForExchange.length} Kartu 🔄
            </button>
          </div>
        ) : (
          <>
            {/* Primary Action Button: Mainkan */}
            <button
              onClick={handlePlayMove}
              disabled={!isMyTurn || pendingPlacements.length === 0}
              className={`w-full py-3 rounded-button font-black text-sm sm:text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isMyTurn && pendingPlacements.length > 0
                  ? 'bg-[#FFE5A0] hover:bg-[#FFD97D] text-charcoal border-2 border-charcoal/10 ring-2 ring-[#FFE5A0]/50'
                  : 'bg-warmgray/20 text-warmgray/60 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isMyTurn ? `Mainkan (${pendingPlacements.length} Kartu)` : `Menunggu ${opponentName}...`}</span>
            </button>

            {/* Secondary Action Buttons: Tukar & Lewat */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!isMyTurn) return;
                  soundService.playClick();
                  recallAllTiles();
                  setExchangeMode(true);
                }}
                disabled={!isMyTurn || tileBag.length === 0}
                className="flex-1 py-2.5 rounded-button bg-[#FFE5A0]/40 hover:bg-[#FFE5A0]/70 text-charcoal font-black text-xs transition-all active:scale-95 disabled:opacity-40"
              >
                Tukar Kartu
              </button>

              <button
                onClick={handlePassTurn}
                disabled={!isMyTurn}
                className="flex-1 py-2.5 rounded-button bg-[#FFE5A0]/40 hover:bg-[#FFE5A0]/70 text-charcoal font-black text-xs transition-all active:scale-95 disabled:opacity-40"
              >
                Lewat
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
