import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, RotateCcw, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMathScrabble } from './useMathScrabble';
import { soundService } from '../../services/soundService';

export default function MathScrabble() {
  const navigate = useNavigate();
  const {
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
  } = useMathScrabble();

  const [exchangeMode, setExchangeMode] = useState(false);
  const [selectedForExchange, setSelectedForExchange] = useState<string[]>([]);

  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExchangeConfirm = () => {
    if (selectedForExchange.length > 0) {
      exchangeTiles(selectedForExchange);
      setSelectedForExchange([]);
      setExchangeMode(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="min-h-[85vh] p-4 md:p-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white rounded-card shadow-card p-6 sm:p-8 border border-lavender/20 text-center flex flex-col items-center"
        >
          <button
            onClick={() => {
              soundService.playClick();
              navigate('/');
            }}
            className="self-start flex items-center gap-1.5 text-warmgray hover:text-charcoal text-xs font-bold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="w-16 h-16 rounded-3xl bg-lavender/20 text-lavender flex items-center justify-center text-3xl mb-3 shadow-inner">
            🔤
          </div>

          <h1 className="text-3xl font-black text-charcoal mb-2">Math Scrabble 📐</h1>
          <p className="text-xs sm:text-sm text-warmgray mb-6 max-w-sm leading-relaxed">
            Bentuk persamaan matematika silang pada papan 15x15. Gunakan ubin kartu di rakmu dan manfaatkan kotak pengganda skor!
          </p>

          <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-lavender/20 text-left text-xs space-y-2">
            <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
            <div className="flex items-start gap-2">
              <span className="text-sm">⭐️</span>
              <span>Langkah pertama harus menutupi titik bintang di tengah papan (7, 7).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">🧮</span>
              <span>Setiap rangkaian yang dibentuk harus berupa <strong>persamaan matematika valid</strong> (contoh: <code className="bg-white px-1.5 py-0.5 rounded font-black text-charcoal">5 + 3 = 8</code> atau <code className="bg-white px-1.5 py-0.5 rounded font-black text-charcoal">7 × 2 = 14</code>).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">✨</span>
              <span>Manfaatkan kotak <strong className="text-rose-600">x2/x3 score</strong> dan <strong className="text-sky-700">x2/x3 point</strong> untuk melipatgandakan perolehan poinmu.</span>
            </div>
          </div>

          {bestScore > 0 && (
            <div className="text-xs font-bold text-warmgray mb-4">
              Skor Terbaik Anda: <strong className="text-charcoal font-black">{bestScore} poin</strong>
            </div>
          )}

          <button
            onClick={() => {
              soundService.playClick();
              startGame(1200);
            }}
            className="w-full py-3.5 rounded-button bg-charcoal hover:bg-black text-white font-extrabold text-base shadow-sm active:scale-95 transition-all"
          >
            Mulai Permainan Solo 🎮
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'finished') {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    return (
      <div className="min-h-[85vh] p-4 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white rounded-card shadow-card p-8 border border-lavender/20 text-center flex flex-col items-center"
        >
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-3xl font-black text-charcoal mb-1">Permainan Selesai!</h2>
          <p className="text-xs text-warmgray mb-6">
            Hasil akhir sesi permainan Math Scrabble Anda:
          </p>

          <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-charcoal/5">
            <div className="text-xs font-bold text-warmgray uppercase">Total Skor</div>
            <div className="text-4xl font-black text-charcoal my-1">{score} <span className="text-sm font-normal text-warmgray">poin</span></div>
            <div className="text-xs text-warmgray mt-2 flex justify-around">
              <span>Putaran: {turn}</span>
              <span>•</span>
              <span>Sisa Ubin: {tileBag.length}</span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                soundService.playClick();
                navigate('/');
              }}
              className="flex-1 py-3 rounded-button border border-warmgray/30 text-charcoal font-bold text-xs hover:bg-gray-50"
            >
              Beranda
            </button>
            <button
              onClick={() => {
                soundService.playClick();
                startGame(1200);
              }}
              className="flex-1 py-3 rounded-button bg-charcoal text-white font-bold text-xs hover:bg-black"
            >
              Main Lagi 🔄
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] max-w-4xl mx-auto w-full px-2 py-2 select-none">
      {/* 1. TOP HEADER: Navigation & Player Banner */}
      <div className="w-full flex items-center justify-between mb-2">
        <button
          onClick={() => setPhase('setup')}
          className="flex items-center gap-1 text-warmgray hover:text-charcoal text-xs font-bold p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <span className="font-black text-charcoal text-sm">Math Scrabble 🔤</span>
        <button
          onClick={() => startGame(1200)}
          className="flex items-center gap-1 text-warmgray hover:text-charcoal text-xs font-bold p-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* 2. CHESS CLOCK & SCORE BANNER (Matching user screenshot) */}
      <div className="w-full bg-[#2C2E43] text-white rounded-2xl p-4 shadow-md mb-2 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          {/* Player Score & Clock Box */}
          <div className="flex-1 bg-white/10 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/70 font-bold">Kamu</div>
              <div className="text-xl font-black font-mono text-mint flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4" />
                <span>{formatClock(timeLeft)}</span>
              </div>
            </div>
            <div className="text-3xl font-black text-white">{score}</div>
          </div>
        </div>

        {/* Match Statistics Row */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs text-white/80 font-bold bg-black/20 py-2 px-3 rounded-xl">
          <div>
            <div className="text-[10px] text-white/50 uppercase">Putaran</div>
            <div className="text-sm font-black text-white">{turn}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/50 uppercase">Sisa Kartu</div>
            <div className="text-sm font-black text-white">{tileBag.length}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/50 uppercase">Six Zero</div>
            <div className="text-sm font-black text-white">{zeroMoves}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/50 uppercase">Jml Lewat</div>
            <div className="text-sm font-black text-white">{passesCount}</div>
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
            className={`mb-2 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-mint/30 text-charcoal border border-mint'
                : feedbackMsg.type === 'error'
                ? 'bg-error/20 text-error border border-error/30'
                : 'bg-sky/20 text-charcoal border border-sky/30'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-mint-700" />
            ) : feedbackMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-error" />
            ) : (
              <Info className="w-4 h-4 text-sky-700" />
            )}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. 15x15 BOARD (Scrollable on small screens) */}
      <div className="flex-1 w-full overflow-auto flex justify-center py-1">
        <div
          className="grid gap-[2px] bg-[#2C2E43] p-1.5 rounded-xl shadow-lg select-none"
          style={{
            gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
            width: '100%',
            maxWidth: '560px',
            aspectRatio: '1 / 1',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const pending = pendingPlacements.find(p => p.r === r && p.c === c);
              const tile = cell.tile || pending?.tile || null;
              const isPending = Boolean(pending);
              const isCenter = r === 7 && c === 7;

              // Determine cell multiplier background & label
              let bgClass = 'bg-white';
              let labelText = '';
              let labelClass = '';

              if (cell.multiplier === 'x3_score') {
                bgClass = 'bg-[#F26B6B]';
                labelText = 'x3 score';
                labelClass = 'text-white';
              } else if (cell.multiplier === 'x2_score') {
                bgClass = 'bg-[#F8A5A5]';
                labelText = 'x2 score';
                labelClass = 'text-white';
              } else if (cell.multiplier === 'x3_point') {
                bgClass = 'bg-[#4A90E2]';
                labelText = 'x3 point';
                labelClass = 'text-white';
              } else if (cell.multiplier === 'x2_point') {
                bgClass = 'bg-[#A8D8EA]';
                labelText = 'x2 point';
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
                    } else if (cell.tile === null && selectedRackTile) {
                      placeTile(r, c);
                    }
                  }}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-[3px] transition-all cursor-pointer overflow-hidden ${bgClass} ${
                    isPending
                      ? 'ring-2 ring-mint ring-offset-1 z-10 animate-pulse'
                      : selectedRackTile && cell.tile === null
                      ? 'hover:opacity-80 hover:scale-95'
                      : ''
                  }`}
                >
                  {/* Empty Multiplier Cell Text */}
                  {!tile && (
                    <>
                      {isCenter ? (
                        <span className="text-sm sm:text-base leading-none">⭐️</span>
                      ) : labelText ? (
                        <span className={`text-[6px] sm:text-[8px] font-black uppercase text-center leading-[9px] ${labelClass}`}>
                          {labelText}
                        </span>
                      ) : null}
                    </>
                  )}

                  {/* Tile Rendered */}
                  {tile && (
                    <div className="w-full h-full bg-[#FFF5DB] border border-[#D8C7A5] rounded-[3px] flex flex-col items-center justify-center relative shadow-xs">
                      <span className="font-black text-xs sm:text-base text-charcoal leading-none">
                        {tile.char}
                      </span>
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] sm:text-[9px] font-black text-warmgray leading-none">
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

      {/* 4. RACK (Rak 8 Ubin) */}
      <div className="w-full mt-2 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-sm px-2 text-xs font-bold text-warmgray mb-1">
          <span>Rak Kartu Anda ({rack.length}/8):</span>
          {pendingPlacements.length > 0 && (
            <button
              onClick={recallAllTiles}
              className="text-xs text-rose-500 hover:underline font-bold"
            >
              Tarik Semua ({pendingPlacements.length})
            </button>
          )}
        </div>

        {/* Tiles Rack Container */}
        <div className="w-full max-w-md bg-[#2C2E43] p-2 sm:p-2.5 rounded-2xl shadow-md border-2 border-charcoal/10 flex justify-center items-center gap-1 sm:gap-2">
          {rack.map(tile => {
            const isSelected = selectedRackTile?.id === tile.id;
            const isMarkedExchange = selectedForExchange.includes(tile.id);

            return (
              <motion.div
                key={tile.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  if (exchangeMode) {
                    setSelectedForExchange(prev =>
                      prev.includes(tile.id) ? prev.filter(id => id !== tile.id) : [...prev, tile.id]
                    );
                  } else {
                    selectRackTile(tile);
                  }
                }}
                className={`w-9 h-11 sm:w-11 sm:h-13 bg-[#FFF5DB] border-2 rounded-xl flex flex-col items-center justify-center relative cursor-pointer shadow-sm transition-all ${
                  isSelected
                    ? 'border-mint ring-3 ring-mint/40 -translate-y-1.5'
                    : isMarkedExchange
                    ? 'border-error bg-error/20 ring-2 ring-error'
                    : 'border-[#D8C7A5]'
                }`}
              >
                <span className="font-black text-sm sm:text-lg text-charcoal leading-none">
                  {tile.char}
                </span>
                <span className="absolute bottom-1 right-1 text-[8px] sm:text-[10px] font-black text-warmgray leading-none">
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

      {/* 5. ACTION BUTTONS (Mainkan, Tukar, Lewat) */}
      <div className="w-full max-w-md mx-auto mt-3 flex flex-col gap-2">
        {exchangeMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setExchangeMode(false);
                setSelectedForExchange([]);
              }}
              className="flex-1 py-3 rounded-button bg-gray-200 text-charcoal font-bold text-xs hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              onClick={handleExchangeConfirm}
              disabled={selectedForExchange.length === 0}
              className="flex-1 py-3 rounded-button bg-charcoal text-white font-extrabold text-xs hover:bg-black disabled:opacity-50"
            >
              Tukar {selectedForExchange.length} Kartu Terpilih 🔄
            </button>
          </div>
        ) : (
          <>
            {/* Primary Action Button: Mainkan */}
            <button
              onClick={playMove}
              disabled={pendingPlacements.length === 0}
              className={`w-full py-3 sm:py-3.5 rounded-button font-black text-sm sm:text-base shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                pendingPlacements.length > 0
                  ? 'bg-[#FFE5A0] hover:bg-[#FFD97D] text-charcoal border-2 border-charcoal/10 ring-2 ring-[#FFE5A0]/50'
                  : 'bg-warmgray/20 text-warmgray/60 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Mainkan ({pendingPlacements.length} Kartu)</span>
            </button>

            {/* Secondary Action Buttons: Tukar & Lewat */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  recallAllTiles();
                  setExchangeMode(true);
                }}
                disabled={tileBag.length === 0}
                className="flex-1 py-2.5 rounded-button bg-[#FFE5A0]/40 hover:bg-[#FFE5A0]/70 text-charcoal font-black text-xs transition-all active:scale-95 disabled:opacity-40"
              >
                Tukar Kartu
              </button>

              <button
                onClick={passTurn}
                className="flex-1 py-2.5 rounded-button bg-[#FFE5A0]/40 hover:bg-[#FFE5A0]/70 text-charcoal font-black text-xs transition-all active:scale-95"
              >
                Lewat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
