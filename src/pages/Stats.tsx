import { useGameStore } from '../stores/gameStore';
import { games } from '../data/games';
import { motion } from 'framer-motion';

export default function Stats() {
  const scores = useGameStore((state) => state.scores);
  
  const playedGames = games.filter(g => scores[g.id] && scores[g.id]!.totalGames > 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto space-y-8 w-full"
    >
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-charcoal mb-2">Your Stats 📊</h1>
      </div>
      
      {playedGames.length === 0 ? (
        <div className="bg-white rounded-card p-8 shadow-card text-center">
          <p className="text-lg text-warmgray font-medium">Play some games to see your statistics here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {playedGames.map((game, i) => {
            const stats = scores[game.id]!;
            return (
              <motion.div 
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-card p-5 shadow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cream p-1.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                    {game.icon ? (
                      <img src={game.icon} alt={game.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">{game.emoji}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal text-lg">{game.name}</h3>
                    <p className="text-sm text-warmgray font-medium">Games played: {stats.totalGames}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-warmgray font-bold uppercase tracking-wider mb-1">Best Score</div>
                  <div className="text-2xl font-extrabold text-lavender">{stats.bestScore}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

