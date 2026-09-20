import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';
import { Heart, Code, ExternalLink } from 'lucide-react';

export default function Settings() {
  const { settings, toggleSound, resetStats } = useGameStore();

  const handleToggle = () => {
    toggleSound();
    soundService.playClick();
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua statistik dan skor permainan? Tindakan ini tidak dapat dibatalkan.')) {
      resetStats();
      soundService.playClick();
      alert('Semua data dan skor berhasil direset.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto space-y-6 w-full pb-10"
    >
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-charcoal mb-2">Pengaturan ⚙️</h1>
        <p className="text-sm text-warmgray">Sesuaikan preferensi audio, kelola data, dan informasi game</p>
      </div>
      
      {/* 1. Preferensi Permainan & Suara */}
      <div className="bg-white rounded-card p-5 sm:p-6 shadow-card space-y-5 border border-lavender/20">
        <h2 className="font-black text-charcoal text-base flex items-center gap-2 border-b border-lavender/10 pb-2">
          <span>🎧</span> Preferensi Permainan
        </h2>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-charcoal text-base sm:text-lg">Efek Suara (SFX) 🔊</h3>
            <p className="text-xs sm:text-sm text-warmgray">Nyalakan atau matikan efek suara interaksi permainan</p>
          </div>
          <button 
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              settings.soundEnabled ? 'bg-mint' : 'bg-warmgray/30'
            }`}
            title={settings.soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            <span 
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.soundEnabled ? 'translate-x-8' : 'translate-x-1'
              }`} 
            />
          </button>
        </div>

        <div className="border-t border-lavender/10 pt-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-error text-base sm:text-lg">Reset Data Statistik 🗑️</h3>
            <p className="text-xs sm:text-sm text-warmgray">Hapus riwayat skor terbaik dan statistik permainan</p>
          </div>
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 font-bold rounded-button transition-colors active:scale-95 cursor-pointer text-xs sm:text-sm shrink-0"
          >
            Reset Data
          </button>
        </div>
      </div>

      {/* 2. Tentang & Kredit (About & Credits) */}
      <div className="bg-white rounded-card p-5 sm:p-6 shadow-card border border-lavender/20 space-y-5">
        {/* Header About */}
        <div className="flex items-center justify-between border-b border-lavender/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🧠</span>
            <div>
              <h2 className="font-black text-charcoal text-lg sm:text-xl">Tentang MathBrain</h2>
              <p className="text-xs text-warmgray">Platform Game Asah Otak, Logika & Duel Matematika</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-lavender/20 text-charcoal font-black text-[11px] rounded-pill border border-lavender/30 shrink-0">
            v1.0.0
          </span>
        </div>

        {/* Creator Spotlight */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-peach/15 via-lemon/15 to-mint/15 border border-lavender/30 flex items-center gap-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border-2 border-lavender/40 flex items-center justify-center text-2xl shrink-0">
            👑
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 bg-white text-charcoal rounded-md shadow-2xs border border-lavender/20">
              Pencipta & Pengembang
            </span>
            <h3 className="font-black text-charcoal text-lg sm:text-xl truncate mt-1">
              Kolorbapa
            </h3>
          </div>
        </div>

        {/* Fitur & Teknologi */}
        <div className="p-3.5 rounded-2xl bg-cream/40 border border-lavender/15 space-y-2">
          <h4 className="text-xs font-black text-warmgray uppercase tracking-wider flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-lavender-dark" />
            <span>Teknologi & Fitur Unggulan</span>
          </h4>
          <ul className="text-xs text-charcoal space-y-1.5 list-none">
            <li className="flex items-start gap-2">
              <span className="text-mint font-black">✓</span>
              <span><strong>WebRTC DataChannel (PeerJS)</strong>: Duel multiplayer P2P langsung antar perangkat tanpa server database eksternal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mint font-black">✓</span>
              <span><strong>Stiker Interaktif Real-Time</strong>: 30 karakter transparan ekspresif (Pack Pria & Wanita) dengan jeda 3 detik anti-spam.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mint font-black">✓</span>
              <span><strong>Web Audio Synthesizer</strong>: Audio efek suara sintetis prosedural 0-kilobyte, cepat, dan ringan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mint font-black">✓</span>
              <span><strong>Desain Pastel Adaptif</strong>: Antarmuka ramah mata, optimal untuk layar HP (mobile) maupun laptop.</span>
            </li>
          </ul>
        </div>

        {/* Footer Kredit & Tautan */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warmgray border-t border-lavender/10">
          <div className="flex items-center gap-1 text-center sm:text-left">
            <span>Dibuat dengan</span>
            <Heart className="w-3.5 h-3.5 text-peach fill-peach inline" />
            <span>oleh <strong className="text-charcoal font-black">Kolorbapa</strong></span>
          </div>

          <a
            href="https://github.com/rafly-stwn/mathbrain"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundService.playClick()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal hover:bg-black text-white font-extrabold transition-all active:scale-95 shadow-xs"
          >
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

