import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Eraser, Pencil, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DifficultySelector from '../../components/ui/DifficultySelector';
import { useSudoku } from './useSudoku';
import { useGameStore } from '../../stores/gameStore';
import type { Difficulty } from '../../types';

export default function Sudoku() {
  const navigate = useNavigate();
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('easy');
  const { scores } = useGameStore();
  const {
    phase,
    setPhase,
    difficulty,
    grid,
    initialClues,
    solution,
    notes,
    selectedCell,
    isNotesMode,
    mistakes,
    maxMistakes,
    elapsedTime,
    hintsUsed,
    maxHints,
    historyLength,
    startGame,
    selectCell,
    inputNumber,
    eraseCell,
    toggleNotesMode,
    undo,
    getHint,
    restart
  } = useSudoku();

  // Keyboard navigation and input
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key >= '1' && e.key <= '9') {
        inputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseCell();
      } else if (e.key.toLowerCase() === 'n') {
        toggleNotesMode();
      } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        undo();
      } else if (selectedCell) {
        const [r, c] = selectedCell;
        if (e.key === 'ArrowUp' && r > 0) selectCell(r - 1, c);
        if (e.key === 'ArrowDown' && r < 8) selectCell(r + 1, c);
        if (e.key === 'ArrowLeft' && c > 0) selectCell(r, c - 1);
        if (e.key === 'ArrowRight' && c < 8) selectCell(r, c + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selectedCell, inputNumber, eraseCell, toggleNotesMode, undo, selectCell]);

  useEffect(() => {
    if (phase === 'finished' && mistakes < maxMistakes) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#B8A9E8', '#FFB5A7', '#A8E6CF', '#A8D8EA', '#FFE5A0', '#F4BFDB']
      });
    }
  }, [phase, mistakes, maxMistakes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const numberCounts = useMemo(() => {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = grid[r][c];
        // Only count correctly placed numbers or initial clues
        if (val !== null && (initialClues[r][c] || val === solution[r][c])) {
          counts[val]++;
        }
      }
    }
    return counts;
  }, [grid, initialClues, solution]);

  const getBestScore = (diff: Difficulty) => {
    return (scores['sudoku']?.scores || []).filter(s => s.difficulty === diff).sort((a, b) => b.score - a.score)[0]?.score || scores['sudoku']?.bestScore || 0;
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="!p-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Sudoku 🧩</h1>
        </div>

        <Card className="p-6 bg-white border-2 border-lavender">
          <p className="text-sm md:text-base text-secondary mb-6 text-center font-medium leading-relaxed">
            Teka-teki logika angka 9x9 klasik. Isi seluruh kisi tanpa ada angka yang berulang pada baris, kolom, maupun sub-grid 3x3.
          </p>

          {/* Cara Bermain box */}
          <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-lavender/20 text-left text-xs space-y-2">
            <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
            <div className="flex items-start gap-2">
              <span className="text-sm">🧩</span>
              <span>Isi seluruh kotak kisi 9x9 dengan angka 1 sampai 9.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">⚖️</span>
              <span>Setiap baris, kolom, dan sub-grid 3x3 tidak boleh memiliki angka yang sama.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">✏️</span>
              <span>Gunakan fitur <strong>Catatan (Notes)</strong> untuk menandai kemungkinan kandidat angka.</span>
            </div>
          </div>

          <div className="flex justify-center mb-3">
            <DifficultySelector
              selected={selectedDiff}
              onChange={setSelectedDiff}
            />
          </div>

          <div className="text-xs text-center text-secondary mb-6 font-medium">
            {selectedDiff === 'easy' && 'Mudah: Lebih banyak petunjuk awal, cocok untuk santai'}
            {selectedDiff === 'medium' && 'Sedang: Tantangan seimbang, menguji logika deduksi'}
            {selectedDiff === 'hard' && 'Sulit: Sedikit petunjuk awal, butuh teknik logika mendalam'}
          </div>

          {getBestScore(selectedDiff) > 0 && (
            <div className="text-center p-3 bg-lavender/15 rounded-xl text-charcoal font-bold text-sm mb-6">
              🏆 Skor Terbaik: {getBestScore(selectedDiff)} poin
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

  if (phase === 'finished') {
    const isWin = mistakes < maxMistakes;
    return (
      <div className="min-h-screen bg-[#FFF9F5] text-charcoal font-nunito p-4 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[20px] p-8 shadow-sm text-center max-w-sm w-full">
          <h2 className={`text-3xl font-bold mb-2 ${isWin ? 'text-[#A8E6CF]' : 'text-[#FFB5A7]'}`}>
            {isWin ? 'Teka-Teki Selesai! 🎉' : 'Permainan Berakhir'}
          </h2>
          <p className="text-secondary text-xs sm:text-sm mb-6">
            {isWin ? 'Luar biasa, pemikir logika sejati!' : 'Terlalu banyak kesalahan. Jangan menyerah dan coba lagi!'}
          </p>

          <div className="space-y-3 mb-6 text-left bg-gray-50 p-4 rounded-xl text-sm">
            <div className="flex justify-between font-bold">
              <span className="text-secondary">Waktu:</span>
              <span>{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-secondary">Kesalahan:</span>
              <span className={mistakes >= maxMistakes ? 'text-red-500' : ''}>{mistakes}/{maxMistakes}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-secondary">Tingkat Kesulitan:</span>
              <span className="font-black text-charcoal">
                {difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => restart()}
              className="w-full py-3 bg-charcoal hover:bg-black text-white rounded-xl font-bold text-base transition-colors shadow-sm"
            >
              Main Lagi 🔄
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-charcoal rounded-xl font-bold text-sm transition-colors"
            >
              Ganti Kesulitan
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 text-secondary hover:text-charcoal transition-colors font-semibold text-sm"
            >
              Kembali ke Beranda
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedValue = selectedCell ? grid[selectedCell[0]][selectedCell[1]] : null;

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-charcoal font-nunito flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white shadow-sm z-10">
        <button onClick={() => setPhase('setup')} className="p-2 -ml-2 text-secondary hover:text-charcoal rounded-full hover:bg-gray-100" title="Kembali">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="font-bold text-xl tracking-tight text-charcoal flex-1 text-center pr-8">Sudoku 🧩</div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-md w-full mx-auto p-4 pt-6 space-y-6">
          {/* Top Stats */}
          <div className="flex justify-between items-center px-1">
            <div className="bg-gray-100 text-secondary text-xs font-bold px-3 py-1.5 rounded-full uppercase">
              {difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit'}
            </div>
            <div className="bg-[#B8A9E8]/20 text-[#7a64c4] text-xs font-bold px-4 py-1.5 rounded-full font-mono tracking-wider">
              {formatTime(elapsedTime)}
            </div>
            <div className={`text-xs font-bold px-3 py-1.5 rounded-full ${mistakes > 0 ? 'bg-[#FFB5A7]/20 text-[#d46a55]' : 'bg-gray-100 text-secondary'}`}>
              Kesalahan: {mistakes}/{maxMistakes}
            </div>
          </div>

          {/* Grid */}
          <div className="bg-charcoal border-4 border-charcoal rounded-md overflow-hidden shadow-lg select-none">
            <div className="grid grid-cols-9 gap-px bg-charcoal">
              {grid.map((row, r) => (
                row.map((cell, c) => {
                  const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                  const isSameValue = cell !== null && cell === selectedValue;
                  const isRelated = selectedCell && (selectedCell[0] === r || selectedCell[1] === c || (Math.floor(selectedCell[0]/3) === Math.floor(r/3) && Math.floor(selectedCell[1]/3) === Math.floor(c/3)));
                  const isInitial = initialClues[r][c];
                  const isWrong = cell !== null && !isInitial && cell !== solution[r][c];
                  
                  // Borders for 3x3 subgrids
                  const rightBorder = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-charcoal' : '';
                  const bottomBorder = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-charcoal' : '';

                  let bgClass = 'bg-white';
                  if (isSelected) bgClass = 'bg-[#B8A9E8]/40';
                  else if (isWrong) bgClass = 'bg-[#FFB5A7]/40';
                  else if (isSameValue) bgClass = 'bg-[#B8A9E8]/20';
                  else if (isRelated) bgClass = 'bg-gray-100';

                  let textClass = '';
                  if (isInitial) textClass = 'text-charcoal font-black text-2xl';
                  else if (isWrong) textClass = 'text-[#e74c3c] font-bold text-2xl';
                  else if (cell !== null) textClass = 'text-[#B8A9E8] font-bold text-2xl';

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => selectCell(r, c)}
                      className={`aspect-square flex items-center justify-center cursor-pointer transition-colors relative ${bgClass} ${rightBorder} ${bottomBorder}`}
                    >
                      {cell !== null ? (
                        <span className={textClass}>{cell}</span>
                      ) : (
                        // Notes grid 3x3
                        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-[2px]">
                          {[1,2,3,4,5,6,7,8,9].map(n => (
                            <div key={n} className="flex items-center justify-center">
                              {notes[r][c][n] && (
                                <span className="text-[10px] sm:text-xs leading-none text-secondary/70 font-semibold">{n}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="flex justify-between gap-2 px-2">
            <button onClick={undo} disabled={historyLength === 0} className="flex-1 flex flex-col items-center p-2 rounded-xl text-secondary hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent">
              <RotateCcw className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Urungkan</span>
            </button>
            <button onClick={eraseCell} className="flex-1 flex flex-col items-center p-2 rounded-xl text-secondary hover:bg-gray-100">
              <Eraser className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Hapus</span>
            </button>
            <button onClick={toggleNotesMode} className={`flex-1 flex flex-col items-center p-2 rounded-xl ${isNotesMode ? 'text-[#B8A9E8] bg-[#B8A9E8]/10' : 'text-secondary hover:bg-gray-100'}`}>
              <Pencil className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Catatan {isNotesMode ? 'ON' : 'OFF'}</span>
            </button>
            <button onClick={getHint} disabled={hintsUsed >= maxHints} className="flex-1 flex flex-col items-center p-2 rounded-xl text-secondary hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent relative">
              <Lightbulb className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">Bantuan</span>
              <span className="absolute top-1 right-2 w-4 h-4 bg-[#FFE5A0] text-[#b3952a] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {maxHints - hintsUsed}
              </span>
            </button>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-5 gap-2 px-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const count = numberCounts[num];
              const isCompleted = count === 9;
              return (
                <button
                  key={num}
                  onClick={() => inputNumber(num)}
                  disabled={isCompleted}
                  className={`relative aspect-[4/3] rounded-xl flex items-center justify-center text-3xl font-bold shadow-sm transition-all active:scale-95 ${
                    isCompleted 
                      ? 'bg-gray-100 text-gray-300 opacity-50' 
                      : 'bg-white text-charcoal hover:bg-gray-50 active:bg-[#B8A9E8]/20'
                  }`}
                >
                  {num}
                  {!isCompleted && (
                    <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-secondary/60">
                      {9 - count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
