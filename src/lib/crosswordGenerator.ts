import { ClueEntry } from '@/data/puzzles';

export interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  number: number;
}

export interface CrosswordGrid {
  grid: string[][];
  placedWords: PlacedWord[];
  width: number;
  height: number;
}

interface Placement {
  row: number;
  col: number;
  direction: 'across' | 'down';
  intersections: number;
}

function findPlacements(
  grid: string[][],
  word: string,
  width: number,
  height: number
): Placement[] {
  const placements: Placement[] = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Try across
      if (col + word.length <= width) {
        const placement = checkPlacement(grid, word, row, col, 'across', width, height);
        if (placement) placements.push(placement);
      }
      // Try down
      if (row + word.length <= height) {
        const placement = checkPlacement(grid, word, row, col, 'down', width, height);
        if (placement) placements.push(placement);
      }
    }
  }

  return placements;
}

function checkPlacement(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  width: number,
  height: number
): Placement | null {
  let intersections = 0;
  const dr = direction === 'down' ? 1 : 0;
  const dc = direction === 'across' ? 1 : 0;

  // Check cell before the word
  const beforeR = row - dr;
  const beforeC = col - dc;
  if (beforeR >= 0 && beforeC >= 0 && grid[beforeR][beforeC] !== '') return null;

  // Check cell after the word
  const afterR = row + dr * word.length;
  const afterC = col + dc * word.length;
  if (afterR < height && afterC < width && grid[afterR][afterC] !== '') return null;

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const cell = grid[r][c];

    if (cell === word[i]) {
      intersections++;
    } else if (cell !== '') {
      return null;
    } else {
      // Check adjacent cells perpendicular to direction
      if (direction === 'across') {
        if (r > 0 && grid[r - 1][c] !== '' && grid[r][c] === '') return null;
        if (r < height - 1 && grid[r + 1][c] !== '' && grid[r][c] === '') return null;
      } else {
        if (c > 0 && grid[r][c - 1] !== '' && grid[r][c] === '') return null;
        if (c < width - 1 && grid[r][c + 1] !== '' && grid[r][c] === '') return null;
      }
    }
  }

  if (intersections === 0 && grid.some(row => row.some(cell => cell !== ''))) {
    return null; // Must intersect if grid is not empty
  }

  return { row, col, direction, intersections };
}

export function generateCrossword(clues: ClueEntry[], maxWords: number = 15): CrosswordGrid {
  const gridSize = 25;
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

  // Sort words by length (longest first for better placement)
  const sorted = [...clues].sort((a, b) => b.word.length - a.word.length);

  const placed: { word: string; clue: string; row: number; col: number; direction: 'across' | 'down' }[] = [];

  for (const entry of sorted) {
    if (placed.length >= maxWords) break;

    const word = entry.word.toUpperCase();
    const placements = findPlacements(grid, word, gridSize, gridSize);

    if (placements.length === 0 && placed.length === 0) {
      // First word: place in center
      const row = Math.floor(gridSize / 2);
      const col = Math.floor((gridSize - word.length) / 2);
      for (let i = 0; i < word.length; i++) {
        grid[row][col + i] = word[i];
      }
      placed.push({ word, clue: entry.clue, row, col, direction: 'across' });
    } else if (placements.length > 0) {
      // Pick best placement (most intersections)
      placements.sort((a, b) => b.intersections - a.intersections);
      const best = placements[0];
      const dr = best.direction === 'down' ? 1 : 0;
      const dc = best.direction === 'across' ? 1 : 0;
      for (let i = 0; i < word.length; i++) {
        grid[best.row + dr * i][best.col + dc * i] = word[i];
      }
      placed.push({ word, clue: entry.clue, row: best.row, col: best.col, direction: best.direction });
    }
  }

  // Find bounding box
  let minR = gridSize, maxR = 0, minC = gridSize, maxC = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== '') {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  // Add 1-cell padding
  minR = Math.max(0, minR - 1);
  minC = Math.max(0, minC - 1);
  maxR = Math.min(gridSize - 1, maxR + 1);
  maxC = Math.min(gridSize - 1, maxC + 1);

  const width = maxC - minC + 1;
  const height = maxR - minR + 1;

  const croppedGrid = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (_, c) => grid[minR + r][minC + c])
  );

  const adjustedPlaced = placed.map(p => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }));

  // Assign numbers
  const numberMap = new Map<string, number>();
  let num = 1;

  // Sort by position (top-left to bottom-right)
  const sortedPlaced = [...adjustedPlaced].sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.col - b.col
  );

  for (const p of sortedPlaced) {
    const key = `${p.row},${p.col}`;
    if (!numberMap.has(key)) {
      numberMap.set(key, num++);
    }
  }

  const placedWords: PlacedWord[] = sortedPlaced.map(p => ({
    word: p.word,
    clue: p.clue,
    row: p.row,
    col: p.col,
    direction: p.direction,
    number: numberMap.get(`${p.row},${p.col}`)!,
  }));

  return { grid: croppedGrid, placedWords, width, height };
}
