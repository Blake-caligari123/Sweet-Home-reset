import type { TownState } from '../state';

// Outfits (VISION §4): little things Puff wears, earned by playing, never bought. One at a time.

/** How it's earned: a story flag, a Town Bloom level, or a number of finds (any that are set). */
export interface OutfitDef { id: string; name: string; hint: string; earn: { flag?: string; bloom?: number; finds?: number } }

/** Outfits earned since last asked (each told about once; remembered with a flag). */
export function newlyEarned(s: TownState, all: OutfitDef[]) {
  const fresh = all.filter((o) => earned(s, o) && !s.has(`outfit_${o.id}`));
  for (const o of fresh) s.flag(`outfit_${o.id}`);
  return fresh;
}

export function earned(s: TownState, o: OutfitDef) {
  const e = o.earn;
  return (!e.flag || s.has(e.flag)) && (!e.bloom || s.bloom >= e.bloom) && (!e.finds || s.finds.found.length >= e.finds);
}
