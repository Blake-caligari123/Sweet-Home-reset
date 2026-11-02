import type { Content } from '../data/content';
import type { Area } from '../data/area';
import { SWING_MS, TUNING } from '../data/tuning';
import type { Clock } from '../play/clock';
import type { OnboardEvent } from '../play/onboarding';
import type { Puff } from '../play/puff';
import type { Target } from '../play/targets';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { freshDay, gatherYield, natureKey } from './nature';

export interface NatureHost {
  state: TownState; view: View; content: Content; clock: Clock; world: World; puff: Puff; settings: { relaxed: boolean };
  /** Where Puff is. */
  here(): { id: string; area: Area };
  /** The tool in Puff's paws. */
  selected(): string;
  onboard(e: OnboardEvent): void;
  /** A tree fell: show the stump. */
  refreshArea(): void;
  refreshHud(): void; save(): void;
}

type PropTarget = Extract<Target, { kind: 'prop' }>;

/** Lines for a sit on a bench, by time of day. */
const REST = ['rest.morning', 'rest.day', 'rest.evening', 'rest.night'];

/**
 * The cosy outdoors in play (nature/nature.ts): a shake of a tree or a rummage in a bush once a
 * day each, a sit on a bench to rest, and, with the little axe in the wild places, felling a tree
 * for logs. Each swing costs a little Fluff, shown on the meter as it goes.
 */
export class Nature {
  /** Swings left on a tree Puff has started (not saved: a half-chopped tree starts over). */
  private left = new Map<string, number>();

  constructor(private host: NatureHost) {}

  private propAt(t: PropTarget) {
    const { id, area } = this.host.here();
    const p = area.tapPropAt(t.x, t.y);
    return p ? { p, key: natureKey(id, p.x, p.y), area: id } : null;
  }

  /** Tapping a tree: chop it with the axe in a wild place, else give it a shake. */
  tree(t: PropTarget) {
    const at = this.propAt(t);
    if (!at) return;
    if (this.host.selected() === 'axe' && at.p.type === 'tree') {
      if (TUNING.nature.chopAreas.includes(at.area)) { this.swing(t); return; }
      this.host.view.say(this.line('nature.not_here'));
      return;
    }
    this.gather(at, 'nature.shake');
  }

  bush(t: PropTarget) { const at = this.propAt(t); if (at) this.gather(at, 'nature.rummage'); }

  private gather(at: NonNullable<ReturnType<Nature['propAt']>>, say: string) {
    const { state, view, content, world, clock } = this.host;
    state.nature = freshDay(state.nature, clock.state.day);
    if (state.nature.gathered.includes(at.key)) { view.say(this.line(at.p.type === 'bush' ? 'nature.bush_done' : 'nature.tree_done')); return; }
    const got = gatherYield(at.p.type, clock.season, clock.state.day, at.key);
    if (Object.entries(got).some(([id, n]) => !state.bag.canAdd(id, n))) { view.say('Bag\'s full! Put things away first.'); return; }
    state.nature = { ...state.nature, gathered: [...state.nature.gathered, at.key] };
    for (const [id, n] of Object.entries(got)) state.bag.add(id, n);
    world.dustPuff(at.p.x + 1, at.p.y + 1);
    world.sparkleBurst(at.p.x + 1, at.p.y + 1, 6);
    view.feedback('fwip', 'light');
    view.say(`${this.line(say)} ${Object.entries(got).map(([id, n]) => `+${n} ${content.itemName(id).toLowerCase()}`).join(', ')}`);
    this.host.onboard({ type: 'gathered' });
    this.host.refreshHud(); this.host.save();
  }

  /** A swing of the axe: costs a little Fluff, then lands (land). */
  private swing(t: PropTarget) {
    const { state, view, puff } = this.host;
    const at = this.propAt(t);
    if (!at) return;
    const cost = Math.max(1, Math.round(TUNING.nature.fluffPerSwing * (this.host.settings.relaxed ? 0.5 : 1)));
    if (!state.bag.canAdd('log', TUNING.nature.logsPerTree)) { view.say('Bag\'s full! Put things away first.'); return; }
    if (state.fluff.value < cost) { view.say(this.line('nature.tired')); this.host.refreshHud(); return; }
    state.fluff.value -= cost;
    if (!this.left.has(at.key)) this.left.set(at.key, TUNING.nature.chopHits);
    puff.swing = t; puff.pose = 'swing'; puff.swingMs = SWING_MS;
    view.feedback('thunk', 'light');
    this.host.refreshHud();
  }

  /** The axe lands: a chip of bark, or the tree comes down for logs (and a stump that grows back). */
  land(t: PropTarget) {
    const { state, view, content, world, clock } = this.host;
    const at = this.propAt(t);
    if (!at) return;
    const left = (this.left.get(at.key) ?? 1) - 1;
    world.dustPuff(t.x, t.y);
    if (left > 0) { this.left.set(at.key, left); this.swing(t); return; }
    this.left.delete(at.key);
    state.nature = { ...state.nature, felled: { ...state.nature.felled, [at.key]: clock.state.day } };
    state.bag.add('log', TUNING.nature.logsPerTree);
    world.sparkleBurst(at.p.x + 1, at.p.y + 1, 14);
    view.feedback('combo', 'success');
    view.banner(`🪵 Timber! +${TUNING.nature.logsPerTree} ${content.itemName('log').toLowerCase()}s`);
    view.say(this.line('nature.felled'));
    this.host.onboard({ type: 'chopped' });
    this.host.refreshArea();
    this.host.refreshHud(); this.host.save();
  }

  stump() { this.host.view.say(this.line('nature.stump')); }
  sapling() { this.host.view.say(this.line('nature.sapling')); }

  /** A sit on a bench: Fluff comes back, a little time passes, and Puff takes in the view. */
  sit() {
    const { state, view, clock, puff } = this.host;
    const band = clock.state.minutes < 11 * 60 ? 0 : clock.state.minutes < 17 * 60 ? 1 : clock.state.minutes < 20 * 60 ? 2 : 3;
    const before = state.fluff.value;
    state.fluff.eat(TUNING.nature.sitFluff);
    clock.pass(TUNING.nature.sitMinutes);
    puff.dir = 'down';
    puff.hop();
    view.feedback('pop', 'light');
    const gained = Math.round(state.fluff.value - before);
    view.say(`${this.line(REST[band])}${gained > 0 ? ` (+${gained} Fluff)` : ''}`);
    this.host.onboard({ type: 'rested' });
    this.host.refreshHud(); this.host.save();
  }

  private line(id: string) { return this.host.content.named(this.host.content.line(id) ?? ''); }
}
