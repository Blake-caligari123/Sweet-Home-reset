import { h } from '../../shared/ui/dom';
import type { Area } from '../data/area';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { Conversations } from '../neighbours/conversations';
import { heartsOf } from '../neighbours/talk';
import type { Clock } from '../play/clock';
import type { AreaMess } from '../play/mess';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { Button, Settings, View } from '../ui/view';
import { accept, cleanDone, finish, freshMess, MAX_ACCEPTED, newDay, withTiles, type RequestTemplate } from './requests';

/** What the notice board and jobs need from the game around them. */
export interface JobsHost {
  state: TownState;
  view: View;
  content: Content;
  clock: Clock;
  settings: Settings;
  talk: Conversations;
  areas: Map<string, Area>;
  messFor(area: string): AreaMess;
  area(): string;
  /** Redraw one mess tile of the current area. */
  syncMess(i: number): void;
  /** Tell the onboarding tips a job was taken or done. */
  onboard(e: OnboardEvent): void;
  refreshHud(): void;
  save(): void;
}

// The notice board and the jobs Puff takes from it (M2): see requests.ts for the rules.
export class Jobs {
  constructor(private host: JobsHost) {}

  /** Each morning: missed jobs quietly go (never in relaxed mode), and the board gets new ones. */
  post() {
    const { state, content, clock, settings } = this.host;
    const expire = !(settings.relaxed && !TUNING.relaxedMode.requestExpiry);
    const before = state.requests.list;
    const { state: next, expired } = newDay(state.requests, content.pack.requests ?? [], clock.state.day, { expire });
    state.requests = next;
    // A missed tidy job takes its leftover mess with it.
    for (const r of before.filter((x) => expired.includes(x.id) && x.tiles?.length)) {
      const t = content.request(r.id);
      if (t?.area && this.host.areas.has(t.area)) this.host.messFor(t.area).clearFresh(r.tiles!);
    }
  }

  /** The tracker line: Puff's first job, if any. */
  tracker() {
    const job = this.host.state.requests.list.find((r) => r.accepted);
    return job && this.host.content.line(this.host.content.request(job.id)?.text);
  }

  openBoard() {
    const { state, view, content, clock } = this.host;
    const list = h('div', { class: 'board' });
    let close = () => {};
    for (const r of state.requests.list) {
      const t = content.request(r.id); if (!t) continue;
      const days = r.until - clock.state.day + 1;
      const when = days <= 1 ? 'Any time today' : `Any time in the next ${days} days`;
      const take = h('button', { class: `btn small ${r.accepted ? '' : 'primary'}`, type: 'button' }, r.accepted ? 'On it ✓' : 'I\'ll do it');
      if (r.accepted) take.setAttribute('disabled', '');
      take.addEventListener('click', () => {
        view.uiTap();
        const next = accept(state.requests, r.id);
        if (!next) { view.say(`Puff can take ${MAX_ACCEPTED} jobs at a time.`); return; }
        state.requests = next;
        this.start(t);
        this.host.onboard({ type: 'accepted', id: r.id });
        close(); this.host.refreshHud();
        view.say('On it!');
      });
      list.append(h('div', { class: 'note' },
        h('p', { class: 'friend-name' }, content.neighbour(t.neighbourId)?.name ?? 'A neighbour'),
        h('p', {}, content.line(t.text) ?? ''),
        h('p', { class: 'muted' }, `${when} · ${t.sparkles} ✨ · friendship`),
        take));
    }
    close = view.sheet('Notice board', state.requests.list.length ? [list] : [h('p', {}, 'Nothing pinned up today. Tomorrow, maybe!')]);
  }

  /** A tidy job puts its mess down when Puff takes it on. */
  private start(t: RequestTemplate) {
    const { state, areas } = this.host;
    if (t.kind !== 'clean' || !t.area || !areas.has(t.area)) return;
    const m = this.host.messFor(t.area);
    const tiles = m.scatter(freshMess(t, areas.get(t.area)!, m));
    state.requests = withTiles(state.requests, t.id, tiles);
    if (t.area === this.host.area()) for (const i of tiles) this.host.syncMess(i);
  }

  /** After a clean: any tidy job in this area with nothing left of its mess is done. */
  checkTidy() {
    const area = this.host.area();
    const m = this.host.messFor(area);
    for (const r of this.host.state.requests.list.filter((x) => x.accepted)) {
      const t = this.host.content.request(r.id);
      if (t?.kind === 'clean' && t.area === area && cleanDone(t, m, r.tiles)) this.complete(t, false);
    }
  }

  /** "Give the radish" buttons for this neighbour's bring jobs Puff can hand over now. */
  deliveriesFor(id: string): Button[] {
    const { state, content } = this.host;
    return state.requests.list.filter((r) => r.accepted).map((r) => content.request(r.id))
      .filter((t): t is RequestTemplate => !!t && t.neighbourId === id && t.kind === 'bring' && state.bag.count(t.item!) > 0)
      .map((t) => ({ label: `Give the ${content.itemName(t.item!).toLowerCase()}`, onClick: () => { state.bag.remove(t.item!); this.complete(t, true); } }));
  }

  private complete(t: RequestTemplate, inPerson: boolean) {
    const { state, view, content } = this.host;
    state.requests = finish(state.requests, t.id);
    const def = content.neighbour(t.neighbourId);
    const f = state.friendOf(t.neighbourId);
    const hearts = heartsOf(f.points);
    f.points += TUNING.friendship.request;
    state.sparkles += t.sparkles;
    if (t.setFlag) state.flag(t.setFlag);
    this.host.onboard({ type: 'jobDone', id: t.id });
    view.feedback('coin', 'success');
    view.banner(`Job done! +${t.sparkles} ✨`);
    const up = heartsOf(f.points) > hearts;
    if (def && inPerson) this.host.talk.says(def, content.line(`${def.id}.request.done`) ?? 'Thank you!', TUNING.friendship.request, up);
    else if (def && up) window.setTimeout(() => this.host.talk.heartUp(def), 1900);
    this.host.refreshHud();
    this.host.save();
  }
}
