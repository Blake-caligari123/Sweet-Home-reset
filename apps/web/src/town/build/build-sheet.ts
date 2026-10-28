import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { Clock } from '../play/clock';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { canBuild, canUpgrade, DONE, startBuild, upgrade, type BuildingDef, type PlotDef } from './build';

export interface BuildHost {
  state: TownState; view: View; content: Content; clock: Clock;
  /** Whether something in the year-one schedule has arrived (building opens on day 2). */
  arrived(key: string): boolean;
  /** A build just started on this plot: show the scaffolding, save. */
  started(plot: PlotDef): void;
}

/** The Keeper's plans in the square: each plot, what could go there and its cost, or how it's coming along. */
export function openBuildBoard(host: BuildHost) {
  const { state, view, content } = host;
  const plots = (content.pack.plots ?? []).filter((p) => !p.unlock || host.arrived(p.unlock));
  if (!state.has('keeper_named')) { view.say(content.line('build.wanted') ?? ''); return; }
  if (!plots.length) { view.say(content.line('build.tomorrow') ?? ''); return; }
  let close = () => {};
  const list = h('div', { class: 'board' }, ...plots.map((plot) => {
    const built = state.plots[plot.id];
    const b = built && content.pack.buildings?.find((d) => d.id === built.buildingId);
    if (b) {
      const ups = built.stage >= DONE ? (content.pack.buildings ?? []).filter((d) => d.upgradeOf === b.id) : [];
      return h('div', { class: 'note' }, h('p', { class: 'friend-name' }, plot.name),
        h('p', { class: 'muted' }, built.stage >= DONE ? `${b.name} ✓` : `${b.name} · being built, ${built.readyDay - host.clock.state.day > 1 ? 'two more nights' : 'finished by morning'}`),
        ...(ups.length ? [h('div', { class: 'btn-row' }, ...ups.map((u) => offer(u, true)))] : []));
    }
    return h('div', { class: 'note' }, h('p', { class: 'friend-name' }, plot.name),
      h('p', { class: 'muted' }, nightsText(content.pack.buildings!.find((d) => d.id === plot.allow[0])!)), h('div', { class: 'btn-row' }, ...plot.allow.map((id) => offer(content.pack.buildings!.find((d) => d.id === id)!, false))));

    /** A Build (or Upgrade) button: greyed until Puff can afford it and the town has bloomed enough. */
    function offer(def: BuildingDef, isUpgrade: boolean) {
      const waits = (def.bloom ?? 1) > state.bloom;
      const items = Object.entries(def.cost.items ?? {}).map(([id, n]) => ` · ${state.bag.count(id)}/${n} ${content.itemName(id).toLowerCase()}`).join('');
      const label = waits ? `${def.name} · Town Bloom ${def.bloom}` : `${isUpgrade ? 'Upgrade: ' : ''}${def.name} · ${def.cost.sparkles} ✨${items}`;
      const btn = h('button', { class: 'btn small', type: 'button' }, label);
      if (waits || (isUpgrade ? canUpgrade(state, plot, def) : canBuild(state, plot, def)) !== 'ok') btn.setAttribute('disabled', '');
      btn.addEventListener('click', () => {
        view.uiTap();
        const day = host.clock.state.day;
        if (!(isUpgrade ? upgrade(state, plot, def, day) : startBuild(state, plot, def, day))) return;
        close();
        host.started(plot);
        view.feedback('thunk', 'success');
        view.say(content.line(def.paves ? 'repair.start' : 'build.place') ?? '');
      });
      return btn;
    }
  }));
  close = view.sheet('Keeper\'s plans', [h('p', {}, `You have ${state.sparkles} ✨`), list]);
}

const nightsText = (b: BuildingDef) => (b.nights > 1 ? `Takes ${b.nights} nights` : 'Finishes overnight');
