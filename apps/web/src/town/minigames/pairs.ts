import { seeded } from '../../shared/art/pixel-canvas';

// Garden pairs (a mini-game with Bea): cards face down, turn two at a time to find matching
// pairs from the garden. Pairs stay face up. Fewer misses earn more stars. Pure rules; pairs-sheet.ts draws it.

export const PAIR_ITEMS = ['carrot', 'strawberry', 'corn', 'pear', 'egg', 'honey', 'bread', 'milk'];

/** Sorrel's stash: the things a squirrel tucks away for winter. */
export const STASH_ITEMS = ['acorn', 'apple', 'pear', 'berries', 'mushroom', 'honey', 'plum', 'twig'];

/** Today's cards: 6 pairs, 8 later in the year, shuffled. */
export function dealPairs(day: number, round = 0, items: string[] = PAIR_ITEMS): string[] {
  const pairs = items.slice(0, day < 30 ? 6 : 8);
  const cards = [...pairs, ...pairs];
  const r = seeded(day * 3331 + round * 97 + 1);
  for (let i = cards.length - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}

export interface PairsState { cards: string[]; matched: boolean[]; up: number[]; misses: number }
export const newPairs = (cards: string[]): PairsState => ({ cards, matched: cards.map(() => false), up: [], misses: 0 });

/** Turn a card: the first of two stays up; the second matches (both stay) or misses (both go back). */
export function turn(s: PairsState, i: number): { state: PairsState; result: 'first' | 'match' | 'miss' | 'none' } {
  if (s.matched[i] || s.up.includes(i) || s.up.length >= 2) return { state: s, result: 'none' };
  if (!s.up.length) return { state: { ...s, up: [i] }, result: 'first' };
  const [a] = s.up;
  if (s.cards[a] === s.cards[i]) {
    const matched = [...s.matched]; matched[a] = true; matched[i] = true;
    return { state: { ...s, matched, up: [] }, result: 'match' };
  }
  return { state: { ...s, up: [a, i], misses: s.misses + 1 }, result: 'miss' };
}

/** After a miss has been seen: both cards back down. */
export const flipBack = (s: PairsState): PairsState => ({ ...s, up: [] });
export const allMatched = (s: PairsState) => s.matched.every(Boolean);

/** Stars: a sharp memory is three; any finish is one. */
export const pairStars = (misses: number, pairs: number) => misses <= pairs - 2 ? 3 : misses <= pairs + 2 ? 2 : 1;
