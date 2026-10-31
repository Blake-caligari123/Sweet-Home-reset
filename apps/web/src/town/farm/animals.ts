import type { AreaPack } from '../data/area';
import type { TownState } from '../state';

// Farm animals (VISION §5.6): a hen, a goat and a cow, bought at the General Store, move into the
// yard the next morning. A pat and some feed today means an egg, wool or milk tomorrow. Missing a
// day just means nothing to collect; nobody is ever upset, and nothing is left to chance.

/** An animal in the pack: what it gives and where it lives. */
export interface AnimalDef { id: string; name: string; gives: string; area: string; x: number; y: number; w?: number }

/** Each animal Puff has: the day it was last tended, and whether something waits to be collected. */
export type FarmState = Record<string, { tended: number; ready: boolean }>;

/** Bought animals are remembered by a flag (so the shop sells each once). */
export const animalFlag = (id: string) => `animal_${id}`;

export const ownedAnimals = (defs: AnimalDef[], flags: string[]) => defs.filter((a) => flags.includes(animalFlag(a.id)));

/** An area with its animals standing in it (tappable to tend). */
export function withAnimals(pack: AreaPack, defs: AnimalDef[], flags: string[]): AreaPack {
  const here = ownedAnimals(defs, flags).filter((a) => a.area === pack.id);
  if (!here.length) return pack;
  return { ...pack, props: [...pack.props, ...here.map((a) => ({ type: a.id, x: a.x, y: a.y, w: a.w, action: 'animal' }))] };
}

/** The morning: animals tended yesterday have something ready; new ones settle in. Returns the newcomers. */
export function farmMorning(farm: FarmState, owned: AnimalDef[], day: number): AnimalDef[] {
  const arrived: AnimalDef[] = [];
  for (const a of owned) {
    const care = farm[a.id];
    if (!care) { farm[a.id] = { tended: 0, ready: false }; arrived.push(a); continue; }
    if (care.tended === day - 1) care.ready = true;
  }
  return arrived;
}

/**
 * Tapping an animal: collect what's ready (if the bag has room), then a pat and feed for today.
 * `got` is what went in the bag, `full` that it's waiting for room, `tended` that today's care is new.
 */
export function tend(s: TownState, a: AnimalDef, day: number): { got: string | null; full: boolean; tended: boolean } {
  const care = s.farm[a.id] ?? (s.farm[a.id] = { tended: 0, ready: false });
  let got: string | null = null; let full = false;
  if (care.ready) {
    if (s.bag.canAdd(a.gives)) { s.bag.add(a.gives); care.ready = false; got = a.gives; } else full = true;
  }
  const tended = care.tended !== day;
  care.tended = day;
  return { got, full, tended };
}
