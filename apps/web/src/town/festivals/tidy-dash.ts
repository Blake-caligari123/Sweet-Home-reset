import { h } from '../../shared/ui/dom';
import type { Area } from '../data/area';
import type { Content } from '../data/content';
import type { Clock } from '../play/clock';
import type { AreaMess } from '../play/mess';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { dashResult, dashSpots, festivalToday, practiceDash, type FestivalDef } from './festivals';

export interface DashHost {
  state: TownState; view: View; content: Content; clock: Clock;
  area(): string; areaOf(id: string): Area; messFor(id: string): AreaMess;
  /** Show a tile's mess changing in the world. */
  syncMess(i: number): void;
  refreshHud(): void;
  save(): void;
  /** Play a story scene once (the fair thank-you). */
  playStory(id: string): void;
}

/**
 * The fair stall and its tidy dash: on a festival day, tap the stall to start; light mess pops up
 * around the place and a timer counts down (paused while a sheet is open). Fluff is topped up so
 * the dash never runs Puff dry. When every spot is tidied, time's up, or Puff wanders off, the
 * leftovers vanish and the town cheers. On other days the stall offers a practice dash, for a best score.
 */
export class TidyDash {
  private run: { def: FestivalDef; tiles: number[]; left: number; el: HTMLElement } | null = null;

  constructor(private host: DashHost) {}

  get active() { return !!this.run; }

  /** Tapping the stall. */
  open() {
    const { view, content, clock } = this.host;
    if (this.run) return;
    const def = festivalToday(content.pack.festivals ?? [], clock.state.day);
    if (!def) {
      const p = practiceDash(this.host.area());
      view.ask(content.line('festival.practice') ?? '', [{ label: 'Start the dash!', primary: true, onClick: () => this.start(p) }, { label: 'Not now', onClick: () => {} }]);
      return;
    }
    if (def.game === 'lights') { view.say(content.line(`festival.${def.id}.intro`) ?? def.name); return; }
    view.ask(content.line(`festival.${def.id}.intro`) ?? def.name, [
      { label: 'Start the dash!', primary: true, onClick: () => this.start(def) },
      { label: 'Not yet', onClick: () => {} }
    ]);
  }

  private start(def: FestivalDef) {
    const { state, view, content, clock } = this.host;
    if (this.host.area() !== def.area) return;
    const m = this.host.messFor(def.area);
    const tiles = m.scatter(dashSpots(this.host.areaOf(def.area), m, clock.state.day, def.spots, def.mess));
    for (const i of tiles) this.host.syncMess(i);
    state.fluff.value = Math.max(state.fluff.value, state.fluff.max);
    const el = h('div', { class: 'dash-timer', role: 'status' });
    view.root.append(el);
    this.run = { def, tiles, left: def.seconds * 1000, el };
    this.show(0);
    view.feedback('fanfare', 'success');
    view.say(content.line('festival.start') ?? '');
    this.host.refreshHud();
  }

  private cleaned() {
    const m = this.host.messFor(this.run!.def.area);
    return this.run!.tiles.filter((i) => !m.type[i]).length;
  }

  private show(done: number) {
    const r = this.run!;
    r.el.textContent = `✨ ${done} / ${r.tiles.length} · ${Math.ceil(r.left / 1000)}s`;
  }

  update(dt: number) {
    const r = this.run;
    if (!r || this.host.view.busy) return;
    r.left -= dt;
    const done = this.cleaned();
    this.show(done);
    if (done >= r.tiles.length || r.left <= 0 || this.host.area() !== r.def.area) this.finish(done);
  }

  private finish(done: number) {
    const { state, view, content, clock } = this.host;
    const r = this.run!; this.run = null;
    r.el.remove();
    const m = this.host.messFor(r.def.area);
    m.clearFresh(r.tiles);
    if (this.host.area() === r.def.area) for (const i of r.tiles) this.host.syncMess(i);
    const { sparkles, cheer } = dashResult(r.def, done);
    if (r.def.id === 'practice') {
      const best = done > state.dashBest; if (best) state.dashBest = done;
      view.feedback('fanfare', 'success');
      view.showDialogue(`${content.line(cheer) ?? ''} ${done} of ${r.tiles.length} tidied${best ? ' · a new best!' : ` · best ${state.dashBest}`}`);
      this.host.save();
      return;
    }
    // The prize is for the first go each festival day; another go is just for fun.
    const today = `festival_${r.def.id}_day${clock.state.day}`;
    const first = !state.has(today);
    const ribbon = !!r.def.outfit && !state.has(`festival_${r.def.id}`);
    if (first) { state.flag(today); state.sparkles += sparkles; }
    state.flag(`festival_${r.def.id}`);
    const lines = [content.line(cheer) ?? '', `${done} of ${r.tiles.length} tidied${first ? ` · +${sparkles} ✨` : ''}`];
    if (ribbon) lines.push((content.line('festival.prize') ?? '').replace('{outfit}', (content.pack.outfits?.find((o) => o.id === r.def.outfit)?.name ?? '').toLowerCase()));
    view.feedback('fanfare', 'success');
    const scene = ribbon ? r.def.scene : undefined;
    if (scene) view.ask(lines.join(' '), [{ label: 'OK', primary: true, onClick: () => this.host.playStory(scene) }]);
    else view.showDialogue(lines.join(' '));
    this.host.refreshHud();
    this.host.save();
  }
}
