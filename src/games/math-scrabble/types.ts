export type MultiplierType = 'none' | 'center' | 'x2_point' | 'x3_point' | 'x2_score' | 'x3_score';

export interface Tile {
  id: string;
  char: string; // e.g. '0'-'20', '+', '-', '×', '÷', '='
  value: number; // subscript points
}

export interface BoardCell {
  r: number;
  c: number;
  multiplier: MultiplierType;
  tile: Tile | null;
  owner?: 'me' | 'opponent' | 'initial';
  isNew?: boolean;
}

export interface Placement {
  r: number;
  c: number;
  tile: Tile;
}

export interface EquationValidationResult {
  valid: boolean;
  error?: string;
  score?: number;
  equations?: { text: string; score: number }[];
}

export interface PlayerStats {
  score: number;
  turns: number;
  zeroMoves: number;
  passes: number;
}
