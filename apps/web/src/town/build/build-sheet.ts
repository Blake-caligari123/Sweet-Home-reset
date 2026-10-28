import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { Clock } from '../play/clock';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { canBuild, DONE, startBuild, type PlotDef } from './build';

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
    if (b) return h('div', { class: 'note' }, h('p', { class: 'friend-name' }, plot.name),
      h('p', { class: 'muted' }, built.stage >= DONE ? `${b.name} ✓` : `${b.name} · being built, finished by morning`));
    const options = plot.allow.map((id) => content.pack.buildings!.find((d) => d.id === id)!).map((def) => {
      const waits = (def.bloom ?? 1) > state.bloom;
      const btn = h('button', { class: 'btn small', type: 'button' }, waits ? `${def.name} · Town Bloom ${def.bloom}` : `${def.name} · ${def.cost.sparkles} ✨`);
      if (waits || canBuild(state, plot, def) === 'short') btn.setAttribute('disabled', '');
      btn.addEventListener('click', () => {
        view.uiTap();
        if (!startBuild(state, plot, def, host.clock.state.day)) return;
        close();
        host.started(plot);
        view.feedback('thunk', 'success');
        view.say(content.line('build.place') ?? '');
      });
      return btn;
    });
    return h('div', { class: 'note' }, h('p', { class: 'friend-name' }, plot.name),
      h('p', { class: 'muted' }, 'Finishes overnight'), h('div', { class: 'btn-row' }, ...options));
  }));
  close = view.sheet('Keeper\'s plans', [h('p', {}, `You have ${state.sparkles} ✨`), list]);
}
