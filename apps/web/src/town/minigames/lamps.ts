import { seeded } from '../../shared/art/pixel-canvas';

// Light the lamps (a mini-game with Pip): a grid of lamps; tapping one flips it and the ones
// beside it (up, down, left, right). Light them all. Every board is dealt by flipping a lit
// board a few times, so it can always be solved in that many taps or fewer. Pure rules; lamps-sheet.ts draws it.

export interface LampBoard { size: number; lit: boolean[]; par: number }

/** Flip a lamp and its neighbours. */
export function press(lit: boolean[], size: number, i: number): boolean[] {
  const out = [...lit];
  const x = i % size; const y = Math.floor(i / size);
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx; const ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < size && ny < size) out[ny * size + nx] = !out[ny * size + nx];
  }
  return out;
}

export const allLit = (lit: boolean[]) => lit.every(Boolean);

/** Today's board: 3×3 to begin with, 4×4 from day 25; a few more taps deep as the year goes on. */
export function dealLamps(day: number, round = 0): LampBoard {
  const size = day < 25 ? 3 : 4;
  const taps = Math.min(size * size - 2, 3 + Math.floor(day / 20));
  const r = seeded(day * 1789 + round * 83 + 5);
  for (let tries = 0; tries < 20; tries += 1) {
    const cells = Array.from({ length: size * size }, (_, i) => i).map((i) => ({ i, k: r() })).sort((a, b) => a.k - b.k).slice(0, taps).map((c) => c.i);
    let lit = new Array(size * size).fill(true);
    for (const c of cells) lit = press(lit, size, c);
    if (!allLit(lit)) return { size, lit, par: taps };
  }
  return { size, lit: press(new Array(size * size).fill(true), size, 0), par: 1 };
}

export const lampStars = (taps: number, par: number) => taps <= par ? 3 : taps <= par * 2 ? 2 : 1;
