import type { TownPack } from '../data/area';
import type { TownState } from '../state';

// Collection sets (polish: something to complete). Finds, critters, fish and crops each fill toward a
// whole set; finishing one is a big moment, once, with a stamp in the Collection and Sparkles.

export interface CollectionSet { id: 'finds' | 'critters' | 'fish' | 'harvest'; name: string; have: number; total: number }

/** Every set and how full it is. */
export function collectionSets(state: Pick<TownState, 'finds' | 'critters' | 'fishLog' | 'flags'>, pack: Pick<TownPack, 'finds' | 'critters' | 'fish' | 'crops'>): CollectionSet[] {
  const count = (ids: string[], have: string[]) => ids.filter((id) => have.includes(id)).length;
  const finds = (pack.finds ?? []).map((f) => f.id); const critters = (pack.critters ?? []).map((c) => c.id); const fish = (pack.fish ?? []).map((f) => f.id);
  return [
    { id: 'finds', name: 'Treasures', have: count(finds, state.finds.found), total: finds.length },
    { id: 'critters', name: 'Critter journal', have: count(critters, state.critters), total: critters.length },
    { id: 'fish', name: 'Fish log', have: count(fish, state.fishLog), total: fish.length },
    // Every kind of crop grown and picked at least once (the `grown_` flag a harvest leaves).
    { id: 'harvest', name: 'Harvest log', have: (pack.crops ?? []).filter((c) => state.flags.includes(`grown_${c.id}`)).length, total: (pack.crops ?? []).length }
  ];
}

/** The flag a finished set leaves, so it's only cheered once. */
export const setFlag = (id: CollectionSet['id']) => `set_${id}_done`;

/** Sets just finished: full, and not yet cheered. */
export const newlyComplete = (sets: CollectionSet[], has: (flag: string) => boolean) => sets.filter((s) => s.total > 0 && s.have >= s.total && !has(setFlag(s.id)));
