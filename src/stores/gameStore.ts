import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId, GameScore, GameStats } from '../types';

interface Settings {
  soundEnabled: boolean;
  instructionsSeen: Partial<Record<GameId, boolean>>;
}

interface GameStore {
  scores: Partial<Record<GameId, GameStats>>;
  settings: Settings;
  addScore: (gameId: GameId, score: GameScore) => void;
  markInstructionSeen: (gameId: GameId) => void;
  toggleSound: () => void;
  resetStats: () => void;
}

const defaultStats = (): GameStats => ({
  bestScore: 0,
  totalGames: 0,
  averageScore: 0,
  lastPlayed: null,
  scores: [],
});

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      scores: {},
      settings: {
        soundEnabled: true,
        instructionsSeen: {},
      },

      addScore: (gameId, score) =>
        set((state) => {
          const currentStats = state.scores[gameId] || defaultStats();
          
          const newTotalGames = currentStats.totalGames + 1;
          const newTotalScore = (currentStats.averageScore * currentStats.totalGames) + score.score;
          const newAverageScore = newTotalScore / newTotalGames;
          
          return {
            scores: {
              ...state.scores,
              [gameId]: {
                bestScore: Math.max(currentStats.bestScore, score.score),
                totalGames: newTotalGames,
                averageScore: newAverageScore,
                lastPlayed: score.date,
                scores: [...currentStats.scores, score],
              },
            },
          };
        }),

      markInstructionSeen: (gameId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            instructionsSeen: {
              ...state.settings.instructionsSeen,
              [gameId]: true,
            },
          },
        })),

      toggleSound: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            soundEnabled: !state.settings.soundEnabled,
          },
        })),

      resetStats: () => set({ scores: {} }),
    }),
    {
      name: 'mathbrain-storage',
    }
  )
);

