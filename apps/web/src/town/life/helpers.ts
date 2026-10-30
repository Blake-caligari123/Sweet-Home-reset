import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { TOOL_FOR, type AreaMess } from '../play/mess';
import type { TownState } from '../state';
import type { TownAreas } from '../world/town-areas';

// Tidying changes the people (NEXT-PHASE §5.1): once Puff has restored someone's home, they join
// in. Each morning every such neighbour tidies a few spots in the messiest outdoor place Puff has
// been, and the morning says who helped.

/**
 * Tidy up to `n` spots (never clutter: that's Puff's to put away), stopping short of restoring the
 * place: that moment stays Puff's. Returns how many cleared.
 */
export function tidySome(m: AreaMess, n: number) {
  let done = 0;
  for (let i = 0; i < m.type.length && done < n; i += 1) {
    if (m.total === 0 || m.progress + 1 / m.total >= TUNING.restoreThreshold) break;
    const x = i % m.w; const y = Math.floor(i / m.w); const type = m.typeAt(x, y);
    if (type === 'none' || type === 'clutter') continue;
    if (m.hit(x, y, TOOL_FOR[type].tool, 9).cleared) done += 1;
  }
  return done;
}

/** "Hazel", "Hazel and Bea", "Hazel, Bea and Pip". */
export const listNames = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export interface HelpersHost { state: TownState; content: Content; places: TownAreas; arrived(id: string): boolean }

export class Helpers {
  constructor(private host: HelpersHost) {}

  /** The morning's help, as banners (none when nobody helps or nothing needs it). */
  morning(): string[] {
    const { state, content, places } = this.host;
    const helpers = (content.pack.neighbours ?? []).filter((n) => n.home && this.host.arrived(n.id) && places.has(n.home) && places.mess(n.home).restored);
    if (!helpers.length) return [];
    const outdoor = state.visited.filter((id) => places.has(id) && places.get(id)!.pack.kind === 'outdoor' && !places.mess(id).restored);
    const where = outdoor.sort((a, b) => places.mess(a).progress - places.mess(b).progress)[0];
    if (!where || !tidySome(places.mess(where), helpers.length * TUNING.helperSpots)) return [];
    return [`🤝 ${listNames(helpers.map((n) => n.name))} helped tidy ${content.named(places.get(where)!.pack.name)} this morning!`];
  }
}
