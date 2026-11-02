// Stargazing (a chill side activity, 2 Nov): through the telescope from the Wandering Cart, after
// dark, one constellation is up each night. Tap its bright stars (in any order) and the lines
// join up and its name appears. Each new one goes in the star book. Pure rules; star-sheet.ts draws it.

export interface Constellation {
  id: string; name: string;
  /** Stars on a 20 × 14 sky, and the lines between them (by index). */
  stars: [number, number][]; lines: [number, number][];
  /** When it's up: these seasons (all, if none). */
  seasons?: string[];
}

export const CONSTELLATIONS: Constellation[] = [
  { id: 'teapot', name: 'The Teapot', stars: [[5, 6], [9, 5], [13, 6], [13, 10], [5, 10], [16, 7], [2, 8]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5], [0, 6]] },
  { id: 'broom', name: 'The Big Broom', stars: [[3, 2], [6, 4], [9, 6], [12, 8], [11, 11], [14, 12], [16, 10]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6]] },
  { id: 'ears', name: 'Puff\'s Ears', stars: [[6, 2], [7, 7], [12, 2], [11, 7], [9, 10], [6, 11], [12, 11]], lines: [[0, 1], [2, 3], [1, 4], [3, 4], [4, 5], [4, 6]], seasons: ['Spring', 'Summer'] },
  { id: 'acorn', name: 'The Acorn', stars: [[6, 4], [12, 4], [9, 2], [6, 8], [12, 8], [9, 12]], lines: [[0, 2], [2, 1], [0, 3], [1, 4], [3, 5], [4, 5], [0, 1]], seasons: ['Autumn', 'Winter'] },
  { id: 'owl', name: 'The Sleepy Owl', stars: [[6, 3], [12, 3], [7, 6], [11, 6], [9, 8], [6, 11], [12, 11]], lines: [[0, 2], [1, 3], [2, 4], [3, 4], [2, 5], [3, 6], [5, 6]] },
  { id: 'lantern', name: 'The Lantern', stars: [[9, 1], [7, 4], [11, 4], [6, 9], [12, 9], [8, 12], [10, 12]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6]], seasons: ['Autumn', 'Winter'] },
  { id: 'boat', name: 'The Little Boat', stars: [[3, 8], [15, 8], [5, 11], [13, 11], [9, 2], [9, 8], [12, 5]], lines: [[0, 1], [0, 2], [1, 3], [2, 3], [4, 5], [4, 6], [6, 5]], seasons: ['Summer', 'Autumn'] },
  { id: 'kite', name: 'Pip\'s Kite', stars: [[9, 1], [5, 5], [13, 5], [9, 9], [10, 11], [8, 13]], lines: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], seasons: ['Spring', 'Summer'] }
];

/** After dark (8 pm to 5 am, game minutes). */
export const isNight = (minutes: number) => minutes >= 20 * 60 || minutes < 5 * 60;

/** Tonight's constellation: one that's up this season, a new one first if there is one, the same all night. */
export function tonight(day: number, season: string, seen: string[]): Constellation {
  const up = CONSTELLATIONS.filter((c) => !c.seasons || c.seasons.includes(season));
  const fresh = up.filter((c) => !seen.includes(c.id));
  const pool = fresh.length ? fresh : up;
  return pool[day % pool.length];
}

/** A tap on a star: which ones are found now, and whether that was the last. */
export function tapStar(found: number[], i: number, c: Constellation): { found: number[]; done: boolean } {
  const next = found.includes(i) ? found : [...found, i];
  return { found: next, done: next.length === c.stars.length };
}

/** The lines to draw so far: those whose two stars are both found. */
export const linesShown = (c: Constellation, found: number[]) => c.lines.filter(([a, b]) => found.includes(a) && found.includes(b));
