import { seeded } from '../../shared/art/pixel-canvas';
import type { Area, AreaPack } from '../data/area';
import { TUNING } from '../data/tuning';
import { DAYS_PER_SEASON, seasonOf } from '../play/clock';
import type { AreaMess, MessSpot } from '../play/mess';

// Festivals (VISION §7): the last day of each season is a festival, with everyone gathered and a
// mini-game. The Spring Clean Fair's is the tidy dash: a burst of light mess in the square to tidy
// before the timer runs out. Summer's picnic is crumbs, autumn's leaf fest is leaf piles. Winter
// Lights is calm, with no timer: lanterns stand round the square, and lighting them all ends the year's chapter. A fun score, never a fail: every spot tidied is Sparkles, and the
// first go each fair day earns its prize (a ribbon). Replays are just for fun.

export interface FestivalDef {
  id: string; name: string; season: string; area: string;
  /** The tidy dash: how long (real seconds), how many spots, Sparkles per spot tidied. */
  seconds: number; spots: number; perSpot: number;
  /** What pops up for the dash (picnic crumbs, autumn leaves), in turn. */
  mess: MessSpot['type'][];
  /** An outfit earned by joining in (earned with the flag `festival_<id>`). */
  outfit?: string;
  /** The tidy dash (default), or lighting lanterns. */
  game?: 'dash' | 'lights';
  /** For lights: where the lanterns stand. */
  lanterns?: { x: number; y: number }[];
}

/** Today's festival, if today is one: the last day of a season with a festival. */
export function festivalToday(defs: FestivalDef[], day: number) {
  if (((day - 1) % DAYS_PER_SEASON) + 1 !== DAYS_PER_SEASON) return null;
  return defs.find((f) => f.season === seasonOf(day)) ?? null;
}

/** On any other day, the stall offers a practice dash (VISION §7: the timed tidy mini-game): a fun score, no prize. */
export function practiceDash(area: string): FestivalDef {
  const t = TUNING.practiceDash;
  return { id: 'practice', name: 'Tidy dash', season: '', area, seconds: t.seconds, spots: t.spots, perSpot: 0, mess: ['dust', 'weeds', 'crumbs'] };
}

/** How the dash went: Sparkles for every spot, and a cheer (every score gets one). */
export function dashResult(def: FestivalDef, cleaned: number) {
  const cheer = cleaned >= def.spots ? 'all' : cleaned * 2 >= def.spots ? 'lots' : 'some';
  return { sparkles: cleaned * def.perSpot, cheer: `festival.cheer.${cheer}` };
}

/** Where the dash mess goes: open, empty floor away from doors, fixed for the day; its kinds in turn. */
export function dashSpots(area: Area, m: AreaMess, day: number, n: number, kinds: MessSpot['type'][]): MessSpot[] {
  const r = seeded(day * 977 + 7);
  const out: MessSpot[] = [];
  for (let tries = 0; tries < 400 && out.length < n; tries += 1) {
    const x = Math.floor(r() * area.w); const y = Math.floor(r() * area.h);
    if (!area.walkable(x, y) || area.doorAt(x, y) || m.typeAt(x, y) !== 'none' || out.some((s) => s.x === x && s.y === y)) continue;
    out.push({ type: kinds[out.length % kinds.length], x, y });
  }
  return out;
}

/** Set once Puff lights this lantern on this festival day. */
export const litFlag = (def: FestivalDef, day: number, x: number, y: number) => `lit_${def.id}_${day}_${x}_${y}`;

/** The lanterns still to light today. */
export const lanternsLeft = (def: FestivalDef, flags: readonly string[], day: number) => (def.lanterns ?? []).filter((l) => !flags.includes(litFlag(def, day, l.x, l.y)));

/** An area with today's festival lanterns standing in it, lit or waiting to be lit. */
export function withLanterns(pack: AreaPack, def: FestivalDef | null, flags: readonly string[], day: number): AreaPack {
  if (def?.game !== 'lights' || pack.id !== def.area) return pack;
  const lanterns = (def.lanterns ?? []).map((l) => (flags.includes(litFlag(def, day, l.x, l.y)) ? { type: 'festival_lantern_lit', x: l.x, y: l.y } : { type: 'festival_lantern', x: l.x, y: l.y, action: 'light' }));
  return { ...pack, props: [...pack.props, ...lanterns] };
}
