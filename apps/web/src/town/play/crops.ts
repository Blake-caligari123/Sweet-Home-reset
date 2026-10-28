import { cropDays, TUNING } from '../data/tuning';
import type { Crop } from '../state';

// Crops (VISION §7, big farming): plant seeds in soil, water once a day, and they grow overnight.
// Each kind is pack data (its seed and how it looks); days to grow live in tuning. Some, like
// strawberries, grow back after picking.

/** `look`: how it's drawn (round root, long root, pods, berries). */
export interface CropDef { id: string; seed: string; look: 'round' | 'long' | 'pod' | 'berry' }

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

/** The kinds of seed Puff is carrying. */
export function seedsIn(bag: { count(id: string): number }, crops: CropDef[]) {
  return crops.filter((c) => bag.count(c.seed) > 0);
}
