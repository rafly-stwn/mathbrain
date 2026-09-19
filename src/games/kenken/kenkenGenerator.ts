export type Operator = '+' | '-' | '×' | '÷' | '';

export interface Cage {
  id: number;
  cells: [number, number][]; // [row, col]
  target: number;
  op: Operator;
}

export interface KenKenPuzzle {
  size: number;
  grid: number[][]; // solution
  cages: Cage[];
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate Latin Square
function generateLatinSquare(size: number): number[][] {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < size; i++) {
      if (grid[r][i] === num) return false;
      if (grid[i][c] === num) return false;
    }
    return true;
  }

  function solve(r: number, c: number): boolean {
    if (r === size) return true;
    if (c === size) return solve(r + 1, 0);

    const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1));
    for (const num of nums) {
      if (isValid(r, c, num)) {
        grid[r][c] = num;
        if (solve(r, c + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  solve(0, 0);
  return grid;
}

export function generateKenKen(difficulty: 'easy' | 'medium' | 'hard'): KenKenPuzzle {
  let size = 4;
  let ops: Operator[] = ['+', '-'];
  if (difficulty === 'medium') {
    size = 5;
    ops = ['+', '-', '×'];
  } else if (difficulty === 'hard') {
    size = 6;
    ops = ['+', '-', '×', '÷'];
  }

  const grid = generateLatinSquare(size);
  const cages: Cage[] = [];
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  let cageId = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c]) continue;

      const cageSize = Math.floor(Math.random() * 3) + 1; // 1 to 3
      const cells: [number, number][] = [[r, c]];
      visited[r][c] = true;

      // Try to expand cage
      let currentR = r;
      let currentC = c;
      for (let i = 1; i < cageSize; i++) {
        const neighbors: [number, number][] = [];
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dr, dc] of directions) {
          const nr = currentR + dr;
          const nc = currentC + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
            neighbors.push([nr, nc]);
          }
        }

        if (neighbors.length > 0) {
          const next = neighbors[Math.floor(Math.random() * neighbors.length)];
          cells.push(next);
          visited[next[0]][next[1]] = true;
          currentR = next[0];
          currentC = next[1];
        } else {
          break; // no more space to expand
        }
      }

      // Determine target and operator
      const values = cells.map(([cr, cc]) => grid[cr][cc]);
      let target = 0;
      let op: Operator = '';

      if (cells.length === 1) {
        target = values[0];
        op = '';
      } else if (cells.length === 2) {
        const [a, b] = [Math.max(values[0], values[1]), Math.min(values[0], values[1])];
        const allowedOps = [...ops];
        if (!allowedOps.includes('÷') || a % b !== 0) {
          const idx = allowedOps.indexOf('÷');
          if (idx > -1) allowedOps.splice(idx, 1);
        }

        op = allowedOps[Math.floor(Math.random() * allowedOps.length)];
        if (op === '+') target = a + b;
        else if (op === '-') target = a - b;
        else if (op === '×') target = a * b;
        else if (op === '÷') target = a / b;
      } else {
        const allowedOps = ops.filter(o => o === '+' || o === '×');
        op = allowedOps[Math.floor(Math.random() * allowedOps.length)] || '+';
        if (op === '+') {
          target = values.reduce((sum, v) => sum + v, 0);
        } else if (op === '×') {
          target = values.reduce((prod, v) => prod * v, 1);
        }
      }

      // Sort cells for consistency
      cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

      cages.push({
        id: cageId++,
        cells,
        target,
        op
      });
    }
  }

  return { size, grid, cages };
}

export function isCageValid(cage: Cage, currentGrid: (number | null)[][]): boolean {
  const values = cage.cells.map(([r, c]) => currentGrid[r][c]);
  
  if (values.some(v => v === null)) return true;

  const numValues = values as number[];

  if (cage.cells.length === 1) {
    return numValues[0] === cage.target;
  }

  if (cage.cells.length === 2) {
    const [a, b] = [Math.max(numValues[0], numValues[1]), Math.min(numValues[0], numValues[1])];
    if (cage.op === '+') return a + b === cage.target;
    if (cage.op === '-') return a - b === cage.target;
    if (cage.op === '×') return a * b === cage.target;
    if (cage.op === '÷') return a / b === cage.target;
  }

  if (cage.op === '+') {
    return numValues.reduce((sum, v) => sum + v, 0) === cage.target;
  }
  if (cage.op === '×') {
    return numValues.reduce((prod, v) => prod * v, 1) === cage.target;
  }

  return false;
}

export function isPuzzleSolved(puzzle: KenKenPuzzle, currentGrid: (number | null)[][]): boolean {
  const { size, cages } = puzzle;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (currentGrid[r][c] === null) return false;
    }
  }

  for (let i = 0; i < size; i++) {
    const rowSet = new Set();
    const colSet = new Set();
    for (let j = 0; j < size; j++) {
      rowSet.add(currentGrid[i][j]);
      colSet.add(currentGrid[j][i]);
    }
    if (rowSet.size !== size || colSet.size !== size) return false;
  }

  for (const cage of cages) {
    if (!isCageValid(cage, currentGrid)) return false;
  }

  return true;
}
