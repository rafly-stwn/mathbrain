export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Checks if it's valid to place `num` at `grid[row][col]`.
 */
export const isValid = (grid: (number | null)[][], row: number, col: number, num: number): boolean => {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c] === num) return false;
  }
  // Check col
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }
  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[startRow + r][startCol + c] === num) return false;
    }
  }
  return true;
};

/**
 * Fills the grid using backtracking to generate a valid full Sudoku board.
 */
const fillGrid = (grid: (number | null)[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        // Try numbers 1-9 in random order
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) {
              return true;
            }
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
};

export const generateSudoku = (difficulty: Difficulty): { initialGrid: (number | null)[][], solution: number[][] } => {
  const solution: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
  
  // Fill the grid to get a complete solution
  fillGrid(solution);
  const finalSolution = solution as number[][];

  // Copy solution to initialGrid
  const initialGrid: (number | null)[][] = finalSolution.map(row => [...row]);

  // Determine how many clues to keep
  let clues = 40;
  if (difficulty === 'easy') clues = 38 + Math.floor(Math.random() * 5); // 38-42
  else if (difficulty === 'medium') clues = 30 + Math.floor(Math.random() * 5); // 30-34
  else if (difficulty === 'hard') clues = 24 + Math.floor(Math.random() * 5); // 24-28

  let cellsToRemove = 81 - clues;
  while (cellsToRemove > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (initialGrid[r][c] !== null) {
      initialGrid[r][c] = null;
      cellsToRemove--;
    }
  }

  return { initialGrid, solution: finalSolution };
};
