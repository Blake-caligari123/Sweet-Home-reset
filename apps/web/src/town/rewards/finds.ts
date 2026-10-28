import { seeded } from '../../shared/art/pixel-canvas';
import { TUNING } from '../data/tuning';

// Hidden finds: now and then a cleaned spot turns up a little treasure for the bag and the Finds
// book. It's free and earned in play, never bought. Seeded by day, area and tile, so a replay finds
// the same thing, and never more than `findPity` cleans apart.
export interface FindDef {
  item: string;
  /** How likely, against the others that can turn up here. */
  weight: number;
  /** Only in these areas (shells by the river); anywhere when absent. */
  areas?: string[];
}

export interface FindContext { day: number; area: string; x: number; y: number; sinceFind: number }

const nameSeed = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

/** The find this clean turns up, or null. */
export function rollFind(defs: FindDef[], c: FindContext): string | null {
  const rand = seeded(nameSeed(`${c.day}:${c.area}:${c.x}:${c.y}`));
  if (c.sinceFind + 1 < TUNING.rewards.findPity && rand() >= TUNING.rewards.findChance) return null;
  const here = defs.filter((d) => !d.areas || d.areas.includes(c.area));
  let pick = rand() * here.reduce((sum, d) => sum + d.weight, 0);
  for (const d of here) { pick -= d.weight; if (pick < 0) return d.item; }
  return here[here.length - 1]?.item ?? null;
}
