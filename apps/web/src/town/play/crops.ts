import { cropDays, TUNING } from '../data/tuning';
import type { Crop } from '../state';

// Crops (VISION §7, big farming): plant seeds in soil, water once a day, and they grow overnight.
// Each kind is pack data (its seed and how it looks); days to grow live in tuning. Some, like
// strawberries, grow back after picking. Each grows in its seasons; out of season it rests (never
// lost), and under a greenhouse anything grows any time.

/** `look`: how it's drawn (round root, long root, pods, berries, a tall stalk, a big pumpkin, leaves). `seasons`: when it grows (default spring). `areas`: only planted there (watercress wants the wet riverbank). */
export interface CropDef { id: string; seed: string; look: 'round' | 'long' | 'pod' | 'berry' | 'stalk' | 'pumpkin' | 'leaf'; seasons?: string[]; areas?: string[] }

/** Whether it grows in this season, or anyway, under glass. */
export const grows = (def: CropDef, season: string, glass: boolean) => glass || (def.seasons ?? ['Spring']).includes(season);

/** 0 seed, 1 sprout, 2 ready to pick. */
export function stageOf(c: Crop) {
  return c.days >= cropDays(c.crop) ? 2 : c.days > 0 ? 1 : 0;
}

/** Days a crop takes to grow back after picking, if it does. */
const regrowDays = (crop: string) => TUNING.cropRegrowDays?.[crop];

/** Pick it: `picked` (it's gone), `regrows` (back to a sprout), or `growing` (not ready, nothing happens). */
export function harvest(c: Crop, def: CropDef): 'picked' | 'regrows' | 'growing' {
  if (stageOf(c) < 2) return 'growing';
  const back = regrowDays(def.id);
  if (!back) return 'picked';
  c.days = cropDays(c.crop) - back;
  return 'regrows';
}

/** The kinds of seed Puff is carrying that would grow here now (`area`: where Puff is; leave it out for anywhere). */
export function seedsIn(bag: { count(id: string): number }, crops: CropDef[], season: string, glass: boolean, area?: string) {
  return crops.filter((c) => bag.count(c.seed) > 0 && grows(c, season, glass) && (!area || !c.areas || c.areas.includes(area)));
}
