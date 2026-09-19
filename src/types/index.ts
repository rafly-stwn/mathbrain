export type GameId = 'speed-addition' | 'speed-multiplication' | 'kraepelin' | 'magic-square' | 'sudoku' | 'kenken' | 'kakuro' | 'math-scrabble';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameMode = 'solo' | 'duel';

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  emoji: string;
  color: string; // tailwind bg class
  accentColor: string; // hex
  path: string;
  available: boolean;
}

export interface GameScore {
  gameId: GameId;
  score: number;
  difficulty: Difficulty;
  date: string; // ISO string
  duration: number; // seconds
  correct: number;
  wrong: number;
}

export interface GameStats {
  bestScore: number;
  totalGames: number;
  averageScore: number;
  lastPlayed: string | null;
  scores: GameScore[];
}

