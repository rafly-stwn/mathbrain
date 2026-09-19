import type { MultiplierType } from './types';

export const BOARD_SIZE = 15;
export const RACK_SIZE = 8;
export const MAX_ZERO_MOVES = 6;

// 15x15 board multiplier layout matching Scrabble / Mathable board
export const BOARD_MULTIPLIERS: MultiplierType[][] = Array.from({ length: 15 }, () =>
  Array(15).fill('none' as MultiplierType)
);

// Center Star
BOARD_MULTIPLIERS[7][7] = 'center';

// x3 Score (Triple Equation Score)
const X3_SCORE: [number, number][] = [
  [0, 0], [0, 7], [0, 14],
  [7, 0], [7, 14],
  [14, 0], [14, 7], [14, 14],
];
X3_SCORE.forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = 'x3_score';
});

// x2 Score (Double Equation Score)
const X2_SCORE: [number, number][] = [
  [1, 1], [2, 2], [3, 3], [4, 4],
  [1, 13], [2, 12], [3, 11], [4, 10],
  [13, 1], [12, 2], [11, 3], [10, 4],
  [13, 13], [12, 12], [11, 11], [10, 10],
];
X2_SCORE.forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = 'x2_score';
});

// x3 Point (Triple Tile Point)
const X3_POINT: [number, number][] = [
  [1, 5], [1, 9],
  [5, 1], [5, 5], [5, 9], [5, 13],
  [9, 1], [9, 5], [9, 9], [9, 13],
  [13, 5], [13, 9],
];
X3_POINT.forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = 'x3_point';
});

// x2 Point (Double Tile Point)
const X2_POINT: [number, number][] = [
  [0, 3], [0, 11],
  [2, 6], [2, 8],
  [3, 0], [3, 7], [3, 14],
  [6, 2], [6, 6], [6, 8], [6, 12],
  [7, 3], [7, 11],
  [8, 2], [8, 6], [8, 8], [8, 12],
  [11, 0], [11, 7], [11, 14],
  [12, 6], [12, 8],
  [14, 3], [14, 11],
];
X2_POINT.forEach(([r, c]) => {
  BOARD_MULTIPLIERS[r][c] = 'x2_point';
});

// Initial Tile Distribution: 100 tiles total
export interface TileSpec {
  char: string;
  count: number;
  value: number;
}

export const TILE_SPECS: TileSpec[] = [
  { char: '0', count: 2, value: 1 },
  { char: '1', count: 6, value: 1 },
  { char: '2', count: 6, value: 1 },
  { char: '3', count: 5, value: 2 },
  { char: '4', count: 5, value: 2 },
  { char: '5', count: 5, value: 2 },
  { char: '6', count: 4, value: 2 },
  { char: '7', count: 4, value: 3 },
  { char: '8', count: 4, value: 2 },
  { char: '9', count: 4, value: 2 },
  { char: '10', count: 4, value: 3 },
  { char: '11', count: 2, value: 3 },
  { char: '12', count: 2, value: 3 },
  { char: '13', count: 1, value: 4 },
  { char: '14', count: 1, value: 4 },
  { char: '15', count: 1, value: 4 },
  { char: '16', count: 1, value: 4 },
  { char: '17', count: 1, value: 4 },
  { char: '18', count: 1, value: 4 },
  { char: '19', count: 1, value: 4 },
  { char: '20', count: 2, value: 4 },
  { char: '+', count: 10, value: 1 },
  { char: '-', count: 9, value: 1 },
  { char: '×', count: 6, value: 2 },
  { char: '÷', count: 4, value: 3 },
  { char: '=', count: 14, value: 1 },
];
