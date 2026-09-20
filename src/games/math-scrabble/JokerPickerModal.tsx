import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface JokerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (char: string) => void;
}

const OPERATORS = ['+', '-', '×', '÷', '='];
const SINGLE_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const DOUBLE_DIGITS = ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

export default function JokerPickerModal({ isOpen, onClose, onSelect }: JokerPickerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm bg-white rounded-card shadow-2xl p-4 sm:p-5 border border-lavender/30 flex flex-col z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-lavender/20 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-base font-black shadow-2xs">
                  🃏
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-black text-charcoal text-sm sm:text-base">Pilih Nilai Joker</h3>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-warmgray font-semibold leading-tight">
                    Bernilai 0 poin sebagai penyambung persamaan
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-warmgray hover:text-charcoal rounded-full hover:bg-gray-100 transition-colors"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* 1. Operator & Simbol */}
              <div>
                <div className="text-[10.5px] font-black text-warmgray uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Operator & Simbol</span>
                  <span className="text-[10px] text-amber-600 font-bold">Populer</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {OPERATORS.map(op => (
                    <button
                      key={op}
                      onClick={() => onSelect(op)}
                      className="py-2.5 rounded-xl bg-[#FFF5DB] hover:bg-[#FFE8B2] text-charcoal font-black text-base sm:text-lg border-2 border-amber-300/60 shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Angka Satuan (0 - 9) */}
              <div>
                <div className="text-[10.5px] font-black text-warmgray uppercase tracking-wider mb-1.5">
                  Angka Satuan (0 - 9)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {SINGLE_DIGITS.map(num => (
                    <button
                      key={num}
                      onClick={() => onSelect(num)}
                      className="py-2 rounded-xl bg-cream hover:bg-white text-charcoal font-black text-sm sm:text-base border border-lavender/30 shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Angka Puluhan (10 - 20) */}
              <div>
                <div className="text-[10.5px] font-black text-warmgray uppercase tracking-wider mb-1.5">
                  Angka Puluhan (10 - 20)
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {DOUBLE_DIGITS.map(num => (
                    <button
                      key={num}
                      onClick={() => onSelect(num)}
                      className="py-1.5 rounded-xl bg-cream hover:bg-white text-charcoal font-extrabold text-xs sm:text-sm border border-lavender/30 shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Cancel */}
            <div className="mt-4 pt-3 border-t border-lavender/20 flex justify-end">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl text-warmgray hover:text-charcoal text-xs font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal (Simpan Kembali di Rak)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
