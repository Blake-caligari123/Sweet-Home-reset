import { seeded } from '../../shared/art/pixel-canvas';
import type { Area } from '../data/area';
import { DAYS_PER_SEASON, seasonOf } from '../play/clock';
import type { AreaMess, MessSpot } from '../play/mess';

// Festivals (VISION §7): the last day of each season is a festival, with everyone gathered and a
// mini-game. The Spring Clean Fair's is the tidy dash: a burst of light mess in the square to tidy
// before the timer runs out. A fun score, never a fail: every spot tidied is Sparkles, and the
// first go each fair day earns its prize (a ribbon). Replays are just for fun.

export interface FestivalDef {
  id: string; name: string; season: string; area: string;
  /** The tidy dash: how long (real seconds), how many spots, Sparkles per spot tidied. */
  seconds: number; spots: number; perSpot: number;
  /** An outfit earned by joining in (earned with the flag `festival_<id>`). */
  outfit?: string;
}

/** Today's festival, if today is one: the last day of a season with a festival. */
export function festivalToday(defs: FestivalDef[], day: number) {
  if (((day - 1) % DAYS_PER_SEASON) + 1 !== DAYS_PER_SEASON) return null;
  return defs.find((f) => f.season === seasonOf(day)) ?? null;
}

/** How the dash went: Sparkles for every spot, and a cheer (every score gets one). */
export function dashResult(def: FestivalDef, cleaned: number) {
  const cheer = cleaned >= def.spots ? 'all' : cleaned * 2 >= def.spots ? 'lots' : 'some';
  return { sparkles: cleaned * def.perSpot, cheer: `festival.cheer.${cheer}` };
}

const DASH_MESS: MessSpot['type'][] = ['weeds', 'dust', 'crumbs'];

/** Where the dash mess goes: open, empty floor away from doors, fixed for the day. */
export function dashSpots(area: Area, m: AreaMess, day: number, n: number): MessSpot[] {
  const r = seeded(day * 977 + 7);
  const out: MessSpot[] = [];
  for (let tries = 0; tries < 400 && out.length < n; tries += 1) {
    const x = Math.floor(r() * area.w); const y = Math.floor(r() * area.h);
    if (!area.walkable(x, y) || area.doorAt(x, y) || m.typeAt(x, y) !== 'none' || out.some((s) => s.x === x && s.y === y)) continue;
    out.push({ type: DASH_MESS[out.length % DASH_MESS.length], x, y });
  }
  return out;
}
