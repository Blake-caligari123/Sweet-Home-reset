import { TUNING } from '../data/tuning';
import { DONE } from '../build/build';
import { heartsOf } from '../neighbours/talk';
import type { TownState } from '../state';

// Town Bloom (VISION §5): how the town is thriving, as a level that only rises. Restored places,
// things built, friendship, Grumble helpers and town jobs all count. And surprise finds (VISION §7): every
// few cleans in a place turns up a little treasure for Moss's collection. Free, fixed, no chance.

export interface BloomCounts { restored: number; builds: number; hearts: number; helpers: number; townJobs: number }

/** Points toward Town Bloom: a restore counts most, then a build, then each heart, helper and town job. */
export function bloomPoints(c: BloomCounts) {
  return c.restored * 3 + c.builds * 2 + c.hearts + c.helpers + c.townJobs;
}

/** The level (1 up) these points reach, by the thresholds in tuning. */
export function bloomLevel(points: number) {
  return Math.max(1, TUNING.bloomLevels.filter((t) => points >= t).length);
}

/** The town's Bloom right now, from Puff's progress and how many places are restored. */
function townBloom(s: TownState, restored: number) {
  return bloomLevel(bloomPoints({
    restored,
    builds: Object.values(s.plots).filter((p) => p.stage >= DONE).length,
    hearts: Object.values(s.friends).reduce((n, f) => n + heartsOf(f.points), 0),
    helpers: s.grumbles.list.filter((g) => g.state === 'helper').length,
    townJobs: s.townJobs
  }));
}

/** The new level if Town Bloom has just gone up (it never goes down), else null. */
export function bloomUp(s: TownState, restored: number) {
  const now = townBloom(s, restored);
  if (now <= s.bloom) return null;
  s.bloom = now;
  return now;
}

/** A little treasure that turns up while tidying in these places. */
export interface FindDef { id: string; name: string; areas: string[] }

/** Cleans counted per place, and what's been found (for the collection). */
export interface Finds { cleans: Record<string, number>; found: string[] }

/** A clean in an area: every `every`th turns up that place's next unfound treasure (or nothing). */
export function nextFind(s: Finds, area: string, finds: FindDef[], every: number) {
  s.cleans[area] = (s.cleans[area] ?? 0) + 1;
  if (s.cleans[area] % every) return null;
  const f = finds.find((x) => x.areas.includes(area) && !s.found.includes(x.id));
  if (!f) return null;
  s.found.push(f.id);
  return f.id;
}
