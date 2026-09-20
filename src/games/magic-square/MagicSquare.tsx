import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DifficultySelector from '../../components/ui/DifficultySelector';
import { useGameStore } from '../../stores/gameStore';
import { useMagicSquare } from './useMagicSquare';
import type { Difficulty } from '../../types';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function MagicSquare() {
  const navigate = useNavigate();
  const { addScore, scores } = useGameStore();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('easy');
  
  const {
    state,
    startGame,
    selectCell,
    placeNumber,
    removeNumber,
    getRowSum,
    getColSum,
    getDiagSum,
    playAgain
  } = useMagicSquare();

  const bestScore = (scores['magic-square']?.scores || [])
    .filter(s => s.difficulty === selectedDiff)
    .sort((a, b) => b.score - a.score)[0]?.score || scores['magic-square']?.bestScore || 0;

  useEffect(() => {
    if (state.phase === 'finished') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F4BFDB', '#A8E6CF', '#FFB5A7']
      });

      const finalScore = Math.max(100, 1000 - (state.elapsedTime * 2) - (state.errors * 50));
      addScore('magic-square', {
        gameId: 'magic-square',
        score: finalScore,
        difficulty: state.difficulty,
        date: new Date().toISOString(),
        duration: state.elapsedTime,
        correct: state.gridSize * state.gridSize - (state.difficulty === 'easy' ? 5 : state.difficulty === 'medium' ? 3 : 7),
        wrong: state.errors
      });
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.phase === 'setup') {
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="!p-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-3xl font-bold text-charcoal">Magic Square 🔢</h1>
        </div>

        <Card className="p-6 bg-white border-2 border-rose">
          <p className="text-sm md:text-base text-secondary mb-6 text-center font-medium leading-relaxed">
            Susun angka ke dalam kotak agar jumlah setiap baris, kolom, dan diagonal menghasilkan angka ajaib yang sama!
          </p>

          {/* Cara Bermain box matching Math Scrabble style */}
          <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-lavender/20 text-left text-xs space-y-2">
            <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
            <div className="flex items-start gap-2">
              <span className="text-sm">🔢</span>
              <span>Tempatkan angka ke dalam kisi kotak yang masih kosong.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">⚖️</span>
              <span>Jumlah pada setiap baris, kolom, dan kedua garis diagonal harus bernilai tepat sama (angka 15).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">💡</span>
              <span>Setiap angka hanya boleh digunakan satu kali tanpa ada pengulangan.</span>
            </div>
          </div>

          <div className="flex justify-center mb-3">
            <DifficultySelector
              selected={selectedDiff}
              onChange={setSelectedDiff}
            />
          </div>

          <div className="text-xs text-center text-secondary mb-6 font-medium">
            {selectedDiff === 'easy' && 'Mudah: Kisi 3×3, diberikan 5 petunjuk awal'}
            {selectedDiff === 'medium' && 'Sedang: Kisi 3×3, diberikan 3 petunjuk awal'}
            {selectedDiff === 'hard' && 'Sulit: Kisi 4×4, lebih banyak angka yang harus disusun'}
          </div>

          {bestScore > 0 && (
            <div className="text-center p-3 bg-rose/10 rounded-xl text-rose font-bold text-sm mb-6">
              🏆 Skor Terbaik ({selectedDiff === 'easy' ? 'Mudah' : selectedDiff === 'medium' ? 'Sedang' : 'Sulit'}): {bestScore} poin
            </div>
          )}

          <div className="flex justify-center">
            <Button size="lg" className="w-full text-base bg-charcoal hover:bg-black text-white font-black py-3.5" onClick={() => startGame(selectedDiff)}>
              Mulai Permainan
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (state.phase === 'finished') {
    const finalScore = Math.max(100, 1000 - (state.elapsedTime * 2) - (state.errors * 50));
    
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <h1 className="text-4xl font-bold text-rose">Teka-Teki Selesai! 🎉</h1>
          
          <Card className="p-8 space-y-6">
            <div className="text-xs font-bold text-warmgray uppercase">Total Skor</div>
            <div className="text-6xl font-black text-charcoal">
              {finalScore}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 bg-warmgray/10 rounded-xl">
                <div className="text-xs text-secondary uppercase font-bold">Waktu</div>
                <div className="text-xl font-bold text-charcoal">{formatTime(state.elapsedTime)}</div>
              </div>
              <div className="p-4 bg-rose/10 rounded-xl">
                <div className="text-xs text-rose uppercase font-bold">Kesalahan</div>
                <div className="text-xl font-bold text-rose">{state.errors}</div>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button className="bg-charcoal hover:bg-black text-white font-bold" fullWidth onClick={playAgain}>
                Main Lagi 🔄
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
                Beranda
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="!p-2" title="Kembali ke Beranda">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-xl font-bold text-charcoal">Magic Square 🔢</div>
        <div className="text-xl font-bold text-rose font-mono w-16 text-right">
          {formatTime(state.elapsedTime)}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="px-4 py-2 bg-rose/20 text-rose rounded-full font-bold text-sm sm:text-base border-2 border-rose/30">
          Angka Ajaib: {state.magicNumber}
        </div>
        <div className="text-error font-bold bg-error/10 px-4 py-2 rounded-full text-sm sm:text-base">
          Kesalahan: {state.errors}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative inline-block">
          {/* Main Grid */}
          <div 
            className="grid gap-2 bg-warmgray/20 p-2 rounded-2xl"
            style={{ 
              gridTemplateColumns: `repeat(${state.gridSize}, minmax(0, 1fr))` 
            }}
          >
            {state.grid.map((row, r) => 
              row.map((val, c) => {
                const isSelected = state.selectedCell?.[0] === r && state.selectedCell?.[1] === c;
                const isClue = state.clues[r][c];
                
                return (
                  <motion.div
                    key={`${r}-${c}`}
                    className={`
                      w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-3xl font-bold rounded-xl cursor-pointer select-none transition-colors relative
                      ${isClue ? 'bg-rose/10 text-charcoal' : 'bg-white shadow-sm hover:bg-gray-50 text-charcoal'}
                      ${isSelected ? 'ring-4 ring-rose ring-offset-2 bg-rose/5' : ''}
                    `}
                    onClick={() => {
                      if (!isClue) selectCell(r, c);
                      if (!isClue && val !== null) removeNumber(r, c);
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence mode="popLayout">
                      {val !== null && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className={isClue ? 'text-secondary' : 'text-rose'}
                        >
                          {val}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Sum indicators right */}
          <div className="absolute -right-12 top-0 bottom-0 py-2 flex flex-col justify-around">
            {Array.from({ length: state.gridSize }).map((_, r) => {
              const { sum, complete } = getRowSum(r);
              return (
                <div key={`r-${r}`} className={`text-sm font-bold w-10 text-center ${complete ? (sum === state.magicNumber ? 'text-success' : 'text-error') : 'text-secondary'}`}>
                  {sum > 0 ? sum : ''}
                </div>
              );
            })}
          </div>

          {/* Sum indicators bottom */}
          <div className="absolute -bottom-10 left-0 right-0 px-2 flex justify-around">
            {Array.from({ length: state.gridSize }).map((_, c) => {
              const { sum, complete } = getColSum(c);
              return (
                <div key={`c-${c}`} className={`text-sm font-bold w-16 sm:w-20 text-center ${complete ? (sum === state.magicNumber ? 'text-success' : 'text-error') : 'text-secondary'}`}>
                  {sum > 0 ? sum : ''}
                </div>
              );
            })}
          </div>

          {/* Diagonal main */}
          <div className="absolute -bottom-10 -right-10 w-10 text-center">
             {(() => {
               const { sum, complete } = getDiagSum('main');
               return (
                <div className={`text-sm font-bold ${complete ? (sum === state.magicNumber ? 'text-success' : 'text-error') : 'text-secondary'}`}>
                  {sum > 0 ? `↘${sum}` : ''}
                </div>
               )
             })()}
          </div>
          
          {/* Diagonal anti */}
          <div className="absolute -bottom-10 -left-10 w-10 text-center">
             {(() => {
               const { sum, complete } = getDiagSum('anti');
               return (
                <div className={`text-sm font-bold ${complete ? (sum === state.magicNumber ? 'text-success' : 'text-error') : 'text-secondary'}`}>
                  {sum > 0 ? `↙${sum}` : ''}
                </div>
               )
             })()}
          </div>
        </div>
      </div>

      {/* Number Pad */}
      <div className="mt-8 mb-4">
        <div className="flex justify-center gap-2 max-w-sm mx-auto">
          {Array.from({ length: state.gridSize * state.gridSize }, (_, i) => i + 1).map((num) => {
            const isUsed = state.grid.some(row => row.includes(num));
            return (
              <Button
                key={num}
                variant="secondary"
                disabled={isUsed || state.selectedCell === null}
                onClick={() => placeNumber(num)}
                className={`flex-1 !h-12 !p-0 font-bold text-lg ${isUsed ? 'opacity-30' : ''}`}
              >
                {num}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
