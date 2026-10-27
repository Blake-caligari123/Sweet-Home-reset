import type { NeighbourDef } from './neighbours';
import type { Friend } from '../data/save';
import { heartsOf } from './talk';
import { TUNING } from '../data/tuning';

// Friendship (GDD v3 A8): a chat a day, one gift a day, request rewards; 10 points a heart and
// points only ever go up. A gift they'd rather not have is met kindly and costs nothing.
export type Taste = 'loved' | 'liked' | 'neutral' | 'disliked';

/** Points for a gift nobody especially loves: a thank-you. */
const NEUTRAL_GIFT = 1;

export function tasteOf(def: NeighbourDef, item: string): Taste {
  return def.loves.includes(item) ? 'loved' : def.likes.includes(item) ? 'liked' : def.dislikes.includes(item) ? 'disliked' : 'neutral';
}

function add(f: Friend, n: number) {
  const before = heartsOf(f.points);
  f.points += Math.max(0, n);
  return heartsOf(f.points) - before;
}

/** The day's chat: points the first time each day, nothing after. */
export function chat(f: Friend, day: number) {
  if (f.talkedDay === day) return 0;
  f.talkedDay = day;
  add(f, TUNING.friendship.talk);
  return TUNING.friendship.talk;
}

export function canGift(f: Friend, day: number) { return f.giftDay !== day; }

export function give(def: NeighbourDef, f: Friend, item: string, day: number) {
  const taste = tasteOf(def, item);
  const gained = taste === 'loved' ? TUNING.friendship.loved : taste === 'liked' ? TUNING.friendship.liked : taste === 'neutral' ? NEUTRAL_GIFT : 0;
  f.giftDay = day;
  if ((taste === 'loved' || taste === 'liked') && !(f.known ?? []).includes(item)) f.known = [...(f.known ?? []), item];
  return { taste, gained, heartUp: add(f, gained) };
}
