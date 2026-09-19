import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DifficultySelector from '../../components/ui/DifficultySelector';
import InstructionModal from '../../components/ui/InstructionModal';
import { useSpeedMultiplication } from './useSpeedMultiplication';
import { useGameStore } from '../../stores/gameStore';
import type { Difficulty } from '../../types';
import { Play, RotateCcw, Home, Trophy, Target, Zap, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function SpeedMultiplication() {
  const navigate = useNavigate();
  const {
    phase,
    timeLeft,
    score,
    streak,
    bestStreak,
    correct,
    wrong,
    currentProblem,
    history,
    startGame,
    submitAnswer,
    resetGame
  } = useSpeedMultiplication();

  const [input, setInput] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { settings, markInstructionSeen, scores } = useGameStore();
  const [showInstructions, setShowInstructions] = useState(!settings.instructionsSeen['speed-multiplication']);
  
  const bestScore = scores['speed-multiplication']?.bestScore || 0;

  useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, currentProblem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const answer = parseInt(input, 10);
    if (!isNaN(answer)) {
      submitAnswer(answer);
      setInput('');
    }
  };

  const handleStart = () => {
    startGame(selectedDifficulty);
  };

  if (showInstructions) {
    return (
      <InstructionModal
        gameId="speed-multiplication"
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onStart={() => {
          setShowInstructions(false);
          markInstructionSeen('speed-multiplication');
        }}
      />
    );
  }

  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-start">
          <Button variant="secondary" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Kembali ke Beranda
          </Button>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-4 bg-lemon/20 rounded-full mb-2">
            <Zap className="w-10 h-10 text-lemon" />
          </div>
          <h1 className="text-4xl font-bold text-charcoal">Perkalian Cepat ✖️</h1>
          <p className="text-base text-secondary max-w-lg mx-auto leading-relaxed">
            Tantang kemampuan perkalian dalam tekanan waktu 60 detik. Buktikan seberapa cepat dan akurat kalkulasi angka Anda!
          </p>
        </div>

        {/* Cara Bermain box matching Math Scrabble style */}
        <div className="w-full bg-cream/70 rounded-2xl p-4 border border-lavender/20 text-left text-xs space-y-2">
          <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
          <div className="flex items-start gap-2">
            <span className="text-sm">✖️</span>
            <span>Selesaikan operasi perkalian angka yang muncul di layar secepat mungkin.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm">⌨️</span>
            <span>Ketik angka jawaban pada kolom input lalu tekan <strong>Enter</strong>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm">🔥</span>
            <span>Pertahankan streak jawaban benar tanpa salah untuk meraih skor tertinggi!</span>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-charcoal flex items-center gap-2">
                <Trophy className="w-5 h-5 text-lemon" />
                Skor Terbaik: {bestScore} poin
              </h2>
              <Button variant="ghost" onClick={() => setShowInstructions(true)} className="text-xs font-bold text-warmgray">
                Panduan
              </Button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-charcoal">
                Pilih Tingkat Kesulitan
              </label>
              <div className="flex justify-center">
                <DifficultySelector
                  selected={selectedDifficulty}
                  onChange={setSelectedDifficulty}
                />
              </div>
              
              <div className="mt-3 text-xs text-secondary text-center p-3 bg-warmgray/10 rounded-xl font-medium">
                {selectedDifficulty === 'easy' && 'Mudah: Perkalian 1 digit (contoh: 7 × 8)'}
                {selectedDifficulty === 'medium' && 'Sedang: Campuran 2 digit dan 1 digit (contoh: 24 × 7)'}
                {selectedDifficulty === 'hard' && 'Sulit: Perkalian 2 digit (contoh: 15 × 23)'}
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              onClick={handleStart}
              className="mt-6 bg-charcoal hover:bg-black text-white font-black py-4 text-base"
            >
              <Play className="w-5 h-5 mr-2" />
              Mulai Permainan 🎮
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={resetGame}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
            title="Kembali ke Pengaturan"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold hidden md:block">Perkalian Cepat ✖️</h2>
          <div className={`px-4 py-1.5 rounded-full font-bold text-lg transition-colors ${
            timeLeft < 10 ? 'bg-red-500/30 text-red-600 animate-pulse' : 'bg-lemon/30 text-charcoal'
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

        {/* Problem Card */}
        <Card className="relative w-full min-h-[240px] bg-white flex flex-col items-center justify-center p-8 overflow-hidden rounded-[20px] shadow-sm">
          <div className="text-5xl md:text-7xl font-bold tracking-wider z-10">
            {currentProblem.a} × {currentProblem.b} = ?
          </div>
        </Card>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-48 text-center text-3xl font-bold p-4 rounded-button border-2 border-lemon focus:border-charcoal focus:outline-none transition-colors shadow-sm"
            placeholder="?"
            autoFocus
          />
        </form>

        {/* Progress Bar */}
        <div className="fixed bottom-0 left-0 w-full h-2 bg-lemon/20">
          <div
            className="h-full bg-lemon transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Finished phase
  const totalAnswers = correct + wrong;
  const accuracy = totalAnswers > 0 ? Math.round((correct / totalAnswers) * 100) : 0;
  const isNewBest = score > bestScore;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-charcoal">Waktu Habis! ⏱️</h1>
        {isNewBest && (
          <div className="inline-block px-4 py-1 bg-lemon text-charcoal font-bold rounded-full text-sm mb-2 animate-bounce">
            Rekor Skor Baru! 🎉
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 text-center space-y-2 bg-gradient-to-br from-white to-lemon/10">
          <div className="text-secondary font-medium">Skor Akhir</div>
          <div className="text-5xl font-bold text-charcoal">{score}</div>
        </Card>
        
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-secondary">
                <Target className="w-4 h-4" /> Akurasi
              </div>
              <div className="text-xl font-bold text-charcoal">{accuracy}%</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-secondary">
                <Zap className="w-4 h-4 text-lemon" /> Streak Terbaik
              </div>
              <div className="text-xl font-bold text-charcoal">{bestStreak}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-success">
                <CheckCircle className="w-4 h-4" /> Benar
              </div>
              <div className="text-xl font-bold text-charcoal">{correct}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-error">
                <XCircle className="w-4 h-4" /> Salah
              </div>
              <div className="text-xl font-bold text-charcoal">{wrong}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button size="lg" fullWidth onClick={resetGame} className="bg-charcoal hover:bg-black text-white font-bold">
          <RotateCcw className="w-5 h-5 mr-2" />
          Main Lagi 🔄
        </Button>
        <Button size="lg" variant="secondary" fullWidth onClick={() => navigate('/')}>
          <Home className="w-5 h-5 mr-2" />
          Kembali ke Beranda
        </Button>
      </div>

      {history.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-charcoal mb-4">Riwayat Soal Terakhir</h3>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
            {history.slice().reverse().map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-warmgray/10">
                <div className="font-mono text-lg font-medium text-charcoal">{item.problem}</div>
                <div className="flex items-center gap-4">
                  <div className={`font-mono font-bold ${item.isCorrect ? 'text-success' : 'text-error line-through'}`}>
                    {item.userAnswer}
                  </div>
                  {!item.isCorrect && (
                    <div className="font-mono font-bold text-success">
                      {item.correctAnswer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
