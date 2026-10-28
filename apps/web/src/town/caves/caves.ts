import type { AreaPack } from '../data/area';
import { TUNING } from '../data/tuning';

// The caves under the Glimmerwell (VISION §7, NEW-FEATURES F4): small handmade floors with rocks
// to mine. Each rock always gives the same thing (no chance). A broken rock stays broken for the
// week that began with the first rock broken; then every rock is back.

export interface RockDef { id: string; x: number; y: number; size: 'small' | 'medium' | 'large'; drop: Record<string, number> }

/** Rocks broken this week, and the day they all come back. */
export interface CaveState { mined: string[]; resetDay: number }

export function rocksStanding(rocks: RockDef[], c: CaveState) {
  return rocks.filter((r) => !c.mined.includes(r.id));
}

/** Break a rock on `day`: what it gives, or null if it's already broken. */
export function mineRock(c: CaveState, r: RockDef, day: number) {
  if (c.mined.includes(r.id)) return null;
  if (!c.mined.length) c.resetDay = day + TUNING.caves.resetDays;
  c.mined.push(r.id);
  return { ...r.drop };
}

/** Each morning: once the week is up, every rock is back. */
export function regrow(c: CaveState, day: number) {
  if (c.mined.length && day >= c.resetDay) c.mined = [];
}

/** A cave floor with its standing rocks as props Puff can mine. */
export function withRocks(pack: AreaPack, rocks: RockDef[], c: CaveState): AreaPack {
  const props = rocksStanding(rocks, c).map((r) => ({ type: `rock_${r.size}`, x: r.x, y: r.y, action: 'mine' }));
  return props.length ? { ...pack, props: [...pack.props, ...props] } : pack;
}
