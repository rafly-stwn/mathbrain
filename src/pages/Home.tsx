import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { games } from '../data/games';
import { useGameStore } from '../stores/gameStore';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const scores = useGameStore((state) => state.scores);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-10"
    >
      {/* Hero Section */}
      <section className="text-center pt-8 pb-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-charcoal mb-4 flex items-center justify-center gap-3">
          Latih Otakmu!
          <motion.span
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
            className="origin-bottom-right inline-block"
          >
            🧠
          </motion.span>
        </h1>
        <p className="text-base md:text-lg text-warmgray font-medium">Permainan matematika seru untuk mengasah ketajaman berpikir</p>
      </section>

      {/* Game Grid */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {games.map((game) => {
          const stats = scores[game.id];
          const isAvailable = game.available;

          return (
            <motion.div
              key={game.id}
              variants={itemVariants}
              whileHover={isAvailable ? { y: -5 } : {}}
              className={`relative overflow-hidden rounded-card p-6 shadow-card transition-shadow ${game.color} ${
                isAvailable ? 'hover:shadow-card-hover' : 'opacity-70'
              }`}
            >
              {!isAvailable && (
                <div className="absolute top-3 right-3 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-pill text-xs font-bold text-charcoal shadow-sm z-10">
                  Segera Hadir
                </div>
              )}
              
              <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 h-full relative z-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/50 p-2 sm:p-2.5 rounded-2xl lg:mb-2 flex items-center justify-center shrink-0 shadow-xs">
                  {game.icon ? (
                    <img src={game.icon} alt={game.name} className="w-full h-full object-contain drop-shadow-xs" />
                  ) : (
                    <span className="text-4xl">{game.emoji}</span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col w-full">
                  <h3 className="text-xl font-bold text-charcoal mb-1">{game.name}</h3>
                  <p className="text-sm text-charcoal/70 font-medium mb-3 lg:min-h-[40px]">
                    {game.description}
                  </p>
                  
                  {stats && stats.bestScore > 0 && isAvailable && (
                    <div className="mb-4 inline-flex self-start bg-white/60 px-3 py-1 rounded-pill text-sm font-bold text-charcoal">
                      🏆 Terbaik: {stats.bestScore}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-auto pt-2 w-full">
                    <Link
                      to={isAvailable ? `/game/${game.id}` : '#'}
                      className={`flex-1 text-center py-2 px-3 rounded-button font-bold text-sm transition-transform ${
                        isAvailable 
                          ? 'bg-white text-charcoal hover:scale-105 active:scale-95 shadow-sm' 
                          : 'bg-white/40 text-charcoal/50 cursor-not-allowed'
                      }`}
                      onClick={(e) => !isAvailable && e.preventDefault()}
                    >
                      Solo
                    </Link>
                    <Link
                      to={isAvailable ? `/duel?game=${game.id}` : '#'}
                      className={`flex-1 text-center py-2 px-3 rounded-button font-bold text-sm transition-transform ${
                        isAvailable 
                          ? 'bg-charcoal text-white hover:scale-105 active:scale-95 shadow-sm' 
                          : 'bg-charcoal/20 text-charcoal/50 cursor-not-allowed'
                      }`}
                      onClick={(e) => !isAvailable && e.preventDefault()}
                    >
                      Duel
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.section>
    </motion.div>
  );
}

