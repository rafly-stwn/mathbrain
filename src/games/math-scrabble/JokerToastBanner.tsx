import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface JokerToastBannerProps {
  show: boolean;
  onClose: () => void;
}

export default function JokerToastBanner({ show, onClose }: JokerToastBannerProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-[#FFF9E6] border-2 border-[#FFD97D] text-[#4A3800] shadow-xl rounded-2xl p-3 flex items-center justify-between gap-3 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFE5A0] border border-[#FFD97D] flex items-center justify-center text-xl shrink-0 shadow-xs animate-bounce">
              🃏
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <div className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm text-charcoal">Kartu Joker Diperoleh!</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </div>
              <p className="text-[11px] text-warmgray font-semibold leading-tight mt-0.5">
                Bebas tentukan angka atau simbol matematika saat ditaruh di papan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 rounded-full text-warmgray hover:text-charcoal transition-colors shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
