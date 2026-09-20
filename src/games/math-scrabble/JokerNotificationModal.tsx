import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface JokerNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JokerNotificationModal({ isOpen, onClose }: JokerNotificationModalProps) {
  // Gunakan ref agar detak jam catur per detik tidak me-reset ulang timer 4 detik
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onCloseRef.current();
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="joker-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-[#FFD97D] max-w-sm w-full text-center relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-yellow-200/30 rounded-full blur-2xl pointer-events-none" />

            {/* Tombol Tutup X */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-warmgray hover:text-charcoal hover:bg-black/5 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Visual Lencana Kartu Joker Emas */}
            <div className="relative w-16 h-16 mx-auto mb-4 mt-1">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 border-2 border-amber-400 flex items-center justify-center text-3xl font-black text-amber-900 shadow-md">
                ★
              </div>
              <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-1 shadow-sm animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Judul */}
            <h3 className="text-lg font-black text-charcoal mb-1.5 flex items-center justify-center gap-1.5">
              <span>Selamat! Dapat Kartu Joker!</span>
              <span className="text-lg">🃏</span>
            </h3>

            {/* Deskripsi */}
            <p className="text-xs text-warmgray font-semibold leading-relaxed mb-5 px-1">
              Kartu <span className="text-amber-800 font-black">★</span> adalah kartu bebas! Kamu bebas menentukan angka (<span className="text-charcoal font-bold">0–20</span>) atau simbol (<span className="text-charcoal font-bold">+</span>, <span className="text-charcoal font-bold">-</span>, <span className="text-charcoal font-bold">×</span>, <span className="text-charcoal font-bold">÷</span>, <span className="text-charcoal font-bold">=</span>) saat meletakkannya di papan.
            </p>

            {/* Tombol Mengerti */}
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-black rounded-xl shadow-md transition-all active:scale-95 text-sm cursor-pointer"
            >
              Mengerti, Siap!
            </button>

            {/* Hint timer */}
            <p className="text-[11px] text-warmgray/80 mt-2.5 font-medium">
              Otomatis menutup dalam 4 detik atau klik di luar
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
