import type { AreaPack } from '../data/area';
import { TUNING } from '../data/tuning';

// Town map travel (NEXT-PHASE §9: getting around was the least favourite part). Puff can hop to
// any place they've already been. It still takes game time, as walking would: a few minutes for
// each door (or hatch) between here and there, along the shortest way.

type Areas = Pick<AreaPack, 'id' | 'name' | 'kind' | 'doors' | 'props'>[];

/** Where a place leads: its doors, plus hatches and ladders (props with a `to`). */
const linksOf = (a: Areas[number]) => [...a.doors.map((d) => d.to), ...a.props.flatMap((p) => ('to' in p && typeof p.to === 'string' ? [p.to] : []))];

/** Doors passed on the shortest way between two places, or null if there's no way. */
export function hopsBetween(areas: Areas, from: string, to: string) {
  const seen = new Map([[from, 0]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === to) return seen.get(id)!;
    const area = areas.find((a) => a.id === id);
    for (const next of area ? linksOf(area) : []) {
      if (!seen.has(next)) { seen.set(next, seen.get(id)! + 1); queue.push(next); }
    }
  }
  return null;
}

const GROUPS = { outdoor: 'Outdoors', home: 'Homes', cave: 'Caves' } as const;

export interface TravelPlace { id: string; name: string; group: (typeof GROUPS)[keyof typeof GROUPS]; minutes: number; here: boolean }

/** The places on the map: those visited, outdoors first, then homes, then caves, each with its trip time. */
export function travelPlaces(areas: Areas, visited: string[], here: string): TravelPlace[] {
  const order = Object.keys(GROUPS);
  return areas
    .filter((a) => visited.includes(a.id))
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map((a) => ({ id: a.id, name: a.name, group: GROUPS[a.kind], minutes: (hopsBetween(areas, here, a.id) ?? 0) * TUNING.mapTravelMinutesPerHop, here: a.id === here }));
}
