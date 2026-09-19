import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Flame, Sparkles } from 'lucide-react';
import { useDuelStore } from '../../stores/duelStore';
import { BOY_STICKERS, GIRL_STICKERS, type StickerItem } from '../../data/stickers';
import { soundService } from '../../services/soundService';

export default function StickerTray() {
  const {
    sendSticker,
    lastStickerSentTime,
    stickerUsage = {},
    isStickerTrayOpen,
    setStickerTrayOpen,
  } = useDuelStore();

  const [activePack, setActivePack] = useState<'boy' | 'girl'>('boy');
  const [isExpanded, setIsExpanded] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Monitor 3-second cooldown
  useEffect(() => {
    const checkCooldown = () => {
      const elapsed = Date.now() - lastStickerSentTime;
      const left = Math.max(0, Math.ceil((3000 - elapsed) / 1000));
      setCooldownRemaining(left);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 200);
    return () => clearInterval(interval);
  }, [lastStickerSentTime]);

  // Default weights to ensure meaningful initial Top 3 favorites
  const defaultWeights: Record<string, number> = useMemo(
    () => ({
      boy_09: 100, // Semangat!
      boy_04: 90,  // Oke Siap!
      boy_07: 80,  // Hahaha
      girl_09: 100, // Semangat Yaa!
      girl_04: 90,  // Oke Siap!
      girl_07: 80,  // Hahaha
    }),
    []
  );

  // Sort stickers: Most frequently used (Top 3) first, rest in dropdown
  const { top3Stickers, remainingStickers } = useMemo(() => {
    const allInPack = activePack === 'boy' ? BOY_STICKERS : GIRL_STICKERS;

    const sorted = [...allInPack].sort((a, b) => {
      const usageA = stickerUsage[a.id] || 0;
      const usageB = stickerUsage[b.id] || 0;
      if (usageA !== usageB) {
        return usageB - usageA;
      }
      const weightA = defaultWeights[a.id] || 0;
      const weightB = defaultWeights[b.id] || 0;
      return weightB - weightA;
    });

    return {
      top3Stickers: sorted.slice(0, 3),
      remainingStickers: sorted.slice(3),
    };
  }, [activePack, stickerUsage, defaultWeights]);

  const handleSelectSticker = (sticker: StickerItem) => {
    if (cooldownRemaining > 0) return;
    const success = sendSticker(sticker.id);
    if (success) {
      setStickerTrayOpen(false);
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON (Tombol Melayang HP & Desktop) */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ top: -500, bottom: 0, left: -260, right: 0 }}
        className="fixed bottom-5 right-4 z-[60] sm:bottom-7 sm:right-7 select-none touch-none"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            soundService.playClick();
            setStickerTrayOpen(!isStickerTrayOpen);
          }}
          className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl border-2 transition-all cursor-pointer ${
            cooldownRemaining > 0
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white/95 backdrop-blur-md border-lavender text-charcoal hover:shadow-2xl hover:border-lavender-dark ring-2 ring-lavender/20'
          }`}
          title="Kirim Stiker Reaksi (Bisa digeser)"
        >
          {cooldownRemaining > 0 ? (
            <div className="flex flex-col items-center justify-center leading-none font-bold">
              <span className="text-xs">⏱️</span>
              <span className="text-[10px] font-extrabold text-charcoal">{cooldownRemaining}s</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="text-2xl sm:text-3xl filter drop-shadow-xs">💬</span>
              <span className="w-2.5 h-2.5 rounded-full bg-mint border-2 border-white absolute -top-1 -right-1 animate-pulse" />
            </div>
          )}
        </motion.button>
      </motion.div>

      {/* 2. COMPACT STICKER TRAY (Pop-up Ringkas Responsif HP & Desktop) */}
      <AnimatePresence>
        {isStickerTrayOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-2 sm:p-4">
            {/* Backdrop click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setStickerTrayOpen(false);
                setIsExpanded(false);
              }}
              className="absolute inset-0 bg-charcoal/25 backdrop-blur-[2px]"
            />

            {/* Main Compact Card Container */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border-2 border-lavender/40 overflow-hidden z-10 flex flex-col max-h-[85vh] bottom-14 sm:bottom-0"
            >
              {/* Header: Title, Pack switcher pills, Close button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-lavender/20 bg-gradient-to-r from-cream via-white to-cream">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-lavender-dark animate-spin" />
                  <h3 className="font-black text-charcoal text-sm">Stiker Reaksi</h3>
                </div>

                {/* Pack Selector Switcher */}
                <div className="flex gap-1 bg-cream p-1 rounded-xl border border-lavender/20">
                  <button
                    onClick={() => {
                      soundService.playClick();
                      setActivePack('boy');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                      activePack === 'boy'
                        ? 'bg-sky/30 text-charcoal border border-sky shadow-xs'
                        : 'text-warmgray hover:text-charcoal'
                    }`}
                  >
                    👦 Pria
                  </button>
                  <button
                    onClick={() => {
                      soundService.playClick();
                      setActivePack('girl');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                      activePack === 'girl'
                        ? 'bg-rose/30 text-charcoal border border-rose shadow-xs'
                        : 'text-warmgray hover:text-charcoal'
                    }`}
                  >
                    🧕 Wanita
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    soundService.playClick();
                    setStickerTrayOpen(false);
                    setIsExpanded(false);
                  }}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-warmgray hover:text-charcoal transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Section 1: TOP 3 MOST USED STICKERS (Selalu Terbuka & Ringkas di Atas) */}
              <div className="p-3 bg-cream/30 border-b border-lavender/15">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-charcoal">
                    <Flame className="w-3.5 h-3.5 text-peach fill-peach" />
                    <span>Sering Digunakan (Ketuk Langsung Kirim):</span>
                  </div>
                  {cooldownRemaining > 0 && (
                    <span className="text-[10px] font-bold text-error animate-pulse">
                      Jeda {cooldownRemaining}s
                    </span>
                  )}
                </div>

                {/* Top 3 Horizontal Cards Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {top3Stickers.map((sticker, idx) => {
                    const usage = stickerUsage[sticker.id] || 0;
                    return (
                      <motion.button
                        key={sticker.id}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => handleSelectSticker(sticker)}
                        disabled={cooldownRemaining > 0}
                        className={`group relative flex flex-col items-center justify-between p-2 rounded-2xl bg-white border-2 transition-all cursor-pointer aspect-square shadow-sm ${
                          idx === 0
                            ? 'border-mint/50 hover:border-mint ring-2 ring-mint/20'
                            : 'border-lavender/30 hover:border-lavender hover:shadow-md'
                        } ${cooldownRemaining > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {/* Usage badge if used */}
                        {usage > 0 && (
                          <span className="absolute top-1 right-1 text-[9px] font-black px-1.5 py-0.2 bg-peach/20 text-charcoal rounded-full border border-peach/30">
                            {usage}x
                          </span>
                        )}

                        <div className="w-full flex-1 flex items-center justify-center overflow-hidden py-0.5">
                          <img
                            src={sticker.image}
                            alt={sticker.title}
                            className="max-h-13 sm:max-h-16 w-auto object-contain transition-transform group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>

                        <span className="text-[10.5px] font-black text-charcoal line-clamp-1 w-full text-center px-1 py-0.5 rounded-md bg-cream/70 truncate border border-lavender/10">
                          {sticker.title}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: DROPDOWN TOGGLE (Sisanya Tertutup seperti Dropdown) */}
              <div className="p-2 bg-white flex flex-col">
                <button
                  onClick={() => {
                    soundService.playClick();
                    setIsExpanded(prev => !prev);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-charcoal font-bold text-xs border border-lavender/25 transition-all flex items-center justify-between cursor-pointer active:scale-98"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{isExpanded ? '▲ Sembunyikan Stiker Lainnya' : '▼ Buka 12 Stiker Lainnya'}</span>
                    <span className="text-[10px] font-normal text-warmgray">({activePack === 'boy' ? 'Pack Pria' : 'Pack Wanita'})</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-warmgray" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-warmgray" />
                  )}
                </button>

                {/* Collapsible Dropdown Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {remainingStickers.map(sticker => {
                            const usage = stickerUsage[sticker.id] || 0;
                            return (
                              <motion.button
                                key={sticker.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handleSelectSticker(sticker)}
                                disabled={cooldownRemaining > 0}
                                className={`group relative flex flex-col items-center justify-between p-2 rounded-2xl bg-cream/30 hover:bg-white border border-lavender/20 hover:border-lavender hover:shadow-md transition-all cursor-pointer aspect-square ${
                                  cooldownRemaining > 0 ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                              >
                                {usage > 0 && (
                                  <span className="absolute top-1 right-1 text-[8.5px] font-black px-1 py-0.2 bg-cream text-charcoal rounded-full border border-lavender/30">
                                    {usage}x
                                  </span>
                                )}

                                <div className="w-full flex-1 flex items-center justify-center overflow-hidden py-0.5">
                                  <img
                                    src={sticker.image}
                                    alt={sticker.title}
                                    className="max-h-12 sm:max-h-14 w-auto object-contain transition-transform group-hover:scale-110"
                                    loading="lazy"
                                  />
                                </div>

                                <span className="text-[10px] font-bold text-charcoal line-clamp-1 w-full text-center px-1 py-0.5 rounded-md bg-white/90 truncate border border-lavender/10">
                                  {sticker.title}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer: Cooldown note */}
              <div className="px-4 py-2 bg-cream/60 border-t border-lavender/15 flex items-center justify-between text-[11px] text-warmgray">
                <span>⏱️ Jeda antar stiker: 3 dtk</span>
                {cooldownRemaining > 0 ? (
                  <span className="text-error font-extrabold">Tunggu {cooldownRemaining} detik lagi</span>
                ) : (
                  <span className="text-mint font-extrabold">Siap dikirim! ✨</span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
