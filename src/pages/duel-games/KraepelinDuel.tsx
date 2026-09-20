import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { Difficulty } from '../../types';

interface KraepelinDuelProps {
  difficulty: Difficulty;
  seed: number;
  onScoreUpdate: (score: number, streak: number, progress?: number) => void;
  onFinish?: (finalScore: number) => void;
}

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function KraepelinDuel({
  difficulty,
  seed,
  onScoreUpdate,
}: KraepelinDuelProps) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const activeRowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize column from seed
  useEffect(() => {
    const random = createPrng(seed || 9999);
    // Generate 50 single digits (1-9)
    const list: number[] = [];
    for (let i = 0; i < 50; i++) {
      list.push(Math.floor(random() * 9) + 1);
    }
    setNumbers(list);
    setCurrentIndex(0);
    setAnswers([]);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setFeedback(null);
  }, [seed, difficulty]);

  // Keep active row centered in viewport
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  const submitDigit = useCallback((digit: number) => {
    if (numbers.length < 2 || currentIndex >= numbers.length - 1) return;

    const n1 = numbers[currentIndex];
    const n2 = numbers[currentIndex + 1];
    const expected = (n1 + n2) % 10;
    const isCorrect = digit === expected;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = digit;
    setAnswers(newAnswers);

    if (isCorrect) {
      soundService.playCorrect();
      const earned = 10 + Math.floor(streak / 3) * 5;
      const newScore = score + earned;
      const newStreak = streak + 1;
      const newCorrect = correctCount + 1;

      setScore(newScore);
      setStreak(newStreak);
      setCorrectCount(newCorrect);
      setFeedback('correct');

      const progress = Math.min(100, Math.round((newCorrect / (numbers.length - 1)) * 100));
      onScoreUpdate(newScore, newStreak, progress);
      setTimeout(() => setFeedback(null), 250);
    } else {
      soundService.playWrong();
      setStreak(0);
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setFeedback('wrong');

      const progress = Math.min(100, Math.round((correctCount / (numbers.length - 1)) * 100));
      onScoreUpdate(score, 0, progress);
      setTimeout(() => setFeedback(null), 350);
    }

    setCurrentIndex(prev => prev + 1);
  }, [numbers, currentIndex, answers, score, streak, correctCount, wrongCount, onScoreUpdate]);

  // Keyboard support (0-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        submitDigit(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitDigit]);

  const currentPairSum = numbers.length > currentIndex + 1
    ? (numbers[currentIndex] + numbers[currentIndex + 1]) % 10
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white rounded-card shadow-card p-4 sm:p-6 border border-lavender/20 flex flex-col items-center relative overflow-hidden"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-lavender/15 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky/15 text-sky-800 rounded-pill text-xs font-bold">
          <span>Tes Kraepelin</span>
          <span>•</span>
          <span className="capitalize">{difficulty}</span>
        </div>
        <div className="text-xs font-bold text-warmgray">
          Posisi: <span className="text-charcoal font-black">{currentIndex + 1}</span> / {Math.max(1, numbers.length - 1)}
        </div>
      </div>

      {/* Guide prompt */}
      <div className="text-xs sm:text-sm text-warmgray mb-2 text-center">
        Jumlahkan 2 angka berurutan, masukkan <strong className="text-sky-700 font-black">digit satuan</strong> ({`(a + b) % 10`})
      </div>

      {/* Vertical Tape Container */}
      <div
        ref={containerRef}
        className="w-full max-w-xs h-56 sm:h-64 overflow-y-auto relative rounded-2xl bg-cream/40 border-2 border-lavender/30 py-4 px-6 flex justify-center shadow-inner hide-scrollbar"
      >
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-3 right-3 text-mint z-20"
            >
              <CheckCircle className="w-6 h-6" />
            </motion.div>
          )}
          {feedback === 'wrong' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-3 right-3 text-error z-20"
            >
              <XCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 sm:gap-6 items-start">
          {/* Numbers Column */}
          <div className="flex flex-col">
            {numbers.map((num, i) => (
              <div
                key={`num-${i}`}
                className={`h-14 flex items-center justify-center text-3xl sm:text-4xl font-black w-14 transition-all ${
                  i === currentIndex || i === currentIndex + 1
                    ? 'text-charcoal scale-110'
                    : 'text-charcoal/40'
                }`}
              >
                {num}
              </div>
            ))}
          </div>

          {/* Answer Boxes Column (offset between adjacent rows) */}
          <div className="flex flex-col pt-7">
            {numbers.slice(0, -1).map((_, i) => {
              const isCurrent = i === currentIndex;
              const hasAnswer = answers[i] !== undefined;
              const ans = answers[i];
              const expected = (numbers[i] + numbers[i + 1]) % 10;
              const isCorrect = hasAnswer && ans === expected;

              return (
                <div
                  key={`ans-${i}`}
                  ref={isCurrent ? activeRowRef : null}
                  className="h-14 flex items-center"
                >
                  <div
                    className={`w-14 h-11 sm:w-16 sm:h-12 rounded-xl flex items-center justify-center text-2xl font-black transition-all ${
                      isCurrent
                        ? 'border-4 border-sky bg-white shadow-md scale-110 z-10 text-charcoal ring-2 ring-sky/30 animate-pulse'
                        : 'border-2'
                    } ${
                      hasAnswer
                        ? isCorrect
                          ? 'bg-mint/20 border-mint text-mint-800'
                          : 'bg-error/20 border-error text-error'
                        : isCurrent
                        ? 'bg-white'
                        : 'border-warmgray/30 bg-white/40 text-transparent'
                    }`}
                  >
                    {hasAnswer ? ans : isCurrent ? '?' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active calculation preview */}
      {currentPairSum !== null && (
        <div className="mt-2 text-center text-xs font-bold text-warmgray">
          {numbers[currentIndex]} + {numbers[currentIndex + 1]} = ?
        </div>
      )}

      {/* Onscreen Numpad for Mobile & Touch */}
      <div className="w-full max-w-sm grid grid-cols-5 gap-2 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
          <button
            key={digit}
            type="button"
            onClick={() => submitDigit(digit)}
            className="bg-cream hover:bg-sky/20 active:bg-sky text-charcoal active:text-white rounded-xl h-12 text-xl font-black transition-all shadow-sm active:scale-90 border border-lavender/30"
          >
            {digit}
          </button>
        ))}
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
    </motion.div>
  );
}
