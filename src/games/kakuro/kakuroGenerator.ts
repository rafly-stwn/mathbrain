import type { Difficulty } from '../../types';

export type CellType = 'block' | 'clue' | 'white';

export interface KakuroCell {
  type: CellType;
  downClue?: number;
  rightClue?: number;
  solution?: number; // for white cells
}

export interface KakuroPuzzle {
  rows: number;
  cols: number;
  grid: KakuroCell[][];
}

const easyPuzzles: KakuroPuzzle[] = [
  {
    rows: 4,
    cols: 4,
    grid: [
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', downClue: 6 }, { type: 'clue', downClue: 11 }],
      [{ type: 'block' }, { type: 'clue', rightClue: 5, downClue: 4 }, { type: 'white', solution: 1 }, { type: 'white', solution: 4 }],
      [{ type: 'clue', rightClue: 12 }, { type: 'white', solution: 3 }, { type: 'white', solution: 2 }, { type: 'white', solution: 7 }],
      [{ type: 'clue', rightClue: 4 }, { type: 'white', solution: 1 }, { type: 'white', solution: 3 }, { type: 'block' }]
    ]
  }
];

const mediumPuzzles: KakuroPuzzle[] = [
  {
    rows: 5,
    cols: 5,
    grid: [
      [{ type: 'block' }, { type: 'clue', downClue: 11 }, { type: 'clue', downClue: 5 }, { type: 'block' }, { type: 'block' }],
      [{ type: 'clue', rightClue: 9 }, { type: 'white', solution: 8 }, { type: 'white', solution: 1 }, { type: 'clue', downClue: 17 }, { type: 'clue', downClue: 12 }],
      [{ type: 'clue', rightClue: 21 }, { type: 'white', solution: 3 }, { type: 'white', solution: 4 }, { type: 'white', solution: 9 }, { type: 'white', solution: 5 }],
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', rightClue: 12, downClue: 1 }, { type: 'white', solution: 5 }, { type: 'white', solution: 7 }],
      [{ type: 'block' }, { type: 'clue', rightClue: 4 }, { type: 'white', solution: 1 }, { type: 'white', solution: 3 }, { type: 'block' }]
    ]
  }
];

const hardPuzzles: KakuroPuzzle[] = [
  {
    rows: 6,
    cols: 6,
    grid: [
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', downClue: 17 }, { type: 'clue', downClue: 4 }, { type: 'block' }, { type: 'block' }],
      [{ type: 'block' }, { type: 'clue', rightClue: 8, downClue: 10 }, { type: 'white', solution: 5 }, { type: 'white', solution: 3 }, { type: 'clue', downClue: 25 }, { type: 'clue', downClue: 7 }],
      [{ type: 'clue', rightClue: 22 }, { type: 'white', solution: 2 }, { type: 'white', solution: 8 }, { type: 'white', solution: 1 }, { type: 'white', solution: 7 }, { type: 'white', solution: 4 }],
      [{ type: 'clue', rightClue: 12 }, { type: 'white', solution: 8 }, { type: 'white', solution: 4 }, { type: 'clue', rightClue: 12, downClue: 6 }, { type: 'white', solution: 9 }, { type: 'white', solution: 3 }],
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', rightClue: 8 }, { type: 'white', solution: 5 }, { type: 'white', solution: 3 }, { type: 'block' }],
      [{ type: 'block' }, { type: 'block' }, { type: 'clue', rightClue: 7 }, { type: 'white', solution: 1 }, { type: 'white', solution: 6 }, { type: 'block' }]
    ]
  }
];

export const getKakuroPuzzle = (difficulty: Difficulty): KakuroPuzzle => {
  let list;
  if (difficulty === 'easy') list = easyPuzzles;
  else if (difficulty === 'medium') list = mediumPuzzles;
  else list = hardPuzzles;
  
  return list[Math.floor(Math.random() * list.length)];
};

export const isKakuroComplete = (puzzle: KakuroPuzzle, userValues: (number | null)[][]): boolean => {
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const cell = puzzle.grid[r][c];
      if (cell.type === 'white') {
        if (userValues[r][c] !== cell.solution) return false;
      }
    }
  }
  return true;
};
