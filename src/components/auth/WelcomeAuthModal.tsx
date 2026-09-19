import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useDuelStore } from '../../stores/duelStore';
import { User, X, Sparkles } from 'lucide-react';

export default function WelcomeAuthModal() {
  const { user, hasChosenMode, isAuthModalOpen, continueAsGuest, loginWithGoogle, closeAuthModal } = useAuthStore();
  const { playerName, setPlayerName } = useDuelStore();
  
  const [username, setUsername] = useState(user?.name || playerName || '');
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = !hasChosenMode || isAuthModalOpen;
  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const finalName = username.trim() || 'MathHero';
    setPlayerName(finalName);
    setTimeout(async () => {
      await loginWithGoogle(finalName);
      setIsLoading(false);
    }, 400);
  };

  const handleGuestSignIn = () => {
    const finalName = username.trim() || 'Guest';
    setPlayerName(finalName);
    continueAsGuest(finalName);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={hasChosenMode ? closeAuthModal : undefined}
          className="absolute inset-0 bg-charcoal/45 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white rounded-card shadow-card p-6 md:p-7 border border-lavender/20"
        >
          {/* Close button if user already chosen mode */}
          {hasChosenMode && (
            <button
              onClick={closeAuthModal}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-warmgray hover:text-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-lavender/15 text-charcoal rounded-pill text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-lavender" />
              <span>Selamat Datang</span>
            </div>
            <h2 className="text-2xl font-extrabold text-charcoal tracking-tight">
              MathBrain
            </h2>
            <p className="text-xs text-warmgray mt-1">
              Masukkan username Anda dan pilih cara masuk.
            </p>
          </div>

          {/* Form: Username Input */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-charcoal mb-1.5">
              Username / Nama Pemain
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-warmgray">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ketik username Anda..."
                maxLength={20}
                className="w-full text-sm font-bold pl-10 pr-4 py-3 rounded-xl border-2 border-lavender/40 focus:border-charcoal focus:outline-none bg-cream/40 text-charcoal transition-all placeholder:font-normal placeholder:text-warmgray/60"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGuestSignIn();
                }}
              />
            </div>
          </div>

          {/* Action Options */}
          <div className="flex flex-col gap-3">
            {/* Option 1: Google Login (Can Host & Create Rooms) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full p-3.5 rounded-xl bg-charcoal hover:bg-black text-white transition-all flex items-center gap-3 active:scale-98 shadow-sm group disabled:opacity-50 text-left"
            >
              <div className="p-2 bg-white rounded-lg flex-shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm leading-tight flex items-center justify-between">
                  <span>Login dengan Google</span>
                  <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-medium">Bisa Buat Room</span>
                </div>
                <div className="text-[11px] text-gray-300 truncate mt-0.5">Membuka fitur Host & Buat Room Duel</div>
              </div>
            </button>

            {/* Option 2: Guest Mode (Solo & Join) */}
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={isLoading}
              className="w-full p-3.5 rounded-xl bg-white hover:bg-gray-50 border-2 border-charcoal/10 hover:border-charcoal/20 text-charcoal transition-all flex items-center gap-3 active:scale-98 shadow-sm text-left"
            >
              <div className="p-2 bg-cream rounded-lg flex-shrink-0 text-warmgray">
                <User className="w-4 h-4 text-charcoal" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm leading-tight flex items-center justify-between">
                  <span>Masuk sebagai Guest</span>
                  <span className="text-[10px] bg-peach/30 text-charcoal px-1.5 py-0.5 rounded font-medium">Tanpa Akun</span>
                </div>
                <div className="text-[11px] text-warmgray truncate mt-0.5">Bisa main solo & gabung room teman</div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
