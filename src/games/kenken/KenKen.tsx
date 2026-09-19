import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useKenKen } from './useKenKen';
import { useGameStore } from '../../stores/gameStore';

export default function KenKen() {
  const navigate = useNavigate();
  const scores = useGameStore(state => state.scores);
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
    restart
  } = useKenKen();

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing' || !puzzle) return;
      
      if (e.key >= '1' && e.key <= puzzle.size.toString()) {
        inputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseCell();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (!selectedCell) {
          selectCell(0, 0);
          return;
        }
        const [r, c] = selectedCell;
        if (e.key === 'ArrowUp' && r > 0) selectCell(r - 1, c);
        if (e.key === 'ArrowDown' && r < puzzle.size - 1) selectCell(r + 1, c);
        if (e.key === 'ArrowLeft' && c > 0) selectCell(r, c - 1);
        if (e.key === 'ArrowRight' && c < puzzle.size - 1) selectCell(r, c + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, puzzle, selectedCell, inputNumber, eraseCell, selectCell]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderSetup = () => {
    const bestScoreEasy = (scores['kenken']?.scores || []).filter(s => s.difficulty === 'easy').sort((a,b) => b.score - a.score)[0]?.score || 0;
    const bestScoreMed = (scores['kenken']?.scores || []).filter(s => s.difficulty === 'medium').sort((a,b) => b.score - a.score)[0]?.score || 0;
    const bestScoreHard = (scores['kenken']?.scores || []).filter(s => s.difficulty === 'hard').sort((a,b) => b.score - a.score)[0]?.score || 0;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center max-w-lg mx-auto p-6 bg-white rounded-[20px] shadow-sm"
      >
        <button 
          onClick={() => navigate('/')}
          className="self-start flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs font-bold mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] mb-3 text-center font-nunito">KenKen 🧮</h1>
        <p className="text-[#636E72] text-xs sm:text-sm text-center mb-6 font-nunito leading-relaxed">
          Kombinasi unik sudoku dan aritmatika. Isi kisi angka sesuai petunjuk sangkar operasi penjumlahan, pengurangan, perkalian, atau pembagian.
        </p>

        {/* Cara Bermain box matching Math Scrabble style */}
        <div className="w-full bg-cream/70 rounded-2xl p-4 mb-6 border border-lavender/20 text-left text-xs space-y-2">
          <div className="font-black text-charcoal uppercase tracking-wider mb-1">Cara Bermain:</div>
          <div className="flex items-start gap-2">
            <span className="text-sm">🧮</span>
            <span>Isi kisi dengan angka 1 sampai N tanpa ada perulangan angka di baris atau kolom yang sama.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm">🎯</span>
            <span>Perhatikan sangkar bergaris tebal: hasil kalkulasi angka di dalamnya harus cocok dengan target dan operator (+, −, ×, ÷).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>Isi sangkar 1 kotak terlebih dahulu (angka gratis) untuk memudahkan pengisian kotak lainnya.</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <DifficultyCard 
            title="Mudah" 
            desc="Kisi 4×4 (+, −)" 
            best={bestScoreEasy} 
            onClick={() => startGame('easy')} 
          />
          <DifficultyCard 
            title="Sedang" 
            desc="Kisi 5×5 (+, −, ×)" 
            best={bestScoreMed} 
            onClick={() => startGame('medium')} 
          />
          <DifficultyCard 
            title="Sulit" 
            desc="Kisi 6×6 (+, −, ×, ÷)" 
            best={bestScoreHard} 
            onClick={() => startGame('hard')} 
          />
        </div>
      </motion.div>
    );
  };

  const renderPlaying = () => {
    if (!puzzle) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center max-w-2xl mx-auto p-4"
      >
        <div className="w-full flex justify-between items-center mb-6 bg-white p-4 rounded-[20px] shadow-sm">
          <button onClick={() => restart()} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs font-bold" title="Kembali ke Pengaturan">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-[#2D3436]">KenKen 🧮</h2>
            <span className="text-xs px-2.5 py-0.5 bg-[#A8E6CF] bg-opacity-40 text-[#2D3436] rounded-full mt-1 uppercase tracking-wider font-bold">
              {difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[#636E72] font-mono font-bold text-sm">{formatTime(elapsedTime)}</div>
            <div className="text-red-500 text-xs font-semibold">Kesalahan: {mistakes}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[20px] shadow-sm mb-6 overflow-hidden flex justify-center w-full">
          <div 
            className="grid gap-0 border-4 border-[#2D3436]"
            style={{ 
              gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
              width: 'min(100%, 400px)',
              aspectRatio: '1 / 1'
            }}
          >
            {userGrid.map((row, r) => row.map((val, c) => {
              const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const isRelated = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
              
              // Find cage
              const cage = puzzle.cages.find(cg => cg.cells.some(([cr, cc]) => cr === r && cc === c));
              const isTopLeft = cage?.cells[0][0] === r && cage?.cells[0][1] === c;
              
              // Borders for cage
              const hasTopNeighbor = cage?.cells.some(([cr, cc]) => cr === r - 1 && cc === c);
              const hasBottomNeighbor = cage?.cells.some(([cr, cc]) => cr === r + 1 && cc === c);
              const hasLeftNeighbor = cage?.cells.some(([cr, cc]) => cr === r && cc === c - 1);
              const hasRightNeighbor = cage?.cells.some(([cr, cc]) => cr === r && cc === c + 1);

              return (
                <div 
                  key={`${r}-${c}`}
                  onClick={() => selectCell(r, c)}
                  className={`
                    relative flex items-center justify-center cursor-pointer select-none
                    ${isSelected ? 'bg-[#A8E6CF] bg-opacity-40' : isRelated ? 'bg-gray-50' : 'bg-white'}
                    hover:bg-gray-100 transition-colors
                  `}
                  style={{
                    borderTop: hasTopNeighbor ? '1px dashed #e5e7eb' : '2px solid #2D3436',
                    borderBottom: hasBottomNeighbor ? '1px dashed #e5e7eb' : '2px solid #2D3436',
                    borderLeft: hasLeftNeighbor ? '1px dashed #e5e7eb' : '2px solid #2D3436',
                    borderRight: hasRightNeighbor ? '1px dashed #e5e7eb' : '2px solid #2D3436',
                  }}
                >
                  {isTopLeft && cage && (
                    <div className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-semibold text-[#636E72] leading-none">
                      {cage.target}{cage.op}
                    </div>
                  )}
                  <span className={`text-2xl sm:text-3xl font-bold font-nunito ${val ? 'text-[#2D3436]' : 'text-transparent'}`}>
                    {val || '.'}
                  </span>
                </div>
              );
            }))}
          </div>
        </div>

        <div className="w-full max-w-sm flex justify-center gap-3 mb-6">
          <button onClick={undo} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#2D3436] font-bold text-xs flex-1">
            Urungkan
          </button>
          <button onClick={eraseCell} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#2D3436] font-bold text-xs flex-1">
            Hapus
          </button>
          <button
            onClick={getHint}
            disabled={hintsUsed >= maxHints}
            className="p-2.5 bg-[#A8E6CF] bg-opacity-60 hover:bg-opacity-80 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[#2D3436] font-bold text-xs flex-1 transition-all"
          >
            Bantuan ({maxHints - hintsUsed})
          </button>
        </div>

        <div className="w-full max-w-sm grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: puzzle.size }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => inputNumber(num)}
              className="py-3.5 bg-white rounded-[15px] shadow-sm text-2xl font-bold text-[#2D3436] hover:bg-gray-50 hover:-translate-y-1 transition-all"
            >
              {num}
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderFinished = () => {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center max-w-md mx-auto p-8 bg-white rounded-[20px] shadow-sm text-center"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-[#2D3436] mb-2 font-nunito">Teka-Teki Selesai!</h2>
        <p className="text-[#636E72] text-sm mb-6 font-nunito">Kemampuan kalkulasi dan logika yang luar biasa!</p>

        <div className="w-full bg-gray-50 rounded-xl p-5 mb-6 space-y-3 text-sm">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-[#636E72] font-semibold">Waktu</span>
            <span className="text-[#2D3436] font-bold font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <span className="text-[#636E72] font-semibold">Kesalahan</span>
            <span className="text-[#2D3436] font-bold">{mistakes}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[#2D3436] font-bold">Tingkat Kesulitan</span>
            <span className="text-emerald-600 font-bold uppercase">
              {difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={() => restart()}
            className="flex-1 py-3.5 bg-charcoal hover:bg-black rounded-xl text-white font-bold font-nunito transition-colors shadow-sm text-sm"
          >
            Main Lagi 🔄
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[#2D3436] font-bold font-nunito transition-colors text-sm"
          >
            Beranda
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] p-4 font-nunito">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {phase === 'setup' && renderSetup()}
          {phase === 'playing' && renderPlaying()}
          {phase === 'finished' && renderFinished()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DifficultyCard({ title, desc, best, onClick }: { title: string, desc: string, best: number, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 bg-white border-2 border-transparent hover:border-[#A8E6CF] rounded-[15px] shadow-sm hover:shadow-md transition-all group"
    >
      <div className="text-left">
        <h3 className="text-lg font-bold text-[#2D3436] mb-0.5">{title}</h3>
        <p className="text-[#636E72] text-xs">{desc}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Skor Terbaik</span>
        <span className="text-base font-bold text-[#2D3436] group-hover:text-[#A8E6CF] transition-colors">{best}</span>
      </div>
    </button>
  );
}
