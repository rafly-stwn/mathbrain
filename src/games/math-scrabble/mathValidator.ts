import { BOARD_SIZE, BOARD_MULTIPLIERS } from './constants';
import type { BoardCell, Placement, EquationValidationResult } from './types';

// Evaluates an expression string like "5 + 3" or "7 × 2" or "14 ÷ 2"
export function evaluateExpression(exprStr: string): { valid: boolean; value: number } {
  // Normalize operators
  const normalized = exprStr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/:/g, '/')
    .trim();

  // Tokenize
  const tokens: (number | string)[] = [];
  let currentNum = '';

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === ' ') continue;

    if (ch >= '0' && ch <= '9') {
      currentNum += ch;
    } else if (['+', '-', '*', '/'].includes(ch)) {
      if (currentNum !== '') {
        tokens.push(parseFloat(currentNum));
        currentNum = '';
      }
      tokens.push(ch);
    } else {
      return { valid: false, value: 0 };
    }
  }

  if (currentNum !== '') {
    tokens.push(parseFloat(currentNum));
  }

  if (tokens.length === 0) return { valid: false, value: 0 };

  // Syntax check: cannot start or end with operator, cannot have consecutive operators
  if (typeof tokens[0] === 'string' || typeof tokens[tokens.length - 1] === 'string') {
    return { valid: false, value: 0 };
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    if (typeof tokens[i] === 'string' && typeof tokens[i + 1] === 'string') {
      return { valid: false, value: 0 };
    }
  }

  // Pass 1: Multiplication and Division
  const pass1: (number | string)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === '*' || tok === '/') {
      const prev = pass1.pop();
      const next = tokens[i + 1];
      if (typeof prev !== 'number' || typeof next !== 'number') {
        return { valid: false, value: 0 };
      }
      if (tok === '/') {
        if (next === 0) return { valid: false, value: 0 }; // Div by zero
        pass1.push(prev / next);
      } else {
        pass1.push(prev * next);
      }
      i += 2;
    } else {
      pass1.push(tok);
      i++;
    }
  }

  // Pass 2: Addition and Subtraction
  let result = pass1[0];
  if (typeof result !== 'number') return { valid: false, value: 0 };

  i = 1;
  while (i < pass1.length) {
    const op = pass1[i];
    const next = pass1[i + 1];
    if (typeof next !== 'number') return { valid: false, value: 0 };

    if (op === '+') {
      result += next;
    } else if (op === '-') {
      result -= next;
    }
    i += 2;
  }

  return { valid: true, value: result };
}

// Validates a full equation string like "5 + 3 = 8" or "10 = 4 + 6"
export function validateEquation(equationStr: string): boolean {
  const parts = equationStr.split('=').map(p => p.trim());
  if (parts.length < 2) return false;

  const values: number[] = [];
  for (const part of parts) {
    if (!part) return false;
    const res = evaluateExpression(part);
    if (!res.valid) return false;
    values.push(res.value);
  }

  // Verify all sides are equal within small floating tolerance
  const first = values[0];
  return values.every(v => Math.abs(v - first) < 1e-6);
}

export function validateMove(
  board: BoardCell[][],
  placements: Placement[]
): EquationValidationResult {
  if (placements.length === 0) {
    return { valid: false, error: 'Tidak ada ubin yang diletakkan di papan.' };
  }

  // 1. Check if placement positions are already occupied or out of bounds
  for (const p of placements) {
    if (p.r < 0 || p.r >= BOARD_SIZE || p.c < 0 || p.c >= BOARD_SIZE) {
      return { valid: false, error: 'Posisi ubin di luar batas papan.' };
    }
    if (board[p.r][p.c].tile !== null) {
      return { valid: false, error: 'Kotak tersebut sudah terisi ubin lain.' };
    }
  }

  // 2. Collinear check: must be in the same row or same column
  const sameRow = placements.every(p => p.r === placements[0].r);
  const sameCol = placements.every(p => p.c === placements[0].c);

  if (!sameRow && !sameCol) {
    return { valid: false, error: 'Semua ubin baru harus diletakkan dalam satu garis lurus (baris atau kolom).' };
  }

  // Create temporary board with placed tiles
  const tempBoard: BoardCell[][] = board.map(row => row.map(cell => ({ ...cell })));
  placements.forEach(p => {
    tempBoard[p.r][p.c].tile = p.tile;
  });

  // 3. Continuity check along the placement line
  if (sameRow) {
    const r = placements[0].r;
    const cols = placements.map(p => p.c).sort((a, b) => a - b);
    for (let c = cols[0]; c <= cols[cols.length - 1]; c++) {
      if (tempBoard[r][c].tile === null) {
        return { valid: false, error: 'Tidak boleh ada kotak kosong di antara ubin yang diletakkan.' };
      }
    }
  } else {
    const c = placements[0].c;
    const rows = placements.map(p => p.r).sort((a, b) => a - b);
    for (let r = rows[0]; r <= rows[rows.length - 1]; r++) {
      if (tempBoard[r][c].tile === null) {
        return { valid: false, error: 'Tidak boleh ada kotak kosong di antara ubin yang diletakkan.' };
      }
    }
  }

  // 4. Connectivity check
  const isBoardEmpty = board.every(row => row.every(cell => cell.tile === null));
  if (isBoardEmpty) {
    // First move must cover the center star (7, 7)
    const coversCenter = placements.some(p => p.r === 7 && p.c === 7);
    if (!coversCenter) {
      return { valid: false, error: 'Langkah pertama harus menutupi titik bintang di tengah papan (7, 7).' };
    }
    if (placements.length < 3) {
      return { valid: false, error: 'Persamaan pertama minimal membutuhkan 3 ubin.' };
    }
  } else {
    // Must be adjacent to or connect with existing tiles
    let isConnected = false;
    for (const p of placements) {
      const neighbors = [
        [p.r - 1, p.c],
        [p.r + 1, p.c],
        [p.r, p.c - 1],
        [p.r, p.c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (board[nr][nc].tile !== null) {
            isConnected = true;
            break;
          }
        }
      }
      if (isConnected) break;
    }

    if (!isConnected) {
      return { valid: false, error: 'Ubin baru harus terhubung dengan ubin yang sudah ada di papan.' };
    }
  }

  // 5. Extract all formed word sequences (horizontal and vertical)
  const isNewPlacement = (r: number, c: number) => placements.some(p => p.r === r && p.c === c);

  const foundEquations: { cells: { r: number; c: number }[]; text: string; dir: 'H' | 'V' }[] = [];

  // Helper to extract word along a line
  const extractWord = (startR: number, startC: number, dir: 'H' | 'V') => {
    let r = startR;
    let c = startC;

    // Go to start of contiguous line
    if (dir === 'H') {
      while (c > 0 && tempBoard[r][c - 1].tile !== null) c--;
    } else {
      while (r > 0 && tempBoard[r - 1][c].tile !== null) r--;
    }

    const cells: { r: number; c: number }[] = [];
    let text = '';

    while (
      r < BOARD_SIZE &&
      c < BOARD_SIZE &&
      tempBoard[r][c].tile !== null
    ) {
      cells.push({ r, c });
      text += tempBoard[r][c].tile!.char;
      if (dir === 'H') c++;
      else r++;
    }

    return { cells, text, dir };
  };

  // Find primary word
  const primaryDir = sameRow ? 'H' : 'V';
  const primaryWord = extractWord(placements[0].r, placements[0].c, primaryDir);
  if (primaryWord.cells.length > 1) {
    foundEquations.push(primaryWord);
  }

  // Find cross words
  const crossDir = sameRow ? 'V' : 'H';
  for (const p of placements) {
    const crossWord = extractWord(p.r, p.c, crossDir);
    if (crossWord.cells.length > 1) {
      // Avoid duplicate insertion
      const alreadyAdded = foundEquations.some(
        eq =>
          eq.dir === crossDir &&
          eq.cells[0].r === crossWord.cells[0].r &&
          eq.cells[0].c === crossWord.cells[0].c
      );
      if (!alreadyAdded) {
        foundEquations.push(crossWord);
      }
    }
  }

  if (foundEquations.length === 0) {
    return { valid: false, error: 'Tidak ada rangkaian persamaan yang terbentuk.' };
  }

  // 6. Validate every formed equation & calculate scores
  let totalScore = 0;
  const validatedEquations: { text: string; score: number }[] = [];

  for (const eq of foundEquations) {
    if (!validateEquation(eq.text)) {
      return {
        valid: false,
        error: `Persamaan "${eq.text}" tidak valid secara matematika!`,
      };
    }

    // Calculate score for this equation
    let eqTileScore = 0;
    let scoreMultiplier = 1;

    for (const cellCoord of eq.cells) {
      const cell = tempBoard[cellCoord.r][cellCoord.c];
      let tileValue = cell.tile!.value;

      // Multipliers only apply if this tile was placed during this turn
      if (isNewPlacement(cellCoord.r, cellCoord.c)) {
        const mult = BOARD_MULTIPLIERS[cellCoord.r][cellCoord.c];
        if (mult === 'x2_point') tileValue *= 2;
        else if (mult === 'x3_point') tileValue *= 3;
        else if (mult === 'x2_score') scoreMultiplier *= 2;
        else if (mult === 'x3_score') scoreMultiplier *= 3;
      }

      eqTileScore += tileValue;
    }

    const equationFinalScore = eqTileScore * scoreMultiplier;
    totalScore += equationFinalScore;
    validatedEquations.push({ text: eq.text, score: equationFinalScore });
  }

  // Bingo bonus: placing all 8 tiles from rack awards +50 pts!
  if (placements.length >= 8) {
    totalScore += 50;
  }

  return {
    valid: true,
    score: totalScore,
    equations: validatedEquations,
  };
}
