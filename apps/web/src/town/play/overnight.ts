import { resolveBuilds, type BuildingDef } from '../build/build';
import type { TownState } from '../state';

/**
 * While Puff sleeps (or dozes off; the same either way, nothing lost): Fluff refills, watered crops
 * grow a day, builds move on. Returns the names of buildings finished by morning.
 */
export function overnight(state: TownState, buildings: BuildingDef[], endedDay: number, dozed: boolean) {
  if (dozed) state.fluff.doze(); else state.fluff.sleep();
  for (const c of state.crops) { if (c.watered) c.days += 1; c.watered = false; }
  return resolveBuilds(state.plots, buildings, endedDay).map((id) => buildings.find((b) => b.id === state.plots[id].buildingId)?.name ?? '');
}
