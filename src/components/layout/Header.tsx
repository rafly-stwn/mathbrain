import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import { soundService } from '../../services/soundService';
import { Volume2, VolumeX } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const { user, openAuthModal } = useAuthStore();
  const { settings, toggleSound } = useGameStore();

  const handleToggleSound = () => {
    toggleSound();
    soundService.playClick();
  };

  const navLinks = [
    { path: '/', label: 'Permainan' },
    { path: '/settings', label: 'Pengaturan' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-lavender/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-extrabold text-2xl text-charcoal text-left tracking-tight">
          MathBrain
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || 
                             (link.path === '/' && location.pathname.startsWith('/game/'));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-semibold transition-colors py-1 ${
                  isActive ? 'text-charcoal border-b-2 border-lavender' : 'text-warmgray hover:text-charcoal'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sound Toggle & User Account / Guest Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-pill bg-warmgray/10 hover:bg-lavender/20 text-charcoal transition-all active:scale-95 shadow-sm"
            title={settings.soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
            aria-label={settings.soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-charcoal" />
            ) : (
              <VolumeX className="w-4 h-4 text-warmgray" />
            )}
          </button>

          {user ? (
            user.isGuest ? (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-warmgray/10 hover:bg-lavender/20 border border-warmgray/20 transition-all text-xs font-bold text-charcoal shadow-sm active:scale-95"
                title="Klik untuk Login dengan Google & Buka Fitur Buat Room"
              >
                <span className="w-2 h-2 rounded-full bg-peach animate-pulse" />
                <span className="max-w-[90px] truncate">{user.name}</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md text-warmgray border border-warmgray/20 hidden sm:inline">
                  Guest
                </span>
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-lavender/15 hover:bg-lavender/30 border border-lavender/30 transition-all text-xs font-bold text-charcoal shadow-sm active:scale-95"
                title="Akun Terdaftar (Klik untuk Ganti Akun)"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-white" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-mint" />
                )}
                <span className="max-w-[110px] truncate">{user.name}</span>
                <span className="text-[10px] bg-mint/40 text-charcoal px-1.5 py-0.5 rounded-md hidden sm:inline font-bold">
                  Host Ready 👑
                </span>
              </button>
            )
          ) : (
            <button
              onClick={openAuthModal}
              className="text-xs font-bold px-3 py-1.5 bg-lavender text-white rounded-pill hover:bg-lavender/80 transition-all active:scale-95 shadow-sm"
            >
              Masuk
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

