import { seeded } from '../../shared/art/pixel-canvas';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { festivalToday } from '../festivals/festivals';
import type { OnboardEvent } from '../play/onboarding';
import type { MessSpot } from '../play/mess';
import type { TownState } from '../state';
import type { Button, View } from '../ui/view';
import type { TownAreas } from '../world/town-areas';
import { happening, happeningFor, hearHappening, inSparkleHour, LOST_ITEMS, NO_HAPPENING, type HappeningFacts, type HappeningId } from './happenings';

export interface HappeningHost {
  state: TownState; view: View; content: Content; places: TownAreas;
  day(): number; minutes(): number; facts(): HappeningFacts; refreshHud(): void; save(): void; hop(): void;
  /** A neighbour's thanks in their chat box. */
  thank(id: string, text: string): void;
}

/**
 * Today's happening in play (daily/happenings.ts): set up in the morning (leaves blown in, a lost
 * thing dropped), told in the news, counted as Puff plays, cheered when done.
 */
export class HappeningLife {
  private hourCheered = false;

  constructor(private h: HappeningHost) {}

  private get s() { return this.h.state.happening; }
  private say(id: string, fill: Record<string, string> = {}) {
    let t = this.h.content.named(this.h.content.line(`happening.${id}`) ?? '');
    for (const [k, v] of Object.entries(fill)) t = t.replaceAll(`{${k}}`, v);
    return t;
  }
  private fill(): Record<string, string> {
    const { content, places } = this.h;
    const l = this.s.lost;
    return l ? { who: content.neighbour(l.owner)?.name ?? '', item: content.itemName(l.item).toLowerCase(), place: content.named(places.get(l.area)?.pack.name ?? l.area) } : {};
  }

  /** A new morning: pick today's happening and set it up (`force`: the feature tour's pick). */
  start(force?: HappeningId) {
    const { state, content } = this.h;
    const day = this.h.day();
    if (this.s.day === day && !force) return;
    this.hourCheered = false;
    const f = this.h.facts();
    const id = force ?? happeningFor(f, !!festivalToday(content.pack.festivals ?? [], day), this.s.day === day - 1 ? this.s.id : null);
    state.happening = { ...NO_HAPPENING, day, id };
    if (id === 'breeze') this.blow(f);
    if (id === 'lost' && !this.drop(f)) state.happening = { ...NO_HAPPENING, day };
  }

  /** A blustery night: leaves (and a little dust) blown into a few places outdoors. */
  private blow(f: HappeningFacts) {
    const r = seeded(this.h.day() * 37 + 5);
    for (const id of this.outdoors(f).slice(0, 3)) this.h.places.mess(id).scatter(this.spots(id, 6, r, 'leaves'));
  }

  /** Someone Puff knows drops something somewhere outdoors, hidden in a little clutter. */
  private drop(f: HappeningFacts) {
    const { state } = this.h;
    const r = seeded(this.h.day() * 53 + 11);
    const owner = f.friends[Math.floor(r() * f.friends.length)];
    const free = LOST_ITEMS.filter((i) => !state.bag.count(i));
    if (!free.length) return false;
    const item = free[Math.floor(r() * free.length)];
    for (const area of this.outdoors(f)) {
      const [spot] = this.spots(area, 1, r, 'clutter');
      if (!spot) continue;
      this.h.places.mess(area).scatter([{ ...spot, item }]);
      state.happening.lost = { item, owner, area };
      return true;
    }
    return false;
  }

  private outdoors(f: HappeningFacts) {
    const r = seeded(this.h.day() * 17);
    return f.places.filter((id) => this.h.places.get(id)?.pack.kind === 'outdoor').map((id) => ({ id, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.id);
  }

  private spots(id: string, n: number, r: () => number, type: MessSpot['type']): MessSpot[] {
    const area = this.h.places.get(id)!; const m = this.h.places.mess(id);
    const out: MessSpot[] = [];
    for (let tries = 0; tries < 80 && out.length < n; tries += 1) {
      const x = Math.floor(r() * area.w); const y = Math.floor(r() * area.h);
      if (!area.walkable(x, y) || area.doorAt(x, y) || m.typeAt(x, y) !== 'none' || out.some((s) => s.x === x && s.y === y)) continue;
      out.push({ type, x, y });
    }
    return out;
  }

  hear(e: OnboardEvent) {
    const { state, view } = this.h;
    const s = this.s;
    if (s.day !== this.h.day() || !s.id) return;
    if (s.id === 'sparkle_hour' && e.type === 'cleared' && inSparkleHour(this.h.minutes())) {
      state.sparkles += TUNING.sparkleHourBonus;
      if (!this.hourCheered) { this.hourCheered = true; view.feedback('chime', 'success'); view.banner(this.say('sparkle_hour.start')); }
      this.h.refreshHud();
      return;
    }
    if (s.id === 'lost' && s.lost && !s.lost.found && e.type === 'cleared' && e.area === s.lost.area && state.bag.count(s.lost.item)) {
      state.happening = { ...s, lost: { ...s.lost, found: true } };
      view.feedback('chime', 'success'); view.banner(this.say('lost.found', this.fill()));
      this.h.save();
      return;
    }
    const r = hearHappening(s, e);
    if (r.state === s) return;
    state.happening = r.state;
    if (r.finished) this.finish();
  }

  private finish() {
    const { state, view } = this.h;
    state.sparkles += TUNING.happeningSparkles;
    view.feedback('fanfare', 'success');
    view.banner(`🎉 ${this.goal()}: done! +${TUNING.happeningSparkles} ✨`);
    this.h.hop(); this.h.refreshHud(); this.h.save();
  }

  /** Today's happening as a goal line, if it has one. */
  private goal() {
    const s = this.s;
    return s.id && s.id !== 'sparkle_hour' ? this.say(`${s.id}.goal`, { n: String(happening(s.id).count), ...this.fill() }) : null;
  }

  /** The morning news line. */
  morning(): string[] {
    const s = this.s;
    return s.id && s.day === this.h.day() ? [this.say(`${s.id}.news`, this.fill())] : [];
  }

  /** For the journal: the happening's goal with how far along. */
  lines(): string[] {
    const s = this.s; const goal = this.goal();
    if (!s.id || s.day !== this.h.day()) return [];
    if (!goal) return [this.say('sparkle_hour.news')];
    const count = happening(s.id).count;
    return [s.done ? `🌟 ${goal}` : `⭐ ${goal}${count > 1 ? ` (${s.have}/${count})` : ''}`];
  }

  /** "Give back the …" in the owner's chat box, once Puff has found it. */
  buttonsFor(id: string): Button[] {
    const { state, content } = this.h;
    const l = this.s.lost;
    if (this.s.id !== 'lost' || this.s.done || !l || l.owner !== id || !state.bag.count(l.item)) return [];
    return [{ label: `Give back the ${content.itemName(l.item).toLowerCase()}`, onClick: () => {
      state.bag.remove(l.item);
      state.friendOf(id).points += TUNING.friendship.loved;
      state.happening = { ...this.s, have: 1, done: true };
      this.h.thank(id, this.say('lost.thanks', this.fill()));
      this.finish();
    } }];
  }
}
