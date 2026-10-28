import type { Content } from '../data/content';
import { SWING_MS, TUNING } from '../data/tuning';
import type { Puff } from '../play/puff';
import type { Target } from '../play/targets';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { mineRock } from './caves';

export interface MiningHost {
  state: TownState; view: View; content: Content; world: World; puff: Puff; settings: { relaxed: boolean };
  area(): string; day(): number;
  /** The floor changed (a rock broke): show it again. */
  refreshArea(): void;
  refreshHud(): void;
  save(): void;
}

type RockTarget = Extract<Target, { kind: 'prop' }>;

/** Mining a rock: each swing costs Fluff (shown up front), the swings go on until it breaks, and it gives what it always gives. */
export class Mining {
  /** Swings left on each rock Puff has started (not saved: a half-mined rock starts over). */
  private left = new Map<string, number>();

  constructor(private host: MiningHost) {}

  private rockAt(x: number, y: number) {
    return this.host.content.pack.areas.find((a) => a.id === this.host.area())?.rocks?.find((r) => r.x === x && r.y === y);
  }

  /** A swing at the rock, if Puff has the Fluff and room in the bag for what it gives. */
  start(t: RockTarget) {
    const { state, view, content, puff } = this.host;
    const rock = this.rockAt(t.x, t.y);
    if (!rock) return;
    const cost = Math.max(1, Math.round(TUNING.caves.fluffPerSwing * (this.host.settings.relaxed ? 0.5 : 1)));
    if (Object.entries(rock.drop).some(([id, n]) => !state.bag.canAdd(id, n))) { view.say('Bag\'s full! Put things away first.'); return; }
    if (state.fluff.value < cost) { view.say(content.line('cave.tired') ?? ''); this.host.refreshHud(); return; }
    state.fluff.value -= cost;
    if (!this.left.has(rock.id)) this.left.set(rock.id, TUNING.caves.rockHits[rock.size] ?? 2);
    puff.swing = t; puff.pose = 'swing'; puff.swingMs = SWING_MS;
    view.feedback('thunk', 'light');
    this.host.refreshHud();
  }

  /** The swing lands: a crack, or the rock breaks and gives its colour back. Otherwise, swing again. */
  land(t: RockTarget) {
    const { state, view, content, world } = this.host;
    const rock = this.rockAt(t.x, t.y);
    if (!rock) return;
    const left = (this.left.get(rock.id) ?? 1) - 1;
    world.dustPuff(t.x, t.y);
    if (left > 0) { this.left.set(rock.id, left); this.start(t); return; }
    this.left.delete(rock.id);
    const got = mineRock(state.caves, rock, this.host.day());
    if (!got) return;
    for (const [id, n] of Object.entries(got)) state.bag.add(id, n);
    world.sparkleBurst(t.x, t.y, 14);
    view.feedback('sparkle', 'success');
    view.banner(Object.entries(got).map(([id, n]) => `+${n} ${content.itemName(id)}`).join(' · '));
    view.say(content.line(got.gem_blue ? 'cave.gem' : got.ore_silver ? 'cave.silver' : got.shard_colour ? 'cave.shard' : 'cave.ore') ?? '');
    this.host.refreshArea();
    this.host.refreshHud();
    this.host.save();
  }
}
