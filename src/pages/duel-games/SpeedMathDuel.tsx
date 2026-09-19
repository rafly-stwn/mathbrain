import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { soundService } from '../../services/soundService';
import type { GameId, Difficulty } from '../../types';

interface SpeedMathDuelProps {
  gameId: GameId;
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

export default function SpeedMathDuel({
  gameId,
  difficulty,
  seed,
  onScoreUpdate,
}: SpeedMathDuelProps) {
  const [currentQuestion, setCurrentQuestion] = useState<{ text: string; answer: number }>({ text: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);

  const prngRef = useRef<() => number>(createPrng(seed || 42));
  const inputRef = useRef<HTMLInputElement>(null);

  const generateProblem = useCallback(() => {
    const random = prngRef.current;

    if (gameId === 'speed-multiplication') {
      let a = 2, b = 2;
      if (difficulty === 'easy') {
        a = Math.floor(random() * 8) + 2; // 2-9
        b = Math.floor(random() * 8) + 2;
      } else if (difficulty === 'medium') {
        a = Math.floor(random() * 15) + 10; // 10-24
        b = Math.floor(random() * 8) + 2;
      } else {
        a = Math.floor(random() * 20) + 11; // 11-30
        b = Math.floor(random() * 20) + 11;
      }
      return { text: `${a} × ${b}`, answer: a * b };
    } else {
      // Default: Speed Addition
      let a = 1, b = 1;
      if (difficulty === 'easy') {
        a = Math.floor(random() * 9) + 1;
        b = Math.floor(random() * 9) + 1;
      } else if (difficulty === 'medium') {
        a = Math.floor(random() * 90) + 10;
        b = Math.floor(random() * 90) + 10;
      } else {
        const c = Math.floor(random() * 50) + 10;
        a = Math.floor(random() * 50) + 10;
        b = Math.floor(random() * 50) + 10;
        return { text: `${a} + ${b} + ${c}`, answer: a + b + c };
      }
      return { text: `${a} + ${b}`, answer: a + b };
    }
  }, [gameId, difficulty]);

  useEffect(() => {
    prngRef.current = createPrng((seed || 42) + 1);
    setCurrentQuestion(generateProblem());
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setUserAnswer('');
  }, [seed, generateProblem]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentQuestion]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(userAnswer.trim(), 10);
    if (isNaN(val)) return;

    const isCorrect = val === currentQuestion.answer;

    if (isCorrect) {
      soundService.playCorrect();
      const points = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10;
      const streakBonus = Math.floor(streak / 3) * 5;
      const earned = points + streakBonus;
      const newScore = score + earned;
      const newStreak = streak + 1;
      const newCorrect = correctCount + 1;

      setScore(newScore);
      setStreak(newStreak);
      setCorrectCount(newCorrect);
      setFeedback('correct');

      onScoreUpdate(newScore, newStreak, Math.min(100, Math.round((newCorrect / 25) * 100)));
      setTimeout(() => setFeedback(null), 300);
    } else {
      soundService.playWrong();
      setStreak(0);
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      setFeedback('wrong');

      onScoreUpdate(score, 0, Math.min(100, Math.round((correctCount / 25) * 100)));
      setTimeout(() => setFeedback(null), 400);
    }

    setUserAnswer('');
    setCurrentQuestion(generateProblem());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full bg-white rounded-card shadow-card p-6 sm:p-10 border transition-all relative overflow-hidden flex flex-col items-center text-center ${
        feedback === 'correct'
          ? 'border-mint bg-mint/5 ring-4 ring-mint/20'
          : feedback === 'wrong'
          ? 'border-error bg-error/5 ring-4 ring-error/20'
          : 'border-lavender/20'
      }`}
    >
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-4 right-4 text-mint"
          >
            <CheckCircle className="w-7 h-7" />
          </motion.div>
        )}
        {feedback === 'wrong' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-4 right-4 text-error"
          >
            <XCircle className="w-7 h-7" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream rounded-pill text-xs font-bold text-warmgray mb-4">
        <span className="capitalize">{gameId.replace('-', ' ')}</span>
        <span>•</span>
        <span className="capitalize text-charcoal">{difficulty}</span>
      </div>

      <div className="text-5xl sm:text-7xl font-black text-charcoal tracking-tight my-4 sm:my-6 font-mono">
        {currentQuestion.text}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs mt-2 flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Jawaban..."
          className="w-full text-center text-3xl font-black px-4 py-3.5 rounded-2xl border-2 border-lavender/40 focus:border-lavender focus:outline-none bg-cream/40 transition-all shadow-inner"
          autoFocus
        />

        <button
          type="submit"
          className="w-full py-3.5 rounded-button bg-charcoal hover:bg-black text-white font-extrabold text-base shadow-sm active:scale-95 transition-all"
        >
          Kirim Jawaban ↵
        </button>
      </form>

      <div className="grid grid-cols-3 gap-2 mt-4 sm:hidden w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setUserAnswer((prev) => prev + num.toString())}
            className={`py-2.5 bg-cream/60 hover:bg-cream rounded-xl font-bold text-lg text-charcoal active:scale-90 transition-transform ${
              num === 0 ? 'col-span-2' : ''
            }`}
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setUserAnswer('')}
          className="py-2.5 bg-peach/20 hover:bg-peach/30 rounded-xl font-bold text-xs text-charcoal active:scale-90"
        >
          Clear
        </button>
      </div>
    </motion.div>
  );
}
