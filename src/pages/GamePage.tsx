import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { games } from '../data/games';
import type { GameId } from '../types';
import SpeedAddition from '../games/speed-addition/SpeedAddition';
import SpeedMultiplication from '../games/speed-multiplication/SpeedMultiplication';
import Kraepelin from '../games/kraepelin/Kraepelin';
import MagicSquare from '../games/magic-square/MagicSquare';
import Sudoku from '../games/sudoku/Sudoku';
import KenKen from '../games/kenken/KenKen';
import Kakuro from '../games/kakuro/Kakuro';
import MathScrabble from '../games/math-scrabble/MathScrabble';

const gameComponents: Partial<Record<GameId, React.ComponentType>> = {
  'speed-addition': SpeedAddition,
  'speed-multiplication': SpeedMultiplication,
  'kraepelin': Kraepelin,
  'magic-square': MagicSquare,
  'sudoku': Sudoku,
  'kenken': KenKen,
  'kakuro': Kakuro,
  'math-scrabble': MathScrabble,
};

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const game = games.find(g => g.id === gameId);
  const GameComponent = gameId ? gameComponents[gameId as GameId] : undefined;

  if (!game || !game.available || !GameComponent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      >
        <div className="text-6xl">🚧</div>
        <h2 className="text-2xl font-extrabold">Segera Hadir</h2>
        <p className="text-warmgray">Game ini sedang dalam tahap pengembangan.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2.5 bg-lavender text-white font-bold rounded-button hover:bg-lavender/80 active:scale-95 transition-all"
        >
          ← Kembali ke Beranda
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <GameComponent />
    </motion.div>
  );
}
