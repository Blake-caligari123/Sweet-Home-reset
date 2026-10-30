// What the townsfolk remember Puff did (NEXT-PHASE §5.3), so they bring it up later. A memory is
// someone's own (`who`: a neighbour id) or the whole town's (`who: 'town'`: a place restored,
// something built or mended). Each is kept once, newest first, for two weeks.

export interface Memory { what: string; who: string; day: number }

/** How long a memory stays fresh enough to mention, in days. */
const FRESH_DAYS = 14;
const MAX = 60;

export function remember(list: Memory[], m: Memory): Memory[] {
  return [m, ...list.filter((x) => !(x.what === m.what && x.who === m.who))].slice(0, MAX);
}

/** What this neighbour remembers today: their own memories and the town's, newest first. */
export function recalls(list: Memory[], who: string, day: number): string[] {
  return list.filter((m) => (m.who === who || m.who === 'town') && day - m.day <= FRESH_DAYS).map((m) => m.what);
}
