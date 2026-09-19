import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

import { useSpeedAddition } from './useSpeedAddition';
import { useGameStore } from '../../stores/gameStore';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DifficultySelector from '../../components/ui/DifficultySelector';
import type { Difficulty } from '../../types';

const SpeedAddition: React.FC = () => {
  const navigate = useNavigate();
  const {
    phase,
    difficulty,
    setDifficulty,
    timeLeft,
    score,
    streak,
    bestStreak,
    correct,
    wrong,
    currentProblem,
    feedback,
    history,
    startGame,
    submitAnswer,
    restart
  } = useSpeedAddition();

  const store = useGameStore();
  const bestScoreInfo = store.scores['speed-addition'];
  const bestScore = bestScoreInfo?.bestScore || 0;

  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, currentProblem, feedback]);

  useEffect(() => {
    if (phase === 'finished' && score > 0 && score >= bestScore) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [phase, score, bestScore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal) return;
    const num = parseInt(inputVal, 10);
    if (!isNaN(num)) {
      submitAnswer(num);
    }
    setInputVal('');
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficulty(diff);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2D3436] font-sans overflow-x-hidden">
      {/* Container */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {phase === 'setup' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="w-full flex justify-start">
              <Button variant="secondary" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Beranda
              </Button>
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Penjumlahan Cepat ⚡</h1>
              <p className="text-base md:text-lg text-[#636E72] max-w-lg mx-auto leading-relaxed">
                Selesaikan sebanyak mungkin operasi penjumlahan dalam 60 detik. Uji ketangkasan hitung dan konsentrasi mentalmu!
              </p>
            </div>

            {/* Cara Bermain box matching Math Scrabble style */}
            <div className="w-full max-w-md bg-cream/70 rounded-2xl p-4 border border-lavender/20 text-left text-xs space-y-2">
              <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
              <div className="flex items-start gap-2">
                <span className="text-sm">⚡</span>
                <span>Jawab soal penjumlahan yang muncul di layar secepat dan setepat mungkin.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm">⌨️</span>
                <span>Ketik angka jawaban pada kotak input lalu tekan <strong>Enter</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm">🔥</span>
                <span>Pertahankan streak jawaban benar tanpa salah untuk meraih skor tertinggi!</span>
              </div>
            </div>

            <Card className="w-full max-w-md p-6 bg-white rounded-[20px]">
              <h2 className="text-lg font-bold mb-4">Pilih Tingkat Kesulitan</h2>
              <div className="flex justify-center mb-3">
                <DifficultySelector selected={difficulty} onChange={handleDifficultyChange} />
              </div>
              <div className="text-xs text-[#636E72] bg-[#B8A9E8]/10 p-3 rounded-lg font-medium">
                {difficulty === 'easy' && 'Mudah: Penjumlahan angka 1 digit (contoh: 3 + 7)'}
                {difficulty === 'medium' && 'Sedang: Penjumlahan angka 2 digit (contoh: 24 + 58)'}
                {difficulty === 'hard' && 'Sulit: Penjumlahan 3 angka (contoh: 24 + 58 + 13)'}
              </div>
            </Card>

            {bestScore > 0 && (
              <div className="text-base font-semibold text-emerald-600">
                🏆 Skor Terbaik Anda: {bestScore} poin
              </div>
            )}

            <Button variant="primary" size="lg" className="w-full max-w-md py-4 text-lg font-black bg-charcoal hover:bg-black text-white" onClick={startGame}>
              Mulai Permainan 🎮
            </Button>
          </motion.div>
        )}

        {phase === 'playing' && (
          <div className="flex flex-col space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button 
                onClick={restart}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Kembali ke Pengaturan"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold hidden md:block">Penjumlahan Cepat ⚡</h2>
              <div className={`px-4 py-1.5 rounded-full font-bold text-lg transition-colors ${
                timeLeft < 10 ? 'bg-red-500/30 text-red-600 animate-pulse' : 'bg-[#B8A9E8]/20'
              }`}>
                ⏱ {timeLeft}s
              </div>
            </div>

            {/* Score & Streak */}
            <div className="flex justify-between items-end px-2">
              <div className="text-2xl font-bold">Skor: {score}</div>
              {streak > 0 && (
                <div className="text-xl font-bold text-[#F4BFDB]">
                  Streak: 🔥 {streak}
                </div>
              )}
            </div>

            {/* Main Card */}
            <Card className="relative w-full min-h-[240px] bg-white flex flex-col items-center justify-center p-8 overflow-hidden rounded-[20px] shadow-sm">
              <div className="text-5xl md:text-7xl font-bold tracking-wider z-10">
                {currentProblem.c 
                  ? `${currentProblem.a} + ${currentProblem.b} + ${currentProblem.c} = ?`
                  : `${currentProblem.a} + ${currentProblem.b} = ?`
                }
              </div>

              <AnimatePresence>
                {feedback === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="absolute inset-0 flex items-center justify-center bg-[#A8E6CF]/20 z-0 pointer-events-none"
                  >
                    <CheckCircle2 className="w-32 h-32 text-[#A8E6CF] opacity-50" />
                  </motion.div>
                )}
                {feedback === 'wrong' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-0 pointer-events-none"
                  >
                    <XCircle className="w-32 h-32 text-red-500 opacity-50" />
                    <div className="absolute bottom-8 text-xl font-bold text-red-600">
                      Jawaban Benar: {history[0]?.correctAnswer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center mt-8">
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                className="w-48 text-center text-3xl font-bold p-4 rounded-xl border-2 border-[#B8A9E8] focus:border-[#2D3436] focus:outline-none transition-colors shadow-sm"
                placeholder="?"
                autoFocus
              />
            </form>

            {/* Progress Bar */}
            <div className="fixed bottom-0 left-0 w-full h-2 bg-[#B8A9E8]/20">
              <div 
                className="h-full bg-[#B8A9E8] transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>
        )}

        {phase === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold">Waktu Habis! ⏱️</h2>
            
            {score >= bestScore && score > 0 && (
              <div className="text-2xl font-bold text-emerald-600 animate-bounce">
                🎉 Rekor Skor Baru! 🎉
              </div>
            )}

            <Card className="w-full max-w-md p-8 text-center bg-white rounded-[20px]">
              <div className="text-sm font-bold text-warmgray uppercase mb-1">Total Skor</div>
              <div className="text-6xl font-bold mb-6">{score}</div>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-[#B8A9E8]/10 p-3 rounded-lg">
                  <div className="text-xs text-[#636E72] font-semibold">Benar</div>
                  <div className="text-xl font-bold text-emerald-600">{correct}</div>
                </div>
                <div className="bg-[#B8A9E8]/10 p-3 rounded-lg">
                  <div className="text-xs text-[#636E72] font-semibold">Salah</div>
                  <div className="text-xl font-bold text-red-500">{wrong}</div>
                </div>
                <div className="bg-[#B8A9E8]/10 p-3 rounded-lg">
                  <div className="text-xs text-[#636E72] font-semibold">Streak Terbaik</div>
                  <div className="text-xl font-bold text-[#F4BFDB]">🔥 {bestStreak}</div>
                </div>
                <div className="bg-[#B8A9E8]/10 p-3 rounded-lg">
                  <div className="text-xs text-[#636E72] font-semibold">Akurasi</div>
                  <div className="text-xl font-bold text-[#A8D8EA]">
                    {correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0}%
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row w-full max-w-md gap-4">
              <Button variant="primary" size="lg" className="flex-1 bg-charcoal hover:bg-black text-white font-bold" onClick={restart}>
                Main Lagi 🔄
              </Button>
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate('/')}>
                Kembali ke Beranda
              </Button>
            </div>

            {history.length > 0 && (
              <div className="w-full max-w-md mt-6">
                <h3 className="text-base font-bold mb-3">Riwayat Jawaban Terakhir</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {history.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="font-semibold">{item.problem}</div>
                      <div className="flex items-center space-x-4">
                        <span className={item.isCorrect ? 'text-[#A8E6CF] line-through opacity-0' : 'text-red-500 line-through text-sm'}>
                          {!item.isCorrect && item.userAnswer}
                        </span>
                        <span className="font-bold text-lg w-8 text-right">
                          {item.correctAnswer}
                        </span>
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-[#A8E6CF]" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SpeedAddition;
