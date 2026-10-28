import { TUNING, type UnlockRule } from './data/tuning';

/** What an unlock looks at: the day and the story so far. Never a purchase (NEW-FEATURES §0). */
export interface Progress { day: number; flags: readonly string[] }

/**
 * Whether something in the year-one schedule has arrived yet: on or after its day, once its story
 * flag is set. Anything without a rule is there from the start.
 */
export function isUnlocked(key: string, p: Progress, rules: Record<string, UnlockRule> = TUNING.unlocks) {
  const r = rules[key];
  if (!r) return true;
  return p.day >= (r.day ?? 1) && (!r.flag || p.flags.includes(r.flag));
}
