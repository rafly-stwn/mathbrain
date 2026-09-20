import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Undo2, Eraser, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DifficultySelector from '../../components/ui/DifficultySelector';
import { useKakuro } from './useKakuro';
import type { Difficulty } from '../../types';
import { useGameStore } from '../../stores/gameStore';

export default function Kakuro() {
  const navigate = useNavigate();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('easy');
  const {
    phase,
    difficulty,
    puzzle,
    userGrid,
    selectedCell,
    elapsedTime,
    mistakes,
    hintsUsed,
    maxHints,
    startGame,
    selectCell,
    inputNumber,
    eraseCell,
    undo,
    getHint,
    restart,
    getRunSum,
  } = useKakuro();

  const scores = useGameStore(state => state.scores);
  const bestScore = (scores['kakuro']?.scores || [])
    .filter(s => s.difficulty === difficulty)
    .sort((a, b) => b.score - a.score)[0]?.score || scores['kakuro']?.bestScore || 0;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== 'playing' || !selectedCell || !puzzle) return;
    const [r, c] = selectedCell;
    
    if (e.key >= '1' && e.key <= '9') {
      inputNumber(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      eraseCell();
    } else if (e.key === 'ArrowUp') {
      let nextR = r - 1;
      while (nextR >= 0 && puzzle.grid[nextR][c].type !== 'white') nextR--;
      if (nextR >= 0) selectCell(nextR, c);
    } else if (e.key === 'ArrowDown') {
      let nextR = r + 1;
      while (nextR < puzzle.rows && puzzle.grid[nextR][c].type !== 'white') nextR++;
      if (nextR < puzzle.rows) selectCell(nextR, c);
    } else if (e.key === 'ArrowLeft') {
      let nextC = c - 1;
      while (nextC >= 0 && puzzle.grid[r][nextC].type !== 'white') nextC--;
      if (nextC >= 0) selectCell(r, nextC);
    } else if (e.key === 'ArrowRight') {
      let nextC = c + 1;
      while (nextC < puzzle.cols && puzzle.grid[r][nextC].type !== 'white') nextC++;
      if (nextC < puzzle.cols) selectCell(r, nextC);
    }
  }, [phase, selectedCell, puzzle, inputNumber, eraseCell, selectCell]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const runs = getRunSum();

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-[#2D3436] p-4 md:p-8 font-nunito">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <div className="max-w-md mx-auto p-4 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="!p-2">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Kakuro</h1>
              </div>

              <Card className="p-6 bg-white border-2 border-peach/50">
                <p className="text-sm md:text-base text-secondary mb-6 text-center font-medium leading-relaxed">
                  Teka-teki silang matematika (Cross-Sums). Isi kotak putih agar jumlah tiap deret angka tepat sama dengan petunjuk segitiga.
                </p>

                {/* Cara Bermain box */}
                <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-lavender/20 text-left text-xs space-y-2">
                  <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">➕</span>
                    <span>Isi kotak putih dengan angka 1 sampai 9.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">🎯</span>
                    <span>Jumlah angka dalam satu deret mendatar/menurun harus sesuai dengan angka petunjuk segitiga.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">🚫</span>
                    <span>Tidak boleh ada angka yang berulang dalam satu deret penjumlahan yang sama.</span>
                  </div>
                </div>

                <div className="flex justify-center mb-3">
                  <DifficultySelector
                    selected={selectedDiff}
                    onChange={setSelectedDiff}
                  />
                </div>

                <div className="text-xs text-center text-secondary mb-6 font-medium">
                  {selectedDiff === 'easy' && 'Mudah: Kisi ringkas, cocok untuk santai'}
                  {selectedDiff === 'medium' && 'Sedang: Kisi silang seimbang, menguji konsistensi'}
                  {selectedDiff === 'hard' && 'Sulit: Kisi besar dengan petunjuk silang kompleks'}
                </div>

                {bestScore > 0 && (
                  <div className="text-center p-3 bg-peach/15 rounded-xl text-charcoal font-bold text-sm mb-6">
                    🏆 Skor Terbaik: {bestScore} poin
                  </div>
                )}

                <div className="flex justify-center">
                  <Button size="lg" className="w-full text-base bg-charcoal hover:bg-black text-white font-black py-3.5" onClick={() => startGame(selectedDiff)}>
                    Mulai Permainan
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {phase === 'playing' && puzzle && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-[20px] shadow-sm">
                <button
                  onClick={() => restart()}
                  className="flex items-center gap-1 text-warmgray hover:text-charcoal text-xs font-bold"
                  title="Kembali ke Pengaturan"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <div className="text-lg font-bold text-[#2D3436]">Kakuro</div>
                <div className="text-xs font-bold text-red-500">
                  Kesalahan: {mistakes}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center mb-6">
                <div className="bg-white p-3 md:p-6 rounded-[24px] shadow-sm overflow-x-auto max-w-full">
                  <div
                    className="grid gap-1 bg-[#2D3436] p-1 rounded-xl"
                    style={{
                      gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {puzzle.grid.map((row, r) =>
                      row.map((cell, c) => {
                        const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                        
                        if (cell.type === 'block') {
                          return (
                            <div
                              key={`${r}-${c}`}
                              className="w-10 h-10 md:w-14 md:h-14 bg-[#2D3436] rounded-md"
                            />
                          );
                        }

                        if (cell.type === 'clue') {
                          return (
                            <div
                              key={`${r}-${c}`}
                              className="w-10 h-10 md:w-14 md:h-14 bg-[#3D4446] rounded-md relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10" />
                              <div className="absolute inset-0 border-t border-l border-white/5" />
                              <svg className="absolute inset-0 w-full h-full">
                                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#2D3436" strokeWidth="2" />
                              </svg>
                              {cell.downClue !== undefined && (
                                <span className="absolute bottom-0.5 left-1 text-[10px] md:text-xs font-bold text-[#FFE5A0]">
                                  {cell.downClue}
                                </span>
                              )}
                              {cell.rightClue !== undefined && (
                                <span className="absolute top-0.5 right-1 text-[10px] md:text-xs font-bold text-[#A8E6CF]">
                                  {cell.rightClue}
                                </span>
                              )}
                            </div>
                          );
                        }

                        // White cell
                        const value = userGrid[r][c];
                        return (
                          <button
                            key={`${r}-${c}`}
                            onClick={() => selectCell(r, c)}
                            className={`w-10 h-10 md:w-14 md:h-14 bg-white rounded-md flex items-center justify-center text-lg md:text-2xl font-bold transition-colors ${
                              isSelected ? 'bg-[#FFB5A7]/30 ring-2 ring-[#FFB5A7]' : 'hover:bg-[#FFF9F5]'
                            }`}
                          >
                            {value !== 0 && value}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {runs && (
                  <div className="flex gap-4 mt-4 text-xs font-bold">
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#FFE5A0]">
                      Baris: <span className={runs.currRowSum > runs.targetRow ? 'text-[#F4BFDB]' : runs.currRowSum === runs.targetRow ? 'text-[#A8E6CF]' : 'text-[#2D3436]'}>{runs.currRowSum}</span> / {runs.targetRow}
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#A8E6CF]">
                      Kolom: <span className={runs.currColSum > runs.targetCol ? 'text-[#F4BFDB]' : runs.currColSum === runs.targetCol ? 'text-[#A8E6CF]' : 'text-[#2D3436]'}>{runs.currColSum}</span> / {runs.targetCol}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-[20px] shadow-sm max-w-sm mx-auto w-full">
                <div className="flex justify-between mb-4">
                  <button onClick={undo} className="p-2.5 rounded-xl bg-[#FFF9F5] hover:bg-[#FFE5A0] transition-colors text-[#636E72] flex flex-col items-center gap-1 flex-1 mx-1">
                    <Undo2 className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Urungkan</span>
                  </button>
                  <button onClick={eraseCell} className="p-2.5 rounded-xl bg-[#FFF9F5] hover:bg-[#F4BFDB] transition-colors text-[#636E72] flex flex-col items-center gap-1 flex-1 mx-1">
                    <Eraser className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Hapus</span>
                  </button>
                  <button
                    onClick={getHint}
                    disabled={hintsUsed >= maxHints}
                    className="p-2.5 rounded-xl bg-[#FFF9F5] hover:bg-[#A8E6CF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#636E72] flex flex-col items-center gap-1 flex-1 mx-1"
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Bantuan ({maxHints - hintsUsed})</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      onClick={() => inputNumber(num)}
                      className="aspect-square flex items-center justify-center text-2xl font-bold bg-[#FFF9F5] hover:bg-[#B8A9E8] hover:text-white rounded-xl transition-all"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[20px] shadow-sm p-8 md:p-12 text-center max-w-md mx-auto"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-[#2D3436] mb-6">Teka-Teki Selesai!</h2>
              
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
                <div className="bg-[#FFF9F5] p-3.5 rounded-2xl">
                  <div className="text-xs text-[#636E72] mb-1 font-semibold">Waktu</div>
                  <div className="text-xl font-bold text-[#A8E6CF]">{formatTime(elapsedTime)}</div>
                </div>
                <div className="bg-[#FFF9F5] p-3.5 rounded-2xl">
                  <div className="text-xs text-[#636E72] mb-1 font-semibold">Kesalahan</div>
                  <div className="text-xl font-bold text-[#F4BFDB]">{mistakes}</div>
                </div>
                <div className="bg-[#FFF9F5] p-3.5 rounded-2xl col-span-2">
                  <div className="text-xs text-[#636E72] mb-1 font-semibold">Total Skor</div>
                  <div className="text-3xl font-bold text-[#B8A9E8]">
                    {Math.max(0, 10000 - elapsedTime * 10 - mistakes * 500)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={restart}
                  className="flex-1 py-3.5 bg-charcoal hover:bg-black text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  Main Lagi 🔄
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#2D3436] rounded-xl font-bold text-sm transition-colors"
                >
                  Beranda
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
