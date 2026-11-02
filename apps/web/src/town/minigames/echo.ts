import { seeded } from '../../shared/art/pixel-canvas';

// Echo the tune (a mini-game with Juniper): four bells play a little tune; play it back. Each
// tune is one note longer, from three to six. A slip just plays it again. Fewer slips earn more
// stars. Pure rules; echo-sheet.ts plays it.

export const BELLS = 4;
export const FIRST = 3; export const LAST = 6;

/** The whole tune for this day and round (each level plays the first n notes of it). */
export function tune(day: number, round = 0): number[] {
  const r = seeded(day * 1201 + round * 37 + 3);
  const out: number[] = [];
  while (out.length < LAST) { const n = Math.floor(r() * BELLS); if (n !== out.at(-1)) out.push(n); }
  return out;
}

/** Puff plays a bell: still going, the phrase heard right, or a slip. */
export function echo(heard: number[], played: number[], length: number): 'more' | 'right' | 'slip' {
  const i = played.length - 1;
  if (played[i] !== heard[i]) return 'slip';
  return played.length >= length ? 'right' : 'more';
}

export const echoStars = (slips: number) => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
