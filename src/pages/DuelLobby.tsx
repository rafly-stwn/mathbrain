import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDuelStore } from '../stores/duelStore';
import { useAuthStore } from '../stores/authStore';
import type { GameId, Difficulty } from '../types';
import { Lock, LogIn } from 'lucide-react';

const games: { id: GameId; title: string; emoji: string; color: string }[] = [
  { id: 'speed-addition', title: 'Speed Addition', emoji: '⚡', color: 'bg-peach' },
  { id: 'speed-multiplication', title: 'Speed Multiplication', emoji: '✖️', color: 'bg-lemon' },
  { id: 'kraepelin', title: 'Kraepelin', emoji: '📰', color: 'bg-sky' },
  { id: 'magic-square', title: 'Magic Square', emoji: '🔢', color: 'bg-rose' },
  { id: 'sudoku', title: 'Sudoku', emoji: '🧩', color: 'bg-lavender' },
  { id: 'kenken', title: 'KenKen', emoji: '🧮', color: 'bg-mint' },
  { id: 'kakuro', title: 'Kakuro', emoji: '➕', color: 'bg-peach' },
  { id: 'math-scrabble', title: 'Math Scrabble', emoji: '🔤', color: 'bg-lavender' },
];

export default function DuelLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ gameId?: string }>();
  const { playerName, setPlayerName, createRoom, joinRoom } = useDuelStore();
  const { user, openAuthModal } = useAuthStore();
  
  const preselectedGameId = (searchParams.get('game') || params.gameId) as GameId | undefined;
  const isPreselected = Boolean(preselectedGameId && games.some(g => g.id === preselectedGameId));

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [selectedGame, setSelectedGame] = useState<GameId>(isPreselected && preselectedGameId ? preselectedGameId : 'speed-addition');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>('medium');
  const [selectedDuration, setSelectedDuration] = useState<number>(1200);
  const [joinCode, setJoinCode] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const currentGameInfo = games.find(g => g.id === (isPreselected ? preselectedGameId : selectedGame));

  // Sync player name from auth user if available
  useEffect(() => {
    if (user?.name && playerName !== user.name) {
      setPlayerName(user.name);
      setTempName(user.name);
    }
  }, [user, playerName, setPlayerName]);

  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setTab('join');
      setJoinCode(roomParam.toUpperCase());
    }
    const gameParam = searchParams.get('game') as GameId;
    if (gameParam && games.some(g => g.id === gameParam)) {
      setSelectedGame(gameParam);
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (user?.isGuest) {
      openAuthModal();
      return;
    }
    await createRoom(selectedGame, selectedDiff, selectedDuration);
    navigate(`/duel/room/${useDuelStore.getState().roomCode}`);
  };

  const handleJoin = async () => {
    const cleanCode = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length >= 4) {
      await joinRoom(cleanCode);
      navigate(`/duel/room/${cleanCode}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full max-w-md mx-auto w-full p-4 gap-6">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-charcoal">Multiplayer Duel ⚔️</h1>
        
        {isEditingName ? (
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text" 
              value={tempName} 
              onChange={e => setTempName(e.target.value)}
              className="px-3 py-1 rounded-xl border border-gray-200 text-center focus:outline-none"
              autoFocus
              onBlur={() => {
                setPlayerName(tempName || 'Player');
                setIsEditingName(false);
              }}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2 bg-white px-4 py-2 rounded-2xl shadow-sm cursor-pointer" onClick={() => setIsEditingName(true)}>
            <span className="text-lg font-medium">{playerName}</span>
            <button className="text-gray-400 hover:text-charcoal">✏️</button>
          </div>
        )}
      </div>

      {/* If game is preselected from home card, show focused header badge instead of 7-game grid */}
      {isPreselected && currentGameInfo && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border-2 ${currentGameInfo.color} border-charcoal/10 shadow-sm`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentGameInfo.emoji}</span>
            <div>
              <div className="text-[11px] font-bold text-warmgray uppercase tracking-wider">Tanding Duel</div>
              <h2 className="text-xl font-black text-charcoal">{currentGameInfo.title}</h2>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-warmgray hover:text-charcoal underline px-2 py-1"
          >
            Pilih Game Lain
          </button>
        </div>
      )}

      <div className="flex bg-white rounded-2xl p-1 shadow-sm">
        <button 
          className={`flex-1 py-3 rounded-xl font-bold transition-colors ${tab === 'create' ? 'bg-charcoal text-white' : 'text-gray-500'}`}
          onClick={() => setTab('create')}
        >
          Create Room
        </button>
        <button 
          className={`flex-1 py-3 rounded-xl font-bold transition-colors ${tab === 'join' ? 'bg-charcoal text-white' : 'text-gray-500'}`}
          onClick={() => setTab('join')}
        >
          Join Room
        </button>
      </div>

      {tab === 'create' ? (
        <div className="flex flex-col gap-6 bg-white p-6 rounded-[20px] shadow-sm">
          {/* Only show game picker if game wasn't preselected */}
          {!isPreselected && (
            <div>
              <h3 className="font-bold text-lg mb-3">Pilih Game</h3>
              <div className="grid grid-cols-2 gap-3">
                {games.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGame(g.id)}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${selectedGame === g.id ? 'border-charcoal ' + g.color : 'border-transparent bg-cream hover:bg-gray-100'}`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="font-bold text-sm text-center">{g.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-bold text-lg mb-3">Tingkat Kesulitan</h3>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDiff(d)}
                  className={`flex-1 py-2 rounded-xl font-bold capitalize border-2 ${selectedDiff === d ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-gray-500'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg">Durasi Pertandingan</h3>
              <span className="text-xs text-warmgray font-bold">Waktu Tiap Pemain</span>
            </div>
            <p className="text-xs text-warmgray mb-3">Batas waktu chess clock masing-masing peserta</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '5 Mnt', val: 300 },
                { label: '10 Mnt', val: 600 },
                { label: '15 Mnt', val: 900 },
                { label: '20 Mnt', val: 1200 },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setSelectedDuration(item.val)}
                  className={`py-2 rounded-xl font-bold text-xs border-2 transition-all ${
                    selectedDuration === item.val
                      ? 'border-charcoal bg-charcoal text-white shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {user?.isGuest ? (
            <div className="p-5 bg-gradient-to-br from-peach/20 via-cream to-lavender/20 border-2 border-peach/40 rounded-2xl flex flex-col items-center text-center gap-3 mt-2">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Lock className="w-6 h-6 text-charcoal" />
              </div>
              <div>
                <h4 className="font-extrabold text-charcoal text-base">Fitur Buat Room Terkunci</h4>
                <p className="text-xs text-warmgray mt-1 leading-relaxed">
                  Status Anda saat ini adalah <strong>Guest (Tamu)</strong>. Guest hanya dapat bergabung ke room duel (di tab <em>Join Room</em>).
                  Untuk membuat room sendiri dan menjadi Host, silakan login dengan akun Google.
                </p>
              </div>
              <button
                onClick={openAuthModal}
                className="w-full py-3 px-4 bg-charcoal hover:bg-black text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Login Google untuk Buat Room</span>
              </button>
            </div>
          ) : (
            <button onClick={handleCreate} className="w-full py-4 rounded-2xl bg-lavender text-charcoal font-black text-xl hover:opacity-90 active:scale-95 transition-all mt-4">
              Create & Play 🚀
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 bg-white p-6 rounded-[20px] shadow-sm">
          <div className="flex flex-col items-center gap-4 py-8">
            <h3 className="font-bold text-xl">Enter Room Code</h3>
            <input 
              type="text" 
              placeholder="e.g. MB1234"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="text-center font-mono text-3xl tracking-widest p-4 bg-cream rounded-2xl outline-none border-2 border-transparent focus:border-charcoal w-full transition-colors"
              maxLength={8}
            />
          </div>
          
          <button onClick={handleJoin} disabled={joinCode.trim().length < 4} className="w-full py-4 rounded-2xl bg-peach text-charcoal font-black text-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Join Room 🎮
          </button>
        </div>
      )}
    </motion.div>
  );
}
