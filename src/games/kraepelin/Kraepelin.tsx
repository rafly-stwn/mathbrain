import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Zap, Target, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useKraepelin } from './useKraepelin';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DifficultySelector from '../../components/ui/DifficultySelector';

export default function Kraepelin() {
  const navigate = useNavigate();
  const {
    phase,
    difficulty,
    setDifficulty,
    columns,
    currentColumnIndex,
    currentRowIndex,
    answers,
    correctCounts,
    timeLeftInColumn,
    totalCorrect,
    totalWrong,
    totalAnswered,
    bestScore,
    startGame,
    submitDigit,
    setPhase
  } = useKraepelin();

  const [showTransition, setShowTransition] = useState(false);
  const prevColIndexRef = useRef(currentColumnIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      if (e.key >= '0' && e.key <= '9') {
        submitDigit(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, submitDigit]);

  useEffect(() => {
    if (phase === 'playing' && currentColumnIndex !== prevColIndexRef.current) {
      setShowTransition(true);
      const t = setTimeout(() => setShowTransition(false), 800);
      prevColIndexRef.current = currentColumnIndex;
      return () => clearTimeout(t);
    }
  }, [currentColumnIndex, phase]);

  const activeRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentRowIndex, currentColumnIndex]);

  useEffect(() => {
    if (phase === 'finished' && totalCorrect > 0 && totalCorrect >= bestScore) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A8D8EA', '#B8A9E8', '#FFB5A7', '#FFE5A0', '#A8E6CF']
      });
    }
  }, [phase, totalCorrect, bestScore]);

  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="!p-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Tes Kraepelin</h1>
        </div>

        <Card className="p-6 bg-white border-2 border-sky">
          <p className="text-sm md:text-base text-secondary mb-6 text-center font-medium leading-relaxed">
            Tes psikologi hitung koran legendaris. Jumlahkan 2 angka bersebelahan secara vertikal dan ketik digit satuannya secepat mungkin.
          </p>

          {/* Cara Bermain box */}
          <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-lavender/20 text-left text-xs space-y-2">
            <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
            <div className="flex items-start gap-2">
              <span className="text-sm">📰</span>
              <span>Jumlahkan 2 angka bersebelahan dari bawah ke atas pada kolom vertikal.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">🔢</span>
              <span>Ketik HANYA <strong>digit satuan</strong> hasil penjumlahan:</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl text-center font-mono font-bold text-xs space-y-1 my-1">
              <div>3 + 7 = 10 ➔ ketik <span className="text-sky font-black text-sm">0</span></div>
              <div>7 + 2 = 9 ➔ ketik <span className="text-sky font-black text-sm">9</span></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">⚡</span>
              <span>Jaga kecepatan dan ketelitian hingga waktu di tiap kolom berganti otomatis.</span>
            </div>
          </div>

          <div className="flex justify-center mb-3">
            <DifficultySelector
              selected={difficulty}
              onChange={setDifficulty}
            />
          </div>

          <div className="text-xs text-center text-secondary mb-6 font-medium">
            {difficulty === 'easy' && 'Mudah: 5 kolom (60 detik per kolom)'}
            {difficulty === 'medium' && 'Sedang: 8 kolom (45 detik per kolom)'}
            {difficulty === 'hard' && 'Sulit: 10 kolom (30 detik per kolom)'}
          </div>

          {bestScore > 0 && (
            <div className="text-center p-3 bg-sky/20 rounded-xl text-charcoal font-bold text-sm mb-6">
              🏆 Skor Terbaik: {bestScore} poin
            </div>
          )}

          <div className="flex justify-center">
            <Button size="lg" onClick={startGame} className="w-full text-base bg-charcoal hover:bg-black text-white font-black py-3.5">
              Mulai Permainan
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'finished') {
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const isNewBest = totalCorrect > 0 && totalCorrect >= bestScore;
    const maxCorrect = Math.max(...correctCounts, 1);

    return (
      <div className="min-h-screen bg-[#FFF9F5] p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 mt-4">
            <h1 className="text-4xl font-bold text-charcoal">Tes Selesai! 🎉</h1>
            {isNewBest && (
              <span className="inline-block bg-lemon text-charcoal text-xs font-bold px-3 py-1 rounded-full mt-3 uppercase tracking-wider animate-bounce">
                Rekor Skor Baru!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <Target className="w-7 h-7 text-sky mb-2" />
              <div className="text-3xl font-bold text-charcoal">{totalCorrect}</div>
              <div className="text-xs text-charcoal/60 font-semibold">Total Benar</div>
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <BarChart2 className="w-7 h-7 text-rose mb-2" />
              <div className="text-3xl font-bold text-charcoal">{totalWrong}</div>
              <div className="text-xs text-charcoal/60 font-semibold">Total Salah</div>
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <Zap className="w-7 h-7 text-mint mb-2" />
              <div className="text-3xl font-bold text-charcoal">{accuracy}%</div>
              <div className="text-xs text-charcoal/60 font-semibold">Akurasi</div>
            </Card>
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <Brain className="w-7 h-7 text-lavender mb-2" />
              <div className="text-3xl font-bold text-charcoal">{totalAnswered}</div>
              <div className="text-xs text-charcoal/60 font-semibold">Total Terjawab</div>
            </Card>
          </div>

          <Card className="p-6 md:p-8 mb-8 border-t-4 border-t-sky">
            <h3 className="text-lg font-bold text-charcoal mb-6 text-center">Kurva Performa Ritme Hitung</h3>
            <div className="flex items-end justify-between h-48 gap-2 md:gap-4 px-2 md:px-8 border-b-2 border-charcoal/10 pb-2 relative">
              {correctCounts.map((count, idx) => {
                const heightPercentage = (count / maxCorrect) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex justify-center h-full items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercentage}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                        className="w-full max-w-[40px] bg-sky rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity relative"
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-charcoal opacity-0 group-hover:opacity-100 transition-opacity">
                          {count}
                        </div>
                      </motion.div>
                    </div>
                    <div className="text-xs text-charcoal/50 mt-4 font-semibold">Kolom {idx + 1}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-charcoal/60 mt-4">
              Kurva yang stabil atau sedikit meningkat menunjukkan ketahanan dan konsentrasi yang prima.
            </p>
          </Card>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => setPhase('setup')} size="lg" className="bg-charcoal hover:bg-black text-white font-bold">
              Main Lagi 🔄
            </Button>
            <Button onClick={() => navigate('/')} variant="secondary" size="lg">
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentColumn = columns[currentColumnIndex] || [];
  const currentAnswers = answers[currentColumnIndex] || [];
  const totalCols = columns.length;
  const isDangerTime = timeLeftInColumn <= 10;
  
  return (
    <div className="min-h-screen bg-[#FFF9F5] flex flex-col relative overflow-hidden">
      <div className="bg-white px-4 md:px-8 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <button 
          onClick={() => setPhase('setup')}
          className="text-charcoal/60 hover:text-charcoal transition-colors p-2 -ml-2"
          title="Kembali ke Pengaturan"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold text-charcoal/50 uppercase tracking-widest mb-1">
            Kolom {currentColumnIndex + 1} dari {totalCols}
          </div>
          <div className="flex gap-1.5">
            {columns.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentColumnIndex ? 'bg-sky scale-125' : 
                  i < currentColumnIndex ? 'bg-sky/40' : 'bg-warmgray'
                }`} 
              />
            ))}
          </div>
        </div>
        
        <div className={`px-4 py-1.5 rounded-full font-bold text-lg transition-colors ${
          isDangerTime ? 'bg-error/10 text-error animate-pulse' : 'bg-sky/10 text-sky'
        }`}>
          {timeLeftInColumn}s
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative py-12 hide-scrollbar">
        <AnimatePresence>
          {showTransition && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#FFF9F5]/80 backdrop-blur-sm pointer-events-none"
            >
              <div className="text-4xl font-bold text-sky">Kolom Berikutnya!</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-md mx-auto px-4 flex justify-center">
          <div className="flex gap-4 md:gap-8 items-start relative pb-64">
            
            <div className="flex flex-col">
              {currentColumn.map((num, i) => (
                <div 
                  key={`num-${i}`} 
                  className="h-16 flex items-center justify-center text-4xl font-bold text-charcoal w-16"
                >
                  {num}
                </div>
              ))}
            </div>

            <div className="flex flex-col pt-8">
              {currentColumn.slice(0, -1).map((_, i) => {
                const isCurrent = i === currentRowIndex;
                const answer = currentAnswers[i];
                const hasAnswer = answer !== undefined;
                const isCorrect = hasAnswer && answer === (currentColumn[i] + currentColumn[i+1]) % 10;
                
                return (
                  <div 
                    key={`ans-${i}`} 
                    ref={isCurrent ? activeRowRef : null}
                    className="h-16 flex items-center"
                  >
                    <div className={`
                      w-16 h-12 md:w-20 md:h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all
                      ${isCurrent ? 'border-4 border-sky bg-white shadow-md scale-110 z-10' : 'border-2'}
                      ${hasAnswer ? (
                        isCorrect ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'
                      ) : (
                        isCurrent ? 'text-charcoal' : 'border-warmgray bg-white/50 text-transparent'
                      )}
                    `}>
                      {hasAnswer ? answer : (isCurrent ? '_' : '')}
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-charcoal/10 p-4 pb-8 md:pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 relative">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-2 md:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
            <button
              key={digit}
              onPointerDown={(e) => {
                e.preventDefault();
                submitDigit(digit);
              }}
              className="bg-warmgray/20 hover:bg-sky/20 active:bg-sky text-charcoal active:text-white rounded-2xl h-14 md:h-16 text-2xl font-bold transition-colors shadow-sm"
            >
              {digit}
            </button>
          ))}
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
