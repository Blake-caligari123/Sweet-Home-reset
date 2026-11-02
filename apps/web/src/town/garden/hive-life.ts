import type { Content } from '../data/content';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { collectHoney, hiveKey } from './hives';

export interface HiveHost { state: TownState; view: View; content: Content; world: World; area(): string; pickUp(x: number, y: number): void; refreshHud(): void; save(): void }

/** Tapping a beehive: honey to collect (with a happy buzz), or the bees busy, with the choice to move the hive. */
export function tapHive(h: HiveHost, x: number, y: number) {
  const { state, view, content, world } = h;
  const key = hiveKey(h.area(), x, y);
  const waiting = state.hives[key] ?? 0;
  if (waiting > 0 && state.bag.canAdd('honey', waiting)) {
    const r = collectHoney(state.hives, key);
    state.hives = r.hives;
    state.bag.add('honey', r.honey);
    world.sparkleBurst(x, y, 10);
    view.feedback('coin', 'success');
    view.say(`${content.line('hive.collect') ?? ''} +${r.honey} ${content.itemName('honey').toLowerCase()}`);
    h.refreshHud(); h.save();
    return;
  }
  if (waiting > 0) { view.say('Bag\'s full! Put things away first.'); return; }
  view.ask(content.line('hive.busy') ?? '', [
    { label: 'Leave them be', primary: true, onClick: () => {} },
    { label: 'Pick up the hive', onClick: () => h.pickUp(x, y) }
  ]);
}
