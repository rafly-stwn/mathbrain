import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { soundService } from '../services/soundService';

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
      className="max-w-2xl mx-auto space-y-8 w-full"
    >
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-charcoal mb-2">Pengaturan ⚙️</h1>
        <p className="text-sm text-warmgray">Sesuaikan preferensi audio dan data permainan Anda</p>
      </div>
      
      <div className="bg-white rounded-card p-6 shadow-card space-y-6 border border-lavender/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-charcoal text-lg">Efek Suara (SFX) 🔊</h3>
            <p className="text-sm text-warmgray">Nyalakan atau matikan efek suara interaksi permainan</p>
          </div>
          <button 
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
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

        <div className="border-t border-lavender/10 pt-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-error text-lg">Reset Data Statistik 🗑️</h3>
            <p className="text-sm text-warmgray">Hapus riwayat skor terbaik dan statistik permainan</p>
          </div>
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 font-bold rounded-button transition-colors active:scale-95"
          >
            Reset Data
          </button>
        </div>
      </div>
    </motion.div>
  );
}

