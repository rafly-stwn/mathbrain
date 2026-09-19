import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useDuelStore } from '../stores/duelStore';
import { peerService } from '../services/peerService';
import { Flag, RotateCcw, Home, Zap, Clock } from 'lucide-react';
import { soundService } from '../services/soundService';

import SpeedMathDuel from './duel-games/SpeedMathDuel';
import KraepelinDuel from './duel-games/KraepelinDuel';
import MagicSquareDuel from './duel-games/MagicSquareDuel';
import SudokuDuel from './duel-games/SudokuDuel';
import KenKenDuel from './duel-games/KenKenDuel';
import KakuroDuel from './duel-games/KakuroDuel';
import MathScrabbleDuel from './duel-games/MathScrabbleDuel';

import StickerTray from '../components/duel/StickerTray';
import StickerDisplay from '../components/duel/StickerDisplay';

export default function DuelArena() {
  const navigate = useNavigate();
  const {
    roomCode,
    status,
    gameId,
    difficulty,
    players,
    playerName,
    seed,
    currentTurnPlayerId,
    lastBoardMove,
    matchDuration,
    updateMyScore,
    sendBoardMove,
    finishMyGame,
    forfeitMyGame,
    requestRematch,
    leaveRoom,
  } = useDuelStore();

  // Redirect if not playing or waiting for result
  useEffect(() => {
    if (status === 'idle') {
      navigate('/duel');
    } else if (status === 'waiting') {
      const code = roomCode || peerService.getRoomCode() || useDuelStore.getState().roomCode;
      if (code) {
        navigate(`/duel/room/${code}`);
      } else {
        navigate('/duel');
      }
    }
  }, [status, roomCode, navigate]);

  const handleRematchClick = () => {
    const code = roomCode || peerService.getRoomCode() || useDuelStore.getState().roomCode;
    requestRematch();
    if (code) {
      navigate(`/duel/room/${code}`);
    }
  };

  const myId = peerService.getMyId();
  const me = players.find(p => p.id === myId) || players.find(p => p.name === playerName);
  const opponent = players.find(p => p.id !== myId && p.name !== playerName) || players.find(p => p !== me);

  const isTurnBased = ['magic-square', 'sudoku', 'kenken', 'kakuro', 'math-scrabble'].includes(gameId);

  const isMyTurn = currentTurnPlayerId
    ? (currentTurnPlayerId === myId || (me?.isHost && currentTurnPlayerId === 'host') || (!me?.isHost && currentTurnPlayerId === 'guest'))
    : Boolean(me?.isHost);

  // Local score is instantaneous for responsive UI
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const myScore = Math.max(score, me?.score || 0);
  const oppScore = opponent?.score || 0;
  const myStreak = Math.max(streak, me?.streak || 0);
  const oppStreak = opponent?.streak || 0;

  // Lead calculation
  const scoreDiff = myScore - oppScore;

  // Surrender modal state
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  // Speed games timer (60s)
  const [timeLeft, setTimeLeft] = useState(60);

  // Initialize on play
  useEffect(() => {
    if (status === 'playing') {
      setTimeLeft(60);
      setScore(0);
      setStreak(0);
    }
  }, [status]);

  // Overall speed timer countdown
  useEffect(() => {
    if (status !== 'playing' || isTurnBased) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          finishMyGame(score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, score, isTurnBased, finishMyGame]);

  // Guaranteed transition to result screen when time is up for speed games
  useEffect(() => {
    if (status === 'playing' && !isTurnBased && timeLeft === 0) {
      const timeout = setTimeout(() => {
        if (useDuelStore.getState().status === 'playing') {
          useDuelStore.setState({ status: 'result' });
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [status, timeLeft, isTurnBased]);

  // Trigger celebration Confetti Pop / Explosion effects on result screen
  useEffect(() => {
    if (status === 'result') {
      const isWinner = (me?.stats?.surrendered ? false : (opponent?.stats?.surrendered ? true : myScore > oppScore));
      const isDraw = !me?.stats?.surrendered && !opponent?.stats?.surrendered && myScore === oppScore;

      if (isWinner) {
        soundService.playWin();
      } else if (isDraw) {
        soundService.playCorrect();
      } else {
        soundService.playSurrender();
      }

      const pastelColors = ['#B8A9E8', '#FFB5A7', '#A8E6CF', '#FFE5A0', '#F4BFDB', '#A8D8EA'];

      // 1. Immediate Center Explosion Pop!
      confetti({
        particleCount: isWinner ? 90 : 50,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.55 },
        colors: pastelColors,
        zIndex: 9999,
      });

      // 2. Dual cannon follow-up pop from left and right
      const timer1 = setTimeout(() => {
        confetti({
          particleCount: isWinner ? 55 : 30,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.65 },
          colors: pastelColors,
          zIndex: 9999,
        });
        confetti({
          particleCount: isWinner ? 55 : 30,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.65 },
          colors: pastelColors,
          zIndex: 9999,
        });
      }, 200);

      // 3. Gentle sparkling star shower
      const timer2 = setTimeout(() => {
        confetti({
          particleCount: isWinner ? 40 : 20,
          spread: 360,
          startVelocity: 25,
          origin: { y: 0.4 },
          colors: pastelColors,
          zIndex: 9999,
        });
      }, 450);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [status, myScore, oppScore, me, opponent]);

  // Determine outcome
  const didISurrender = Boolean(me?.stats?.surrendered);
  const didOppSurrender = Boolean(opponent?.stats?.surrendered);
  const isWinner = didOppSurrender || (!didISurrender && myScore > oppScore);
  const isDraw = !didISurrender && !didOppSurrender && myScore === oppScore;

  // Dynamic progress tug-of-war
  const totalPoints = Math.max(1, myScore + oppScore);
  const myRatio = Math.round((myScore / totalPoints) * 100);

  return (
    <div className={`flex flex-col min-h-[calc(100vh-5rem)] ${gameId === 'math-scrabble' ? 'max-w-4xl' : 'max-w-2xl'} mx-auto w-full px-4 py-2 relative`}>
      {/* 1. TOP BAR: Tug of War & Superiority Status */}
      <header className="w-full bg-white rounded-card p-4 shadow-card border border-lavender/20 mb-4">
        {/* Players & Scores Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Player 1 (You) */}
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-charcoal text-sm sm:text-base truncate max-w-[100px] sm:max-w-[150px]">{playerName}</span>
              {myStreak >= 3 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-peach/30 text-charcoal rounded-md flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-peach" /> {myStreak}
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-charcoal leading-none mt-0.5">{myScore} <span className="text-xs font-normal text-warmgray">pts</span></div>
          </div>

          {/* Center Timer & VS */}
          <div className="flex flex-col items-center shrink-0">
            {isTurnBased ? (
              <div className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-pill flex items-center gap-1 font-bold text-[10px] sm:text-xs shadow-xs ${
                isMyTurn ? 'bg-mint/30 text-charcoal border border-mint animate-pulse' : 'bg-sky/20 text-charcoal'
              }`}>
                <span>{isMyTurn ? 'Giliran Anda' : 'Giliran Lawan'}</span>
              </div>
            ) : (
              <div className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-pill flex items-center gap-1 font-mono font-bold text-xs sm:text-sm shadow-xs ${timeLeft <= 10 ? 'bg-error/20 text-error animate-pulse' : 'bg-cream text-charcoal'}`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>00:{timeLeft.toString().padStart(2, '0')}</span>
              </div>
            )}
            <span className="text-[10px] sm:text-[11px] font-black text-warmgray tracking-widest mt-0.5">VS</span>
          </div>

          {/* Player 2 (Opponent) */}
          <div className="flex flex-col items-end text-right min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              {oppStreak >= 3 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky/30 text-charcoal rounded-md flex items-center gap-0.5">
                  <Zap className="w-3 h-3 text-sky" /> {oppStreak}
                </span>
              )}
              <span className="font-black text-charcoal text-sm sm:text-base truncate max-w-[100px] sm:max-w-[150px]">{opponent?.name || 'Lawan'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-charcoal leading-none mt-0.5">{oppScore} <span className="text-xs font-normal text-warmgray">pts</span></div>
          </div>
        </div>

        {/* Live Advantage Indicator Banner */}
        <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl border mb-2.5 transition-colors font-bold ${
          scoreDiff > 0
            ? 'bg-mint/15 border-mint/40 text-charcoal'
            : scoreDiff < 0
            ? 'bg-peach/15 border-peach/40 text-charcoal'
            : 'bg-cream border-warmgray/20 text-warmgray'
        }">
          <div className="flex items-center gap-1.5">
            {scoreDiff > 0 ? (
              <>
                <span className="text-sm">🔥</span>
                <span className="text-mint font-extrabold">Anda Unggul +{scoreDiff} Poin!</span>
              </>
            ) : scoreDiff < 0 ? (
              <>
                <span className="text-sm">⚠️</span>
                <span className="text-peach font-extrabold">Lawan Memimpin ({scoreDiff} Poin)</span>
              </>
            ) : (
              <>
                <span className="text-sm">⚖️</span>
                <span>Skor Seimbang ({myScore} - {oppScore})</span>
              </>
            )}
          </div>

          {/* Surrender Button */}
          <button
            onClick={() => {
              soundService.playClick();
              setShowSurrenderModal(true);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-warmgray hover:text-error transition-colors px-2 py-0.5 rounded-md hover:bg-error/10 cursor-pointer shrink-0"
            title="Mengundurkan Diri dari Duel"
          >
            <Flag className="w-3.5 h-3.5 text-error" />
            <span>Menyerah</span>
          </button>
        </div>

        {/* Tug-of-War Split Progress Bar */}
        <div className="w-full h-2.5 bg-gray-100 rounded-pill overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-mint transition-all duration-300 rounded-l-pill"
            style={{ width: `${myRatio}%` }}
          />
          <div
            className="h-full bg-sky transition-all duration-300 rounded-r-pill"
            style={{ width: `${100 - myRatio}%` }}
          />
        </div>
      </header>

      {/* 2. MAIN GAMEPLAY AREA */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full">
        {/* Waiting for opponent notice if user already finished */}
        {me?.isFinished && !opponent?.isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white rounded-card shadow-card p-8 text-center border border-lavender/20 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center text-3xl animate-bounce">
              ⏳
            </div>
            <h3 className="text-xl font-black text-charcoal">Pertandingan Anda Selesai!</h3>
            <p className="text-sm text-warmgray max-w-sm">
              Skor akhir Anda: <strong>{score} poin</strong>. Menunggu lawan menyelesaikan pertandingan...
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cream rounded-pill text-xs font-bold text-charcoal animate-pulse">
              <span>Lawan sedang bertanding...</span>
            </div>
          </motion.div>
        ) : (
          /* Dedicated Game Components for each game title */
          <div className="w-full flex justify-center">
            {(gameId === 'speed-addition' || gameId === 'speed-multiplication') && (
              <SpeedMathDuel
                gameId={gameId}
                difficulty={difficulty}
                seed={seed}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  setStreak(newStreak);
                  updateMyScore(newScore, newStreak, progress);
                }}
              />
            )}

            {gameId === 'kraepelin' && (
              <KraepelinDuel
                difficulty={difficulty}
                seed={seed}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  setStreak(newStreak);
                  updateMyScore(newScore, newStreak, progress);
                }}
              />
            )}

            {gameId === 'magic-square' && (
              <MagicSquareDuel
                difficulty={difficulty}
                seed={seed}
                myId={myId}
                myName={playerName}
                opponentName={opponent?.name || 'Lawan'}
                isMyTurn={isMyTurn}
                currentTurnPlayerId={currentTurnPlayerId}
                lastBoardMove={lastBoardMove}
                onSendBoardMove={(moveData, newScore) => {
                  sendBoardMove(moveData, newScore);
                }}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  updateMyScore(newScore, newStreak, progress);
                }}
                onFinish={(finalScore) => {
                  finishMyGame(finalScore);
                }}
              />
            )}

            {gameId === 'sudoku' && (
              <SudokuDuel
                difficulty={difficulty}
                seed={seed}
                myId={myId}
                myName={playerName}
                opponentName={opponent?.name || 'Lawan'}
                isMyTurn={isMyTurn}
                currentTurnPlayerId={currentTurnPlayerId}
                lastBoardMove={lastBoardMove}
                onSendBoardMove={(moveData, newScore) => {
                  sendBoardMove(moveData, newScore);
                }}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  updateMyScore(newScore, newStreak, progress);
                }}
                onFinish={(finalScore) => {
                  finishMyGame(finalScore);
                }}
              />
            )}

            {gameId === 'kenken' && (
              <KenKenDuel
                difficulty={difficulty}
                seed={seed}
                myId={myId}
                myName={playerName}
                opponentName={opponent?.name || 'Lawan'}
                isMyTurn={isMyTurn}
                currentTurnPlayerId={currentTurnPlayerId}
                lastBoardMove={lastBoardMove}
                onSendBoardMove={(moveData, newScore) => {
                  sendBoardMove(moveData, newScore);
                }}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  updateMyScore(newScore, newStreak, progress);
                }}
                onFinish={(finalScore) => {
                  finishMyGame(finalScore);
                }}
              />
            )}

            {gameId === 'kakuro' && (
              <KakuroDuel
                difficulty={difficulty}
                seed={seed}
                myId={myId}
                myName={playerName}
                opponentName={opponent?.name || 'Lawan'}
                isMyTurn={isMyTurn}
                currentTurnPlayerId={currentTurnPlayerId}
                lastBoardMove={lastBoardMove}
                onSendBoardMove={(moveData, newScore) => {
                  sendBoardMove(moveData, newScore);
                }}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  updateMyScore(newScore, newStreak, progress);
                }}
                onFinish={(finalScore) => {
                  finishMyGame(finalScore);
                }}
              />
            )}

            {gameId === 'math-scrabble' && (
              <MathScrabbleDuel
                difficulty={difficulty}
                seed={seed}
                myId={myId}
                opponentName={opponent?.name || 'Lawan'}
                isMyTurn={isMyTurn}
                currentTurnPlayerId={currentTurnPlayerId}
                lastBoardMove={lastBoardMove}
                matchDuration={matchDuration}
                onSendBoardMove={(moveData, newScore) => {
                  sendBoardMove(moveData, newScore);
                }}
                onScoreUpdate={(newScore, newStreak, progress) => {
                  setScore(newScore);
                  updateMyScore(newScore, newStreak, progress);
                }}
                onFinish={(finalScore) => {
                  finishMyGame(finalScore);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* 3. SURRENDER CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSurrenderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSurrenderModal(false)}
              className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-card shadow-card p-6 border border-error/20 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto mb-3">
                <Flag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-charcoal">Mengundurkan Diri?</h3>
              <p className="text-xs text-warmgray mt-2 leading-relaxed">
                Jika Anda mengundurkan diri sekarang, lawan akan otomatis dinyatakan sebagai pemenang pertandingan ini.
              </p>
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => {
                    soundService.playClick();
                    setShowSurrenderModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-button border border-warmgray/30 text-charcoal font-bold text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    soundService.playSurrender();
                    setShowSurrenderModal(false);
                    forfeitMyGame();
                  }}
                  className="flex-1 py-2.5 rounded-button bg-error text-white font-bold text-sm hover:bg-error/90 active:scale-95 shadow-sm"
                >
                  Ya, Menyerah
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CELEBRATION POP-UP (UAPAN SELAMAT & HASIL) */}
      <AnimatePresence>
        {status === 'result' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-sm rounded-[28px] shadow-2xl p-6 text-charcoal border-2 text-center ${
                isWinner
                  ? 'bg-gradient-to-b from-mint/20 via-white to-lemon/10 border-mint/40'
                  : isDraw
                  ? 'bg-gradient-to-b from-sky/20 via-white to-lavender/10 border-lavender/40'
                  : 'bg-gradient-to-b from-peach/20 via-white to-cream border-peach/40'
              }`}
            >
              {/* Floating Animated Mascot / Trophy */}
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: [1, 1.1, 1], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mx-auto mb-2 drop-shadow-sm select-none"
              >
                {isWinner ? '🏆' : isDraw ? '🤝' : '🥈'}
              </motion.div>

              {/* Status Pill Badge */}
              <div className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2 shadow-xs ${
                isWinner
                  ? 'bg-mint text-charcoal'
                  : isDraw
                  ? 'bg-sky/30 text-charcoal'
                  : 'bg-peach/30 text-charcoal'
              }`}>
                {isWinner ? '✨ Pemenang Duel ✨' : isDraw ? '⚖️ Hasil Seimbang ⚖️' : '💪 Pertarungan Seru 💪'}
              </div>

              {/* Victory / Defeat Title */}
              <h2 className="text-2xl font-black tracking-tight text-charcoal mb-1">
                {isWinner
                  ? (didOppSurrender ? 'Menang (Lawan Menyerah)!' : 'Hore! Kamu Menang! 🎉')
                  : isDraw
                  ? 'Hasil Imbang! 🤝'
                  : (didISurrender ? 'Kamu Menyerah' : 'Pertarungan Sengit! 🥈')}
              </h2>

              <p className="text-xs text-warmgray mb-4 max-w-xs mx-auto">
                {isWinner
                  ? 'Kecepatan dan akurasi matematikamu luar biasa!'
                  : isDraw
                  ? 'Kalian berdua punya kemampuan yang seimbang!'
                  : 'Tetap semangat! Asah terus refleks hitungmu!'}
              </p>

              {/* Compact Score Comparison Pill */}
              <div className="flex items-center justify-between bg-cream/70 rounded-2xl p-3 mb-5 border border-charcoal/5">
                <div className={`flex-1 flex flex-col items-center py-1 px-2 rounded-xl transition-all ${isWinner ? 'bg-mint/30' : ''}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-warmgray uppercase">Anda</span>
                    {isWinner && <span className="text-xs">👑</span>}
                  </div>
                  <span className="text-2xl font-black text-charcoal leading-tight">{myScore}</span>
                  <span className="text-[10px] text-warmgray">poin</span>
                </div>
                
                <div className="px-2 font-black text-xs text-warmgray tracking-widest">VS</div>

                <div className={`flex-1 flex flex-col items-center py-1 px-2 rounded-xl transition-all ${!isWinner && !isDraw ? 'bg-mint/30' : ''}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-warmgray uppercase truncate max-w-[80px]">{opponent?.name || 'Lawan'}</span>
                    {!isWinner && !isDraw && <span className="text-xs">👑</span>}
                  </div>
                  <span className="text-2xl font-black text-charcoal leading-tight">{oppScore}</span>
                  <span className="text-[10px] text-warmgray">poin</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    soundService.playClick();
                    handleRematchClick();
                  }}
                  className="w-full py-3 rounded-xl bg-charcoal hover:bg-black text-white font-extrabold text-sm transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tanding Ulang ⚔️</span>
                </button>

                <button
                  onClick={() => {
                    soundService.playClick();
                    leaveRoom();
                    navigate('/');
                  }}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-gray-50 text-charcoal font-bold text-xs border border-charcoal/15 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Sticker Floating Action Button & Tray */}
      <StickerTray />

      {/* Floating Animated Sticker Reactions (Self & Opponent) */}
      <StickerDisplay />
    </div>
  );
}
