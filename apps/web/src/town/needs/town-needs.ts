import type { Content } from '../data/content';
import type { TownLife } from '../life/town-life';
import type { TownState } from '../state';
import { chipIn, metNeeds } from './needs';

export interface TownNeedsHost { state: TownState; content: Content; life: TownLife;
  /** Whether a year-one key (or neighbour) has arrived. */
  arrived(key: string): boolean }

/** The town's needs in play: each morning the townsfolk chip in, and newly met needs are cheered. */
export class TownNeeds {
  constructor(private host: TownNeedsHost) {}

  /** Needs the town knows about now. */
  known() { return (this.host.content.pack.needs ?? []).filter((n) => !n.unlock || this.host.arrived(n.unlock)); }

  /** After the night: chip in, tick off needs met overnight. Returns the morning's banners. */
  morning(): string[] {
    const { state, content, life } = this.host;
    const here = (content.pack.neighbours ?? []).filter((n) => this.host.arrived(n.id));
    const gift = chipIn(here.map((n) => life.mood(n.id, true)));
    state.fund += gift;
    const out: string[] = [];
    for (const id of metNeeds(this.known(), state.plots)) {
      if (state.needsMet.includes(id)) continue;
      const need = this.known().find((n) => n.id === id)!;
      state.needsMet.push(id);
      state.fund += need.fund;
      life.remember(`need_${id}`, 'town');
      out.push(`🏘 Town need met: ${need.name}! Everyone chips in ${need.fund} ✨ to the town fund.`);
    }
    return out;
  }
}
