import type { BuildingDef } from '../build/build';
import type { Content } from '../data/content';
import type { GrumbleLife } from '../grumbles/grumble-life';
import type { Jobs } from '../requests/jobs';
import type { TownState } from '../state';
import { newJobsLine } from '../ui/a11y';
import type { View } from '../ui/view';
import type { TownAreas } from '../world/town-areas';
import type { Clock } from './clock';
import { morningLetter } from './letter';
import { overnight } from './overnight';
import { morningNews } from './weather';
import { offerTonight, restNight, restsTonight } from '../unlock/unlock';

/** What the night touches. */
export interface NightHost { state: TownState; clock: Clock; content: Content; jobs: Jobs; places: TownAreas; grumbles: GrumbleLife;
  /** Whether this build sells the unlock (no store, no gate: the test link plays the whole year). */
  gate: boolean }

/**
 * The night itself, behind the fade: the next day starts, the board posts, overnight runs (rain
 * tomorrow waters the garden), places are rebuilt, a little mess drifts back, Grumbles gather.
 * Returns the buildings finished by morning.
 */
export function passNight(h: NightHost, dozed: boolean): { built: BuildingDef[]; rested: boolean } {
  const { state, clock, content: { pack } } = h;
  // At the end of the free spring without the unlock, the night passes but the calendar waits.
  const rested = restsTonight(clock.state.day, { owned: state.unlock.owned, gate: h.gate });
  if (rested) { clock.restDay(); restNight(state); state.restNights += 1; } else clock.nextDay();
  h.jobs.post();
  const rainy = clock.weather === 'rainy';
  const outdoor = new Set(pack.areas.filter((a) => a.kind === 'outdoor').map((a) => a.id));
  const built = overnight(state, { buildings: pack.buildings ?? [], plots: pack.plots ?? [], outdoor, crops: pack.crops }, clock.state.day - 1, dozed, rainy);
  h.places.rebuild(state);
  h.places.driftBack(clock.state.day, rainy);
  h.grumbles.newDay(clock.state.day);
  return { built, rested };
}

/** Awake: the morning letter, then a new season or rain, then what was built overnight; the unlock postcard on top when it's due. */
export function morning(h: { state: TownState; view: View; clock: Clock; content: Content; refreshHud(): void; offer(): void }, night: { built: BuildingDef[]; rested: boolean }) {
  const { built } = night;
  const { view, content } = h;
  morningLetter(h);
  for (const [kind, id] of morningNews(h.clock)) (kind === 'banner' ? view.banner : view.say).call(view, content.line(id) ?? '');
  // Unaccepted jobs come down each night, so every one up now is new today.
  view.hud.announce(newJobsLine(h.state.requests.list.filter((r) => !r.accepted).length));
  for (const b of built) view.banner(b.home ? content.line(`home.${b.home}`) ?? '' : (content.line('build.done') ?? '').replace('{building}', b.name.toLowerCase()));
  if (night.rested && offerTonight(h.state.restNights)) h.offer();
}
