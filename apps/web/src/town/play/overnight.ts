import { DONE, resolveBuilds, type BuildingDef, type PlotDef } from '../build/build';
import type { TownState } from '../state';

/**
 * While Puff sleeps (or dozes off; the same either way, nothing lost): Fluff refills, watered crops
 * grow a day (in an area with a finished greenhouse, every crop counts as watered), builds move
 * on. Returns the names of buildings finished by morning.
 */
export function overnight(state: TownState, pack: { buildings: BuildingDef[]; plots: PlotDef[] }, endedDay: number, dozed: boolean) {
  if (dozed) state.fluff.doze(); else state.fluff.sleep();
  const sprinkled = new Set(Object.entries(state.plots)
    .filter(([, p]) => p.stage >= DONE && pack.buildings.find((b) => b.id === p.buildingId)?.effect === 'waters_garden')
    .map(([id]) => pack.plots.find((d) => d.id === id)?.area));
  for (const c of state.crops) { if (c.watered || sprinkled.has(c.area)) c.days += 1; c.watered = false; }
  return resolveBuilds(state.plots, pack.buildings, endedDay).map((id) => pack.buildings.find((b) => b.id === state.plots[id].buildingId)?.name ?? '');
}
