import { TUNING } from '../data/tuning';
import type { TownState } from '../state';

// The tidy meter (polish, Blake: "tickle people's OCD and dopamine"): every place shows how tidy it
// is. Before it's restored, a bar fills toward 100% with a little ping at each quarter. After, it
// counts down the last few spots, and clearing the very last one makes the place spotless: a cheer
// and a few Sparkles, once per place per day. Mess drifting back overnight is just another chance;
// nothing is ever taken away. Pure rules here; tidy-meter-life.ts hooks them to play.

export interface MessLike { progress: number; restored: boolean; remaining: number; total: number }

export type Meter = { kind: 'none' } | { kind: 'progress'; pct: number } | { kind: 'left'; left: number } | { kind: 'spotless' };

/** What the meter shows for a place. Places with no mess (the caves) show nothing. */
export function meterOf(m: MessLike): Meter {
  if (m.total === 0 && m.remaining === 0) return { kind: 'none' };
  if (!m.restored) return { kind: 'progress', pct: Math.min(99, Math.floor((m.progress / TUNING.restoreThreshold) * 100)) };
  return m.remaining > 0 ? { kind: 'left', left: m.remaining } : { kind: 'spotless' };
}

/** The quarter mark just passed going from `before` to `after` per cent (25, 50 or 75), if any. */
export function quarterPassed(before: number, after: number): number | null {
  for (const q of [75, 50, 25]) if (before < q && after >= q) return q;
  return null;
}

/** Today's spotless places. */
export interface SpotlessState { day: number; areas: string[] }

/** Made spotless today, for the first time: the new state and whether to cheer. */
export function markSpotless(s: SpotlessState, area: string, day: number): { state: SpotlessState; first: boolean } {
  const areas = s.day === day ? s.areas : [];
  if (areas.includes(area)) return { state: { day, areas }, first: false };
  return { state: { day, areas: [...areas, area] }, first: true };
}

/** Sparkles for a spotless place. */
export const spotlessSparkles = () => TUNING.spotlessSparkles;

/** How many places are spotless today. */
export const spotlessToday = (state: Pick<TownState, 'spotless'>, day: number) => (state.spotless.day === day ? state.spotless.areas.length : 0);
