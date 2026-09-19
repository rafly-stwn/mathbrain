import { motion, AnimatePresence } from 'framer-motion';
import { useDuelStore } from '../../stores/duelStore';
import { STICKER_MAP } from '../../data/stickers';

export default function StickerDisplay() {
  const { activeStickers } = useDuelStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {activeStickers.map(event => {
          const sticker = STICKER_MAP[event.stickerId];
          if (!sticker) return null;

          const isMe = event.isMe;

          return (
            <motion.div
              key={event.id}
              initial={{
                opacity: 0,
                scale: 0.3,
                y: isMe ? 30 : -30,
                x: isMe ? -20 : 20,
              }}
              animate={{
                opacity: 1,
                scale: [0.3, 1.2, 1],
                y: 0,
                x: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.6,
                y: isMe ? -20 : 20,
                transition: { duration: 0.25 },
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 22,
              }}
              className={`absolute ${
                isMe
                  ? 'bottom-24 left-4 sm:bottom-28 sm:left-12'
                  : 'top-24 right-4 sm:top-28 sm:right-12'
              } flex flex-col items-center pointer-events-none`}
            >
              {/* Comic reaction bubble */}
              <div
                className={`relative flex flex-col items-center bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-2xl border-2 ${
                  isMe ? 'border-mint' : 'border-sky'
                } max-w-[130px] sm:max-w-[170px] filter drop-shadow-xl`}
              >
                {/* Sender badge */}
                <div
                  className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full mb-1 shadow-xs ${
                    isMe
                      ? 'bg-mint/30 text-charcoal'
                      : 'bg-sky/30 text-charcoal'
                  }`}
                >
                  {isMe ? 'Anda' : event.senderName || 'Lawan'}
                </div>

                {/* Sticker Character Image */}
                <div className="w-20 h-20 sm:w-26 sm:h-26 flex items-center justify-center p-0.5">
                  <motion.img
                    src={sticker.image}
                    alt={sticker.title}
                    animate={{ rotate: [-5, 5, -3, 3, 0] }}
                    transition={{ duration: 0.5 }}
                    className="max-w-full max-h-full object-contain filter drop-shadow-md"
                  />
                </div>

                {/* Text Badge */}
                <div className="mt-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-cream to-white border border-lavender/30 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-black text-charcoal text-center tracking-tight shadow-xs">
                  {sticker.title}
                </div>

                {/* Speech bubble tail pointer */}
                <div
                  className={`absolute -bottom-2 ${
                    isMe ? 'left-6' : 'right-6'
                  } w-4 h-4 bg-white border-b-2 border-r-2 ${
                    isMe ? 'border-mint' : 'border-sky'
                  } transform rotate-45`}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
