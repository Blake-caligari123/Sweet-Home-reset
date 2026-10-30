import type { Content } from '../data/content';
import type { Clock } from '../play/clock';
import type { Neighbours } from '../neighbours/neighbours';
import type { TownState } from '../state';
import { advanceDrama, dramaStage } from './dramas';
import { recalls, remember } from './memory';
import { moodOf, type Mood } from './mood';

export interface TownLifeHost {
  state: TownState; content: Content; clock: Clock; neighbours: Neighbours;
  /** How tidy a place is, 0 (grey) to 1 (restored). */
  tidiness(area: string): number;
}

/**
 * The townsfolk's own lives (NEXT-PHASE §5.3): how each feels today, what they remember Puff did,
 * and the small dramas between them. Conversations read it; the game tells it what happened.
 */
export class TownLife {
  constructor(private host: TownLifeHost) {}

  private get day() { return this.host.clock.state.day; }

  /** How they feel. `steady` leaves out who happens to be nearby, so plans made from it don't flip as people walk about. */
  mood(id: string, steady = false): Mood {
    const { state, content, clock, neighbours } = this.host;
    const def = content.neighbour(id);
    const here = neighbours.states.get(id)?.area;
    const giftToday = state.memories.find((m) => m.who === id && m.day === this.day && m.what.startsWith('gift_'))?.what;
    return moodOf({
      homeTidy: def?.home ? this.host.tidiness(def.home) : 0.5,
      talkedToday: state.friendOf(id).talkedDay === this.day,
      gift: giftToday === 'gift_loved' ? 'loved' : giftToday === 'gift_liked' ? 'liked' : null,
      friendNear: !steady && !!here && neighbours.visible(here).some((n) => n.id !== id),
      likesWeather: def?.weather === clock.weather,
      drama: this.brewing(id).length > 0
    });
  }

  /** How everyone else in town feels, for what `id` thinks of them. */
  others(id: string) {
    const out: Record<string, Mood> = {};
    for (const n of this.host.content.pack.neighbours ?? []) if (n.id !== id && this.host.neighbours.arrived(n.id)) out[n.id] = this.mood(n.id);
    return out;
  }

  /** What they remember (their own and the town's), newest first. */
  recalls(id: string) { return recalls(this.host.state.memories, id, this.day); }

  /** Something happened that someone (or the whole town, `who: 'town'`) will remember. */
  remember(what: string, who: string) { this.host.state.memories = remember(this.host.state.memories, { what, who, day: this.day }); }

  /** A place was restored: the town remembers, and its owner most of all. */
  restored(area: string) {
    this.remember(`restored_${area}`, 'town');
    const owner = (this.host.content.pack.neighbours ?? []).find((n) => n.home === area);
    if (owner) this.remember('tidied_home', owner.id);
  }

  /** Dramas this neighbour is in the middle of. */
  brewing(id: string) {
    return (this.host.content.pack.dramas ?? []).filter((d) => d.between.includes(id) && dramaStage(d, this.host.state.dramas, this.day) === 'brewing').map((d) => d.id);
  }

  /** Talking to `id` moves a drama on if it's their turn: the line to say, and the drama if that mended it. */
  dramaStep(id: string) {
    const { state, content } = this.host;
    for (const d of content.pack.dramas ?? []) {
      const step = advanceDrama(d, state.dramas, id, this.day);
      if (!step) continue;
      state.dramas = step.state;
      if (step.mended) { state.flag(d.mendedFlag); this.remember(`mended_${d.id}`, 'town'); }
      return { line: step.line, mended: step.mended ? d : null };
    }
    return null;
  }
}
