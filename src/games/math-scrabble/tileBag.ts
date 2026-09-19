import { TILE_SPECS } from './constants';
import type { Tile } from './types';

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createTileBag(seed?: number, prefix?: string): Tile[] {
  const bag: Tile[] = [];
  let idCounter = 1;
  const tilePrefix = prefix || Math.random().toString(36).substring(2, 6);

  for (const spec of TILE_SPECS) {
    for (let i = 0; i < spec.count; i++) {
      bag.push({
        id: `${tilePrefix}-t${idCounter++}-${spec.char}`,
        char: spec.char,
        value: spec.value,
      });
    }
  }

  // Shuffle using PRNG if seed provided, otherwise Math.random
  const random = seed !== undefined ? createPrng(seed) : Math.random;
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}

export function drawTiles(
  bag: Tile[],
  count: number
): { drawn: Tile[]; remaining: Tile[] } {
  const takeCount = Math.min(count, bag.length);
  const drawn = bag.slice(0, takeCount);
  const remaining = bag.slice(takeCount);
  return { drawn, remaining };
}
