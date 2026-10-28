import type { Clock } from '../play/clock';
import { DAY_END, DAY_START } from '../play/clock';
import type { ToolId } from '../play/mess';
import type { Puff } from '../play/puff';
import type { TownState } from '../state';
import type { Pt } from '../world/nav';
import type { TownAreas } from '../world/town-areas';
import type { TownSave } from './save';

/** The parts of the game a save loads into. */
export interface Restorable { clock: Clock; state: TownState; places: TownAreas; puff: Puff }

/**
 * Load a save into the game: the clock, Puff's progress, each area's mess and where Puff stands.
 * Returns the area to enter, the tool in Puff's paws and Puff's exact feet when the save has them.
 * Anything that doesn't fit this version of the town (a removed area, a blocked tile) falls back calmly.
 */
export function restoreGame(save: TownSave, g: Restorable): { area: string; selected?: ToolId; feet?: Pt } {
  g.clock.state = { day: save.day, minutes: Math.min(DAY_END, Math.max(DAY_START, save.minutes)) };
  g.state.load(save);
  for (const [id, snap] of Object.entries(save.areas ?? {})) {
    if (!g.places.has(id)) continue;
    try { g.places.mess(id).load(snap); } catch { /* a bad area snapshot just starts that area fresh */ }
  }
  const area = g.places.get(save.area) ? save.area : 'burrow';
  const a = g.places.get(area)!;
  const ok = a.walkable(save.puff.x, save.puff.y);
  g.puff.x = ok ? save.puff.x : a.pack.spawn.x; g.puff.y = ok ? save.puff.y : a.pack.spawn.y;
  g.puff.dir = save.puff.facing ?? 'down';
  const feet = ok && typeof save.puff.fx === 'number' && typeof save.puff.fy === 'number' ? { x: save.puff.fx, y: save.puff.fy } : undefined;
  return { area, selected: typeof save.selected === 'string' ? save.selected as ToolId : undefined, feet };
}
