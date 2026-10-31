import { seeded } from '../../shared/art/pixel-canvas';
import type { Pt } from '../world/nav';

// Critters (NEXT-PHASE §5.9: critters in those places). Little creatures about town by place,
// season, time of day and weather. Puff spots them (a tap) for the Critter journal; nothing is
// caught or kept, and a spotted critter just flutters off. Where they sit follows the day.

export type CritterKind = 'beetle' | 'bee' | 'butterfly' | 'snail' | 'frog' | 'firefly' | 'bird' | 'dragonfly' | 'duck' | 'kingfisher';

export interface CritterDef {
  id: string; name: string; kind: CritterKind; colour?: string;
  areas: string[]; seasons?: string[]; time?: 'day' | 'night'; rain?: boolean;
  /** Where and when to look, for the journal's "?". */
  hint: string;
}

const night = (minutes: number) => minutes >= 19 * 60 || minutes < 6 * 60;

/** Who could be about here, now. */
export function crittersHere(defs: CritterDef[], area: string, season: string, minutes: number, rainy: boolean) {
  return defs.filter((c) => c.areas.includes(area) && (!c.seasons || c.seasons.includes(season))
    && (!c.time || (c.time === 'night') === night(minutes)) && (!c.rain || rainy));
}

/** Up to `max` of them, each on one of the open spots, picked by the day (the same all day). */
export function placeCritters(here: CritterDef[], day: number, area: string, spots: Pt[], max: number) {
  const rand = seeded(day * 977 + area.length * 131 + area.charCodeAt(0));
  const pool = [...here]; const free = [...spots];
  const out: { def: CritterDef; at: Pt }[] = [];
  while (out.length < max && pool.length && free.length) {
    const def = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    out.push({ def, at: free.splice(Math.floor(rand() * free.length), 1)[0] });
  }
  return out;
}
