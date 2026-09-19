import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDuelStore } from '../stores/duelStore';
import { peerService } from '../services/peerService';

export default function DuelWaitingRoom() {
  const navigate = useNavigate();
  const params = useParams<{ roomCode?: string }>();
  const { roomCode, gameId, difficulty, players, isHost, startGame, status, leaveRoom, countdown, joinRoom, playerName } = useDuelStore();
  const [copied, setCopied] = useState(false);

  // Auto-join if user directly accesses or refreshes room URL
  useEffect(() => {
    const urlCode = params.roomCode?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (urlCode && (!roomCode || roomCode !== urlCode)) {
      joinRoom(urlCode);
    }
  }, [params.roomCode, roomCode, joinRoom]);

  // Navigate to arena when game starts
  useEffect(() => {
    if (status === 'playing') {
      navigate('/duel/arena');
    }
  }, [status, navigate]);

  // Active sync heartbeat: ensures guest and host discover each other even with packet delay
  useEffect(() => {
    if (status === 'waiting') {
      const interval = setInterval(() => {
        if (!isHost && players.length < 2) {
          const myId = peerService.getMyId();
          peerService.broadcast({
            type: 'REQUEST_SYNC',
            payload: { id: myId, name: playerName },
          });
          peerService.broadcast({
            type: 'JOIN',
            payload: { id: myId, name: playerName },
          });
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [status, isHost, players.length, playerName]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/duel?room=${roomCode || params.roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    leaveRoom();
    navigate('/duel');
  };

  const displayCode = roomCode || params.roomCode || '';

  return (
    <div className="flex flex-col h-full max-w-md mx-auto w-full p-4 relative">
      <div className="flex items-center mb-6">
        <button onClick={handleBack} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
          ⬅️ Back
        </button>
      </div>

      <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col items-center text-center gap-4 mb-6">
        <h2 className="text-gray-500 font-bold uppercase tracking-wider text-sm">Kode Room</h2>
        <div className="text-4xl font-mono font-black tracking-widest text-charcoal">{displayCode}</div>
        
        <button 
          onClick={handleCopyLink}
          className="bg-cream text-charcoal px-6 py-2 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          {copied ? 'Tersalin! ✅' : 'Salin Link Room 🔗'}
        </button>

        <div className="flex gap-2 mt-2">
          <span className="bg-lavender px-3 py-1 rounded-full text-xs font-bold capitalize">{gameId.replace('-', ' ')}</span>
          <span className="bg-peach px-3 py-1 rounded-full text-xs font-bold capitalize">{difficulty}</span>
        </div>
      </div>

      <h3 className="font-bold text-xl mb-4">Pemain ({players.length}/2)</h3>
      <div className="flex flex-col gap-3 flex-1">
        {players.map((p, i) => (
          <div key={p.id || i} className="bg-white p-4 rounded-[20px] shadow-sm flex items-center gap-4 border border-charcoal/5">
            <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center text-2xl shadow-inner">
              {p.isHost ? '👑' : '⚔️'}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-charcoal">{p.name}</div>
              <div className="text-xs text-warmgray">{p.isHost ? 'Host (Pembuat Room)' : 'Peserta (Lawan)'}</div>
            </div>
            {p.isHost && <span className="text-xs font-bold px-2 py-1 bg-lemon/40 text-charcoal rounded-md">Host</span>}
          </div>
        ))}
        {players.length < 2 && (
          <div className="bg-cream/60 p-4 rounded-[20px] border-2 border-dashed border-charcoal/20 flex items-center justify-center gap-3 text-warmgray font-bold">
            <span className="animate-spin text-xl">⏳</span>
            Menunggu lawan bergabung (1/2)...
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 pb-2">
        {isHost ? (
          <button 
            onClick={startGame}
            disabled={players.length < 2}
            className={`w-full py-4 rounded-2xl font-black text-xl transition-all shadow-sm ${
              players.length >= 2 
                ? 'bg-mint hover:bg-mint/80 text-charcoal cursor-pointer active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
            }`}
          >
            {players.length >= 2 ? 'Mulai Duel! 🚀' : 'Menunggu Lawan Bergabung (1/2) ⏳'}
          </button>
        ) : (
          <div className="bg-cream text-charcoal p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-3 border border-charcoal/5">
            <span className="animate-pulse">Menunggu Host Memulai Pertandingan...</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {status === 'starting' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-9xl font-black text-white"
            >
              {countdown > 0 ? countdown : 'GO!'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
