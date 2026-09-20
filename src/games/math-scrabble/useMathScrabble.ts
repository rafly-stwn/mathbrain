import { useState, useEffect, useCallback, useRef } from 'react';
import { BOARD_SIZE, RACK_SIZE, BOARD_MULTIPLIERS, MAX_ZERO_MOVES } from './constants';
import { createTileBag, drawTiles } from './tileBag';
import { validateMove } from './mathValidator';
import type { BoardCell, Tile, Placement } from './types';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';

export function useMathScrabble() {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [board, setBoard] = useState<BoardCell[][]>([]);
  const [tileBag, setTileBag] = useState<Tile[]>([]);
  const [rack, setRack] = useState<Tile[]>([]);
  const [selectedRackTile, setSelectedRackTile] = useState<Tile | null>(null);
  const [pendingPlacements, setPendingPlacements] = useState<Placement[]>([]);
  
  // Game Stats matching user screenshot
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(1);
  const [zeroMoves, setZeroMoves] = useState(0);
  const [passesCount, setPassesCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1200); // 20:00 default
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showJokerToast, setShowJokerToast] = useState(false);
  const seenJokerIdsRef = useRef<Set<string>>(new Set());

  const addScore = useGameStore(state => state.addScore);
  const scores = useGameStore(state => state.scores);

  const bestScore = scores['math-scrabble']?.bestScore || 0;

  // Initialize board
  const initBoard = useCallback(() => {
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
    return initialBoard;
  }, []);

  const startGame = useCallback((durationSeconds: number = 1200) => {
    const bag = createTileBag();
    const { drawn: initialRack, remaining: remainingBag } = drawTiles(bag, RACK_SIZE);

    setBoard(initBoard());
    setTileBag(remainingBag);
    setRack(initialRack);
    setSelectedRackTile(null);
    setPendingPlacements([]);
    setScore(0);
    setTurn(1);
    setZeroMoves(0);
    setPassesCount(0);
    setTimeLeft(durationSeconds);
    setPhase('playing');
    setFeedbackMsg(null);
    seenJokerIdsRef.current.clear();
  }, [initBoard]);

  // Detect when a new Joker enters rack to trigger top toast banner
  useEffect(() => {
    if (phase !== 'playing') return;
    const newJokers = rack.filter(t => (t.isJoker || t.char === '★') && !seenJokerIdsRef.current.has(t.id));
    if (newJokers.length > 0) {
      newJokers.forEach(j => seenJokerIdsRef.current.add(j.id));
      setShowJokerToast(true);
    }
  }, [rack, phase]);

  // Chess clock timer
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setPhase('finished');
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
  }, [phase]);

  // Save high score when finished
  useEffect(() => {
    if (phase === 'finished') {
      addScore('math-scrabble', {
        gameId: 'math-scrabble',
        score,
        difficulty: 'medium',
        date: new Date().toISOString(),
        duration: 1200 - timeLeft,
        correct: score,
        wrong: zeroMoves,
      });
    }
  }, [phase, score, timeLeft, zeroMoves, addScore]);

  // Select a tile from rack
  const selectRackTile = useCallback((tile: Tile) => {
    soundService.playClick();
    setSelectedRackTile(prev => (prev?.id === tile.id ? null : tile));
  }, []);

  // Place selected rack tile on board (supports overrideTile for Joker selection)
  const placeTile = useCallback((r: number, c: number, overrideTile?: Tile) => {
    const tileToPlace = overrideTile || selectedRackTile;
    if (!tileToPlace) return;
    if (board[r][c].tile !== null) return;
    if (pendingPlacements.some(p => p.r === r && p.c === c)) return;

    soundService.playTilePlace();
    const newPlacements = [...pendingPlacements, { r, c, tile: tileToPlace }];
    setPendingPlacements(newPlacements);
    setRack(prev => prev.filter(t => t.id !== tileToPlace.id));
    setSelectedRackTile(null);
  }, [selectedRackTile, board, pendingPlacements]);

  // Recall single placed tile back to rack
  const recallTile = useCallback((r: number, c: number) => {
    const placed = pendingPlacements.find(p => p.r === r && p.c === c);
    if (!placed) return;

    soundService.playTileRecall();
    // Revert Joker to original '★' if recalled
    const tileToReturn = placed.tile.isJoker
      ? { ...placed.tile, char: '★' }
      : placed.tile;

    setPendingPlacements(prev => prev.filter(p => !(p.r === r && p.c === c)));
    setRack(prev => [...prev, tileToReturn]);
  }, [pendingPlacements]);

  // Recall all pending tiles
  const recallAllTiles = useCallback(() => {
    if (pendingPlacements.length === 0) return;
    soundService.playTileRecall();
    const recalledTiles = pendingPlacements.map(p =>
      p.tile.isJoker ? { ...p.tile, char: '★' } : p.tile
    );
    setRack(prev => [...prev, ...recalledTiles]);
    setPendingPlacements([]);
  }, [pendingPlacements]);

  // Submit Move: "Mainkan"
  const playMove = useCallback(() => {
    if (pendingPlacements.length === 0) {
      soundService.playWrong();
      setFeedbackMsg({ type: 'error', text: 'Pilih dan letakkan kartu ubin ke papan terlebih dahulu!' });
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

    // Permanently commit tiles to board
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    pendingPlacements.forEach(p => {
      newBoard[p.r][p.c].tile = p.tile;
      newBoard[p.r][p.c].owner = 'me';
    });

    // Draw replacement tiles from bag
    const needed = RACK_SIZE - rack.length;
    const { drawn, remaining } = drawTiles(tileBag, needed);
    const newRack = [...rack, ...drawn];

    setBoard(newBoard);
    setScore(newScore);
    setTileBag(remaining);
    setRack(newRack);
    setPendingPlacements([]);
    setZeroMoves(0);
    setPassesCount(0);
    setTurn(prev => prev + 1);

    const eqTexts = validation.equations?.map(e => `${e.text} (+${e.score})`).join(', ') || '';
    setFeedbackMsg({
      type: 'success',
      text: `Hebat! Persamaan valid: ${eqTexts} (+${earned} Poin)!`,
    });

    // Check game over: bag empty & rack empty
    if (remaining.length === 0 && newRack.length === 0) {
      soundService.playWin();
      setPhase('finished');
    }
  }, [board, pendingPlacements, score, rack, tileBag]);

  // Exchange Tiles: "Tukar"
  const exchangeTiles = useCallback((tileIds: string[]) => {
    if (tileBag.length === 0) {
      setFeedbackMsg({ type: 'info', text: 'Kantung ubin sudah kosong, tidak bisa menukar kartu.' });
      return;
    }
    soundService.playExchange();
    recallAllTiles();

    const tilesToReturn = rack.filter(t => tileIds.includes(t.id));
    const keptTiles = rack.filter(t => !tileIds.includes(t.id));

    // Put returned tiles back into bag & shuffle
    const newBag = [...tileBag, ...tilesToReturn];
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }

    const { drawn, remaining } = drawTiles(newBag, tilesToReturn.length);
    setRack([...keptTiles, ...drawn]);
    setTileBag(remaining);
    setZeroMoves(prev => prev + 1);
    setTurn(prev => prev + 1);
    setFeedbackMsg({ type: 'info', text: `${tilesToReturn.length} kartu berhasil ditukar.` });

    if (zeroMoves + 1 >= MAX_ZERO_MOVES) {
      soundService.playWin();
      setPhase('finished');
    }
  }, [tileBag, rack, recallAllTiles, zeroMoves]);

  // Pass Turn: "Lewat"
  const passTurn = useCallback(() => {
    soundService.playPass();
    recallAllTiles();
    const newZero = zeroMoves + 1;
    const newPasses = passesCount + 1;

    setZeroMoves(newZero);
    setPassesCount(newPasses);
    setTurn(prev => prev + 1);
    setFeedbackMsg({ type: 'info', text: 'Giliran dilewati.' });

    if (newZero >= MAX_ZERO_MOVES) {
      soundService.playWin();
      setPhase('finished');
    }
  }, [recallAllTiles, zeroMoves, passesCount]);

  return {
    phase,
    board,
    tileBag,
    rack,
    selectedRackTile,
    pendingPlacements,
    score,
    turn,
    zeroMoves,
    passesCount,
    timeLeft,
    feedbackMsg,
    bestScore,
    startGame,
    selectRackTile,
    placeTile,
    recallTile,
    recallAllTiles,
    playMove,
    exchangeTiles,
    passTurn,
    setPhase,
    showJokerToast,
    setShowJokerToast,
  };
}
