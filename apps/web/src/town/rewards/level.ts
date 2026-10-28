import { TUNING } from '../data/tuning';

// Puff's sparkle level: cleaning, jobs, restores and finds all earn XP. Each level gives Sparkles
// and a new title, and every few levels a bigger Fluff bar. Levels only ever go up.

/** XP needed to go from this level to the next. */
export function xpToNext(level: number) {
  const R = TUNING.rewards;
  return Math.round(R.levelXpBase * R.levelXpGrowth ** (level - 1));
}

/** Add XP; returns the new XP and level, and each level reached on the way. */
export function addXp(r: { xp: number; level: number }, gain: number) {
  let { xp, level } = r;
  xp += gain;
  const ups: number[] = [];
  while (xp >= xpToNext(level)) { xp -= xpToNext(level); level += 1; ups.push(level); }
  return { xp, level, ups };
}

/** What reaching a level gives. */
export function levelReward(level: number) {
  const R = TUNING.rewards;
  return { sparkles: R.levelSparkles * level, fluffMax: level % R.levelFluffEvery === 0 ? TUNING.fluffMaxStep : 0 };
}
