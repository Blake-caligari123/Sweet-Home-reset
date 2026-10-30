import { findsFor, showFind } from '../bloom/finds';
import { festivalToday } from '../festivals/festivals';
import type { DramaDef } from '../life/dramas';
import type { Mood } from '../life/mood';
import type { TownLife } from '../life/town-life';
import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { formatTime, type Clock } from '../play/clock';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { Button, View } from '../ui/view';
import { drawNeighbour24, type Dir } from '../world/art/characters';
import { spriteIcon } from '../world/sprites';
import { canGift, chat, give } from './friends';
import { doneFlag, eventDue, stepsOf, type HeartEvent } from './heart-events';
import { scheduleFor, wakesAt, type NeighbourDef, type Neighbours } from './neighbours';
import { heartsOf, pickLine, RECENT } from './talk';

const OPPOSITE: Record<Dir, Dir> = { down: 'up', up: 'down', left: 'right', right: 'left' };
/** Moods in kind words for the Friends page (never blaming Puff). */
const MOOD_WORDS: Record<Mood, string> = { low: 'a bit flat', okay: 'getting by', happy: 'happy', glowing: 'glowing' };

/** What conversations need from the game around them. */
export interface ConversationHost {
  state: TownState;
  view: View;
  content: Content;
  clock: Clock;
  neighbours: Neighbours;
  /** The townsfolk's moods, memories and dramas (life/). */
  life: TownLife;
  area(): string;
  /** Turn Puff toward a world point; Puff's facing after. */
  facePuff(x: number, y: number): Dir;
  /** Puff's happy hop. */
  hopPuff(): void;
  /** A little sparkle where Puff stands. */
  sparkleAtPuff(count: number): void;
  /** Buttons other features add to a neighbour's speech box (requests to hand over). */
  extraButtons(id: string): Button[];
  /** Tell the onboarding tips Puff met someone. */
  onboard(e: OnboardEvent): void;
  refreshHud(): void;
  save(): void;
}

// Talking to neighbours (M2): the day's chat, gifts, heart events and the Friends page.
export class Conversations {
  constructor(private host: ConversationHost) {}

  talkTo(id: string) {
    const { state, content, clock, neighbours } = this.host;
    const def = content.neighbour(id); const n = neighbours.states.get(id);
    if (!def || !n || n.area !== this.host.area()) { neighbours.releaseAll(); return; }
    const dir = this.host.facePuff(n.fx, n.fy);
    if (n.pose === 'sleep') {
      const up = wakesAt(scheduleFor(def, clock.state.day), clock.state.minutes);
      this.host.view.say(`Shh... ${def.name}'s having a doze.${up ? ` Up at ${formatTime(up)}.` : ''}`);
      neighbours.releaseAll(); return;
    }
    n.dir = OPPOSITE[dir];
    const f = state.friendOf(id);
    const day = clock.state.day;
    const scene = eventDue(content.pack.heartEvents ?? [], id, { hearts: heartsOf(f.points), flags: state.flags, minutes: clock.state.minutes, area: this.host.area() });
    if (scene) {
      chat(f, day);
      this.meet(id);
      this.playScene(def, scene);
      return;
    }
    // A drama they're in moves on when it's their turn to talk (life/dramas.ts).
    const step = this.host.life.dramaStep(id);
    if (step) { this.dramaTalk(def, step.line, step.mended); return; }
    const { life } = this.host;
    const line = pickLine(content.pack.dialogue?.[id] ?? [], {
      minutes: clock.state.minutes, season: clock.season.toLowerCase(), weather: clock.weather, hearts: heartsOf(f.points),
      area: this.host.area(), flags: state.flags, met: f.met, talkedToday: f.talkedDay === day, recent: f.recent ?? [],
      festival: festivalToday(content.pack.festivals ?? [], day)?.id, mood: life.mood(id), memories: life.recalls(id), dramas: life.brewing(id),
      others: life.others(id), bloom: state.bloom
    });
    const text = content.line(line?.id) ?? '...';
    // The first chat of the day counts toward friendship (hearts never go down).
    const hearts = heartsOf(f.points);
    const gained = chat(f, day);
    this.meet(id);
    if (line) {
      f.recent = [...(f.recent ?? []), line.id].slice(-RECENT);
      if (line.once) state.flag(`said_${line.id}`);
    }
    const gifts = canGift(f, day) && state.bag.slots.some(Boolean);
    this.says(def, text, gained, heartsOf(f.points) > hearts, [
      ...this.host.extraButtons(id),
      ...findsFor(content.pack.finds ?? [], state.finds, id).map((find) => ({ label: `Show the ${find.name.toLowerCase()}`, onClick: () => this.showFind(def, find.id) })),
      ...(gifts ? [{ label: 'Give a gift', onClick: () => this.openGifts(def) }] : [])
    ]);
  }

  /** A drama step: their side of it, and when it's mended, both get a little closer to Puff. */
  private dramaTalk(def: NeighbourDef, lineId: string, mended: DramaDef | null) {
    const { state, content, clock } = this.host;
    const f = state.friendOf(def.id);
    const hearts = heartsOf(f.points);
    const gained = chat(f, clock.state.day);
    this.meet(def.id);
    this.says(def, content.line(lineId) ?? '...', gained, heartsOf(f.points) > hearts);
    if (!mended) { this.host.save(); return; }
    for (const id of mended.between) state.friendOf(id).points += TUNING.friendship.request;
    this.host.view.banner(content.line(mended.banner) ?? 'Friends again!');
    this.host.view.feedback('fanfare', 'success');
    this.host.save();
  }

  /** Showing a find to whoever it belongs to: they tell its story, and the friendship grows. */
  private showFind(def: NeighbourDef, id: string) {
    const { state, content } = this.host;
    state.finds = showFind(state.finds, id);
    const f = state.friendOf(def.id);
    const hearts = heartsOf(f.points);
    f.points += TUNING.friendship.loved;
    this.host.sparkleAtPuff(10);
    this.host.view.feedback('chime', 'success');
    this.says(def, content.line(`find.${id}.owner`) ?? 'Oh! Thank you!', TUNING.friendship.loved, heartsOf(f.points) > hearts);
    this.host.save();
  }

  private meet(id: string) {
    const f = this.host.state.friendOf(id);
    if (!f.met) { f.met = true; this.host.state.flag(`met_${id}`); this.host.onboard({ type: 'met', id }); }
  }

  /** A neighbour's speech box; Bye lets them get on with their day. */
  says(def: NeighbourDef, text: string, gained: number, heartUp: boolean, extra: Button[] = []) {
    this.host.view.ask(text, [...extra, { label: 'Bye!', primary: true, onClick: () => this.host.neighbours.releaseAll() }],
      { name: gained ? `${def.name} · friendship +${gained}` : def.name, portrait: this.portraitOf(def) });
    if (heartUp) this.heartUp(def);
  }

  heartUp(def: NeighbourDef) {
    const hearts = heartsOf(this.host.state.friendOf(def.id).points);
    this.host.view.banner(`♥ ${def.name}: ${hearts} heart${hearts === 1 ? '' : 's'}!`);
    this.host.view.feedback('fanfare', 'success');
    this.host.hopPuff();
  }

  /** A story scene the game plays at its own moment (the fair thank-you), once. */
  playStory(id: string) {
    const e = this.host.content.pack.heartEvents?.find((x) => x.id === id);
    const def = e && this.host.content.neighbour(e.neighbourId);
    if (e && def && !this.host.state.has(doneFlag(e))) this.playScene(def, e);
  }

  /** A heart event: one box per line, choices as buttons. Skip jumps to the end (first choices, same rewards). */
  private playScene(def: NeighbourDef, e: HeartEvent) {
    const { state, view, content } = this.host;
    const steps = stepsOf(e, state.flags);
    let i = 0;
    let close: () => void = () => {};
    view.hold();
    const finish = () => {
      close();
      for (const s of steps.slice(i)) if ('choice' in s && s.options[0]) state.flag(s.options[0].setFlag);
      const r = e.rewards ?? {};
      for (const f of [...(r.flags ?? []), doneFlag(e)]) state.flag(f);
      if (r.sparkles) state.sparkles += r.sparkles;
      if (r.bagSlots) { state.bag.grow(r.bagSlots); window.setTimeout(() => view.banner(`A bigger bag! +${r.bagSlots} slots`), 1900); }
      view.banner(`${content.line(e.banner) ?? `♥ A moment with ${def.name}`}${r.sparkles ? ` · +${r.sparkles} ✨` : ''}`);
      view.feedback('fanfare', 'success');
      view.release();
      this.host.neighbours.releaseAll();
      this.host.refreshHud();
      this.host.save();
    };
    const next = () => {
      if (i >= steps.length) { finish(); return; }
      const s = steps[i]; i += 1;
      const skip = e.skippable ? [{ label: 'Skip', onClick: () => { i -= 1; finish(); } }] : [];
      if ('choice' in s) {
        close = view.box(content.line(s.choice) ?? '', s.options.map((o, k) => ({ label: content.line(o.label) ?? '', primary: k === 0, onClick: () => { state.flag(o.setFlag); next(); } })));
        return;
      }
      const who = s.speaker === 'puff' ? null : content.neighbour(s.speaker) ?? def;
      close = view.box(content.line(s.line) ?? '...', [...skip, { label: i >= steps.length ? 'Lovely' : 'Next', primary: true, onClick: next }],
        who ? { name: who.name, portrait: this.portraitOf(who) } : undefined);
    };
    next();
  }

  /** Pick something from the bag for them; one gift a day each. */
  private openGifts(def: NeighbourDef) {
    const { state, view, content } = this.host;
    const grid = h('div', { class: 'bag-grid' });
    let close = () => {};
    state.bag.slots.forEach((s) => {
      if (!s) return;
      const cell = h('button', { class: 'bag-slot', type: 'button', 'aria-label': `Give the ${content.itemName(s.id).toLowerCase()}` }, itemIcon(s.id), s.count > 1 ? h('b', {}, String(s.count)) : '');
      cell.addEventListener('click', () => { view.uiTap(); close(); this.giveGift(def, s.id); });
      grid.append(cell);
    });
    close = view.sheet(`A gift for ${def.name}`, [grid, h('p', { class: 'muted' }, 'One gift a day. Everyone likes being thought of.')], () => this.host.neighbours.releaseAll());
  }

  private giveGift(def: NeighbourDef, item: string) {
    const { state, view, content } = this.host;
    const f = state.friendOf(def.id);
    if (!state.bag.remove(item)) return;
    const { taste, gained, heartUp } = give(def, f, item, this.host.clock.state.day);
    if (taste === 'loved' || taste === 'liked') this.host.life.remember(`gift_${taste}`, def.id);
    if (taste !== 'disliked') this.host.sparkleAtPuff(taste === 'loved' ? 12 : 6);
    view.feedback(taste === 'loved' ? 'coin' : 'tap', taste === 'loved' ? 'medium' : 'light');
    this.says(def, content.line(`${def.id}.gift.${taste}`) ?? 'Thank you!', gained, heartUp > 0);
    this.host.refreshHud();
  }

  /** Everyone Puff has met: hearts, progress to the next one, today's chat and gift, gifts they like. */
  openFriends() {
    const { state, view, content } = this.host;
    const per = TUNING.friendship.pointsPerHeart;
    const day = this.host.clock.state.day;
    const list = h('div', { class: 'friends' });
    const met = [...content.neighbours.values()].filter((d) => state.friends[d.id]?.met);
    for (const d of met) {
      const f = state.friends[d.id]; const hearts = heartsOf(f.points);
      list.append(h('div', { class: 'friend' },
        h('div', { class: 'portrait' }, this.portraitOf(d)),
        h('div', { class: 'friend-body' },
          h('p', { class: 'friend-name' }, `${d.name} · ${MOOD_WORDS[this.host.life.mood(d.id)]}`),
          h('p', { class: 'hearts', 'aria-label': `${hearts} of 10 hearts` }, '♥'.repeat(hearts) + '♡'.repeat(10 - hearts)),
          hearts < 10 ? h('div', { class: 'heart-bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${((f.points % per) / per) * 100}%` } })) : '',
          h('p', { class: 'muted' }, `${f.talkedDay === day ? 'Chatted today ✓' : 'Say hello today'} · ${f.giftDay === day ? 'Gift given ✓' : 'Gift: any time today'}`),
          (f.known ?? []).length ? h('p', { class: 'muted' }, `Likes: ${(f.known ?? []).map((i) => content.itemName(i)).join(', ')}`) : '')));
    }
    const more = content.neighbours.size - met.length;
    const body: Node[] = met.length ? [list] : [h('p', {}, `${this.host.state.names.puff} hasn't met anyone yet. Say hello around town!`)];
    if (more > 0 && met.length) body.push(h('p', { class: 'muted' }, `${more} more neighbour${more === 1 ? '' : 's'} to meet.`));
    view.sheet('Friends', body);
  }

  /** Their sprite art if it has landed, else the code-drawn placeholder, 2x. */
  private portraitOf(def: NeighbourDef): HTMLElement {
    const art = spriteIcon(`${def.id}_idle_down`, 48, def.name) ?? spriteIcon(`${def.id}_walk_down`, 48, def.name);
    if (art) return art;
    const pc = drawNeighbour24(def.species, def.colours, 'down', 0);
    const canvas = h('canvas', { class: 'pixel', width: 24, height: 24, role: 'img', 'aria-label': def.name }) as HTMLCanvasElement;
    canvas.style.width = '48px'; canvas.style.height = '48px';
    canvas.getContext('2d')?.putImageData(new ImageData(pc.data, 24, 24), 0, 0);
    return canvas;
  }
}
