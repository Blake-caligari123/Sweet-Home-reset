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

/** A sorting game's shelves (Hazel's pantry, Fig's seed tins): each with its label and what goes on it. */
export interface SortSet { title: string; intro: string; again: string; shelves: { id: string; label: string; items: string[] }[] }

export const PANTRY_SET: SortSet = { title: '🧺 Sort the pantry', intro: 'Pop each thing on its shelf.', again: 'Another basket',
  shelves: [{ id: 'fruit', label: '🍎 Fruit', items: PANTRY.fruit }, { id: 'veg', label: '🥕 Veg', items: PANTRY.veg }, { id: 'baking', label: '🍞 Baking', items: PANTRY.baking }] };

/** Fig's seed tins: each packet into the season it's sown in. */
export const SEED_SET: SortSet = { title: '🌱 Sort the seed tins', intro: 'Each packet into the tin for its season.', again: 'Another sack',
  shelves: [
    { id: 'spring', label: '🌸 Spring', items: ['radish_seeds', 'pea_seeds', 'daisy_seeds', 'strawberry_seeds'] },
    { id: 'summer', label: '☀ Summer', items: ['corn_seeds', 'tomato_seeds', 'sunflower_seeds', 'poppy_seeds'] },
    { id: 'autumn', label: '🍃 Autumn', items: ['pumpkin_seeds', 'cabbage_seeds', 'aster_seeds'] },
    { id: 'winter', label: '❄ Winter', items: ['kale_seeds', 'snowdrop_seeds'] }
  ] };

/** Which shelf of the set a thing goes on. */
export const shelfIn = (set: SortSet, item: string) => set.shelves.find((s) => s.items.includes(item))!.id;

/** Today's basket: 12 things (16 later), mixed up, never the same thing twice in a row. */
export function basket(day: number, round = 0, set: SortSet = PANTRY_SET): string[] {
  const all = set.shelves.flatMap((s) => s.items);
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
