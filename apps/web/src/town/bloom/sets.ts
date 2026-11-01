import type { TownPack } from '../data/area';
import type { TownState } from '../state';

// Collection sets (polish: something to complete). Finds, critters and fish each fill toward a
// whole set; finishing one is a big moment, once, with a stamp in the Collection and Sparkles.

export interface CollectionSet { id: 'finds' | 'critters' | 'fish'; name: string; have: number; total: number }

/** Every set and how full it is. */
export function collectionSets(state: Pick<TownState, 'finds' | 'critters' | 'fishLog'>, pack: Pick<TownPack, 'finds' | 'critters' | 'fish'>): CollectionSet[] {
  const count = (ids: string[], have: string[]) => ids.filter((id) => have.includes(id)).length;
  const finds = (pack.finds ?? []).map((f) => f.id); const critters = (pack.critters ?? []).map((c) => c.id); const fish = (pack.fish ?? []).map((f) => f.id);
  return [
    { id: 'finds', name: 'Treasures', have: count(finds, state.finds.found), total: finds.length },
    { id: 'critters', name: 'Critter journal', have: count(critters, state.critters), total: critters.length },
    { id: 'fish', name: 'Fish log', have: count(fish, state.fishLog), total: fish.length }
  ];
}

/** The flag a finished set leaves, so it's only cheered once. */
export const setFlag = (id: CollectionSet['id']) => `set_${id}_done`;

/** Sets just finished: full, and not yet cheered. */
export const newlyComplete = (sets: CollectionSet[], has: (flag: string) => boolean) => sets.filter((s) => s.total > 0 && s.have >= s.total && !has(setFlag(s.id)));
