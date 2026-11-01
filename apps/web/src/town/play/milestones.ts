import { TUNING } from '../data/tuning';
import type { TownState } from '../state';

// Tidying milestones (polish: little bursts of pride). Every spot Puff has ever tidied counts;
// passing 50, 100, 250… is a cheer and some Sparkles, once each. It only ever goes up.

/** Every spot tidied, all told (each place's clean count). */
export const totalTidied = (state: Pick<TownState, 'finds'>) => Object.values(state.finds.cleans).reduce((n, c) => n + c, 0);

export const milestoneFlag = (n: number) => `tidied_${n}`;

/** Sparkles for a milestone: a fifth of the count. */
export const milestoneSparkles = (n: number) => Math.round(n / 5);

/** The milestone just reached and not yet cheered, if any. */
export const milestoneReached = (total: number, has: (flag: string) => boolean) =>
  [...TUNING.tidyMilestones].reverse().find((m) => total >= m && !has(milestoneFlag(m))) ?? null;
