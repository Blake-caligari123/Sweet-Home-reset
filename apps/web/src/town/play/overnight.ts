import { areasWith, resolveBuilds, type BuildingDef, type PlotDef } from '../build/build';
import { seasonOf } from './clock';
import { grows, type CropDef } from './crops';
import type { TownState } from '../state';
import { regrow } from '../caves/caves';

/**
 * While Puff sleeps (or dozes off; the same either way, nothing lost): Fluff refills, watered crops
 * grow a day in their season (in an area with a finished greenhouse, every crop counts as watered
 * and grows any time; out of season one just rests), cave rocks
 * come back once their week is up, builds move on (a finished cottage means its newcomer moves in).
 * If tomorrow is rainy, every outdoor crop starts it watered. Returns the buildings finished by morning.
 */
export function overnight(state: TownState, pack: { buildings: BuildingDef[]; plots: PlotDef[]; outdoor?: Set<string>; crops?: CropDef[] }, endedDay: number, dozed: boolean, rainTomorrow = false) {
  if (dozed) state.fluff.doze(); else state.fluff.sleep();
  const glass = areasWith('waters_garden', state.plots, pack.plots, pack.buildings);
  const season = seasonOf(endedDay);
  for (const c of state.crops) {
    const def = pack.crops?.find((d) => d.id === c.crop);
    if ((c.watered || glass.has(c.area)) && (!def || grows(def, season, glass.has(c.area)))) c.days += 1;
    c.watered = rainTomorrow && !!pack.outdoor?.has(c.area);
  }
  regrow(state.caves, endedDay + 1);
  const finished = resolveBuilds(state.plots, pack.buildings, endedDay).flatMap((id) => pack.buildings.filter((b) => b.id === state.plots[id].buildingId));
  for (const b of finished) if (b.effect === 'home' && b.home) state.flag(`home_${b.home}`);
  return finished;
}
