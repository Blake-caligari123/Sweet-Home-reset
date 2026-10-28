import { TUNING } from '../data/tuning';

// The sparkle chain: every cleaned spot gives Sparkles, and spots cleaned in quick succession
// build a chain worth a little more each step. Walking to the next spot keeps it going; standing
// about lets it fade, gently, with nothing lost.
export interface Chain { count: number; msLeft: number }

export const NO_CHAIN: Chain = { count: 0, msLeft: 0 };

/** A spot cleared: the chain grows if it hadn't faded yet. */
export function cleared(c: Chain) {
  const R = TUNING.rewards;
  const count = c.msLeft > 0 ? c.count + 1 : 1;
  const bonus = Math.min(R.chainBonusMax, Math.floor((count - 1) / R.chainBonusEvery));
  return { chain: { count, msLeft: R.chainWindowMs }, sparkles: R.sparklesPerClean + bonus };
}

/** Time passing while play isn't held; `busy`: Puff is walking or cleaning, so the chain holds. */
export function fade(c: Chain, dt: number, busy: boolean): Chain {
  if (busy) return c;
  const msLeft = Math.max(0, c.msLeft - dt);
  return msLeft > 0 ? { ...c, msLeft } : NO_CHAIN;
}
