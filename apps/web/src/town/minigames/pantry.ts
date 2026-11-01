import { seeded } from '../../shared/art/pixel-canvas';

// Sort the pantry (a mini-game with Hazel): things from the market come one at a time, and each
// goes on its shelf: fruit, veg or the baking shelf. A run of right answers builds a little combo.
// Fewer slips earn more stars. Pure rules; pantry-sheet.ts draws it.

export const SHELVES = ['fruit', 'veg', 'baking'] as const;
export type Shelf = (typeof SHELVES)[number];

export const PANTRY: Record<Shelf, string[]> = {
  fruit: ['apple', 'pear', 'plum', 'berries', 'strawberry'],
  veg: ['carrot', 'peas', 'tomato', 'corn', 'pumpkin', 'radish'],
  baking: ['bread', 'honey', 'egg', 'milk', 'tart', 'biscuit']
};
export const shelfOf = (item: string) => SHELVES.find((s) => PANTRY[s].includes(item))!;

/** Today's basket: 12 things (16 later), mixed up, never the same thing twice in a row. */
export function basket(day: number, round = 0): string[] {
  const all = SHELVES.flatMap((s) => PANTRY[s]);
  const r = seeded(day * 2203 + round * 41 + 9);
  const out: string[] = [];
  while (out.length < (day < 30 ? 12 : 16)) {
    const it = all[Math.floor(r() * all.length)];
    if (it !== out.at(-1)) out.push(it);
  }
  return out;
}

/** Stars: no slips is three, a couple is two. */
export const pantryStars = (slips: number) => slips === 0 ? 3 : slips <= 2 ? 2 : 1;
