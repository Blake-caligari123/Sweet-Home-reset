// Fishing (NEXT-PHASE §5.9: fishing in those places). With a rod, Puff casts at the ripples by
// the water, waits for a bite and taps in time. What bites depends on the place, the season and
// whether it's day or night. Which fish it is follows the day and the count, never a lottery;
// a fish that gets away is simply cast for again.

/** A fish: where it swims, and when (seasons; day or night). */
/** `bait`: a rarer fish that only bites when Puff fishes with bait. */
export interface FishDef { id: string; areas: string[]; seasons?: string[]; time?: 'day' | 'night'; bait?: boolean }

const isNightTime = (minutes: number) => minutes >= 19 * 60 || minutes < 6 * 60;

/** What could bite here, now. */
export function fishHere(fish: FishDef[], area: string, season: string, minutes: number, bait = false) {
  const night = isNightTime(minutes);
  return fish.filter((f) => f.areas.includes(area) && (!f.seasons || f.seasons.includes(season)) && (!f.time || (f.time === 'night') === night) && (bait || !f.bait));
}

/** The one that bites on this cast: the day and how many Puff has caught pick it. With bait, every other catch is a rare one, if one swims here. */
export function whichFish(here: FishDef[], day: number, caught: number, bait = false) {
  const rare = here.filter((f) => f.bait);
  if (bait && rare.length && caught % 2 === 0) return rare[(day + caught) % rare.length];
  const common = here.filter((f) => !f.bait);
  return common.length ? common[(day * 13 + caught * 7) % common.length] : rare[0] ?? null;
}

/** A tap on Reel in: too soon (before the bite), in time, or too late (it swam off). */
export function reel(biteAt: number, tapAt: number, windowMs: number): 'early' | 'caught' | 'late' {
  if (tapAt < biteAt) return 'early';
  return tapAt - biteAt <= windowMs ? 'caught' : 'late';
}
