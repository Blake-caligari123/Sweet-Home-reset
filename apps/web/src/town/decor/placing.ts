import type { Content } from '../data/content';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { TownAreas } from '../world/town-areas';
import type { Tile } from '../world/pathfind';
import type { World } from '../world/world';
import { canPlace } from './decor';

export interface PlacingHost {
  state: TownState; view: View; content: Content; places: TownAreas; world: World;
  area(): string;
  /** The area changed: show it again as it now stands. */
  refreshArea(): void;
  refreshHud(): void;
  save(): void;
}

/** Placing decor: pick a piece in the bag, tap where it goes (again and again while there are more), stop any time. */
export class Placing {
  private item: string | null = null;

  constructor(private host: PlacingHost) {}

  get active() { return !!this.item; }

  /** Decor goes outside on the code-drawn town, and in places made for it (the burrow, over its painting). */
  canHere() { const a = this.host.places.get(this.host.area())?.pack; return !!a && (a.decorate || (a.kind === 'outdoor' && !a.background)); }

  start(item: string) {
    const { view, content } = this.host;
    if (!this.canHere()) { view.say(content.line('decor.outside') ?? ''); return; }
    this.item = item;
    view.say(content.line('decor.where') ?? '');
  }

  stop() { if (this.item) { this.item = null; this.host.view.say(this.host.content.line('decor.done') ?? ''); } }

  /** A tap while placing: put the piece there, pick up a path tile already there, or say why not. */
  tap(t: Tile) {
    const { state, view, content, places } = this.host;
    const id = this.host.area();
    const area = places.get(id); const item = this.item;
    if (!area || !item) return;
    const plots = (content.pack.plots ?? []).filter((p) => p.area === id);
    const here = state.decor.find((d) => d.area === id && d.x === t.x && d.y === t.y);
    if (here && here.item === item) { this.pickUp(t.x, t.y); return; }
    const result = canPlace(places.withoutDecor(id), state.decor, content.pack.items, { x: t.x, y: t.y, item }, plots);
    if (result !== 'ok') { view.say(content.line(`decor.${result}`) ?? ''); return; }
    state.bag.remove(item);
    state.decor.push({ area: id, x: t.x, y: t.y, item });
    this.changed(t, 'thunk');
    if (!state.bag.count(item)) this.stop();
  }

  /** Back into the bag (tapping a placed piece, or a path tile while placing paths). */
  pickUp(x: number, y: number) {
    const { state, view, content } = this.host;
    const id = this.host.area();
    const i = state.decor.findIndex((d) => d.area === id && d.x === x && d.y === y);
    if (i < 0) return;
    if (!state.bag.canAdd(state.decor[i].item)) { view.say('Bag\'s full!'); return; }
    state.bag.add(state.decor[i].item);
    state.decor.splice(i, 1);
    this.changed({ x, y }, 'pop');
    view.say(content.line('decor.picked') ?? '');
  }

  private changed(t: Tile, sound: 'thunk' | 'pop') {
    this.host.refreshArea();
    this.host.world.sparkleBurst(t.x, t.y, 6);
    this.host.view.feedback(sound, 'light');
    this.host.refreshHud();
    this.host.save();
  }
}
