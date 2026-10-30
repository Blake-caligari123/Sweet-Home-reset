import { TUNING } from '../data/tuning';
import { DONE, type PlotState } from '../build/build';
import type { CaveState } from '../caves/caves';

// The free first spring and one unlock (VISION §10, BACKEND-PLAN "Lapse"). Spring is free. After it,
// a player without the unlock rests at the end of spring: nights still pass (crops grow, builds
// finish, rocks come back) but the calendar waits, and nothing is ever taken away. The gate only
// applies in a build with a store set up, so the test link plays the whole year.

/** Whether tonight is a rest night: the calendar stays on the last free day instead of moving on. */
export function restsTonight(day: number, o: { owned: boolean; gate: boolean }) {
  return o.gate && !o.owned && day >= TUNING.freeDays;
}

/** The postcard shows on the first rest night, then once every `unlockOfferRepeatNights` after. */
export function offerTonight(restNights: number) {
  return restNights >= 1 && (restNights - 1) % TUNING.unlockOfferRepeatNights === 0;
}

/**
 * A rest night keeps the day number, so anything counted in days is moved one day closer instead:
 * a build finishes after its nights and mined rocks come back after their week, as on any night.
 */
export function restNight(s: { plots: Record<string, PlotState>; caves: CaveState }) {
  for (const p of Object.values(s.plots)) if (p.stage < DONE) p.readyDay -= 1;
  if (s.caves.mined.length) s.caves.resetDay -= 1;
}
