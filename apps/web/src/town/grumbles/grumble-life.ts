import { seeded } from '../../shared/art/pixel-canvas';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { FEET_TO_BASE, type Target } from '../play/targets';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { T } from '../world/art/texture';
import type { GrumbleLayer } from '../world/grumble-layer';
import { FEET, type Pt } from '../world/nav';
import type { TownAreas } from '../world/town-areas';
import type { World } from '../world/world';
import { drift, type Drift } from './drift';
import { newDay, tidyOne, type Grumble } from './grumbles';
import type { OnboardEvent } from '../play/onboarding';

export interface GrumbleHost {
  state: TownState; view: View; content: Content; world: World; places: TownAreas; layer: GrumbleLayer;
  /** Whether a family's unlock key has arrived (dust on day 3). */
  arrived(key: string): boolean;
  area(): string;
  puff(): Pt;
  /** Something Puff did (a Grumble befriended), for the guide's listeners. */
  onboard(e: OnboardEvent): void;
  /** The Grumble Puff is heading for or tidying right now, if any. */
  targeted(): string | null;
  refreshHud(): void;
  save(): void;
}

/** Grumbles in play: set out each morning, ambling about, tidied one go at a time into helpers. */
export class GrumbleLife {
  private drifts = new Map<string, Drift>();

  constructor(private host: GrumbleHost) {}

  private get families() { return this.host.content.pack.grumbleFamilies ?? []; }
  find(id: string) { return this.host.state.grumbles.list.find((g) => g.id === id); }
  private familyOf(g: Grumble) { return this.families.find((f) => f.id === g.family); }
  private here() { return this.host.state.grumbles.list.filter((g) => g.area === this.host.area()); }

  /** The tool a Grumble needs, or null once it's a helper (they're greeted, not tidied). */
  toolFor(id: string) { const g = this.find(id); return g && g.state === 'grumpy' ? this.familyOf(g)?.tool ?? null : null; }

  /** A new day, or a game loaded on a day they haven't been set out for (no change on the same day). */
  newDay(day: number) {
    const { state, arrived } = this.host;
    const next = newDay(state.grumbles, { day, families: this.families, arrived: (k) => arrived(k), spot: (a, k) => this.spot(a, k, day), perArea: TUNING.grumbles.perAreaMax, helpersMax: TUNING.grumbles.helpersMax });
    if (next !== state.grumbles) { state.grumbles = next; this.drifts.clear(); }
  }

  /** An open floor spot in an area for the k-th Grumble, away from doors. */
  private spot(area: string, k: number, day: number): Pt | null {
    const a = this.host.places.get(area); if (!a) return null;
    const nav = this.host.places.nav(area); const r = seeded(day * 31 + k * 7 + area.length * 3);
    for (let i = 0; i < 40; i += 1) {
      const x = Math.floor(r() * a.w); const y = Math.floor(r() * a.h);
      const p = { x: x * T + T / 2, y: y * T + FEET };
      if (a.walkable(x, y) && !a.doorAt(x, y) && nav.openAt(p.x, p.y)) return p;
    }
    return null;
  }

  /** Puff walks in: the very first Grumble gets a hello. */
  entered() {
    const { state, view, content } = this.host;
    if (state.has('grumble_seen') || !this.here().some((g) => g.state === 'grumpy')) return;
    state.flag('grumble_seen');
    view.say(content.line('grumble.puff.first') ?? '');
  }

  /** A Grumble drawn under this world point. */
  at(px: number, py: number): Target | null {
    const g = this.here().find((x) => Math.abs(px - x.fx) <= 8 && py >= x.fy + FEET_TO_BASE - 16 && py <= x.fy + FEET_TO_BASE + 2);
    return g ? { kind: 'grumble', id: g.id, x: Math.floor(g.fx / T), y: Math.floor(g.fy / T) } : null;
  }

  /**
   * Each frame: amble (unless the game's held), then draw. The one Puff is heading for or tidying
   * holds still, and once tidied a little a Grumble has warmed to Puff and stops shuffling off.
   */
  tick(dt: number, held: boolean) {
    const here = this.here();
    if (!held) {
      const nav = this.host.places.nav(this.host.area());
      const speed = (TUNING.grumbles.driftTilesPerSecond * T) / 1000;
      const pick = (from: Pt) => { const p = { x: from.x + (Math.random() - 0.5) * 3 * T, y: from.y + (Math.random() - 0.5) * 3 * T }; return nav.openAt(p.x, p.y) ? p : null; };
      const busy = this.host.targeted();
      for (const g of here.filter((x) => x.id !== busy && (x.hits === 0 || x.state === 'helper'))) {
        let d = this.drifts.get(g.id); if (!d) { d = { to: null, waitMs: Math.random() * 2000 }; this.drifts.set(g.id, d); }
        drift(g, d, dt, { speed, clear: (a, b) => nav.clear(a, b), pick, puff: this.host.puff(), rng: Math.random });
      }
    }
    this.host.layer.draw(here.map((g) => ({ id: g.id, family: g.family, x: g.fx, y: g.fy + FEET_TO_BASE, helper: g.state === 'helper', pips: g.hits, of: this.familyOf(g)?.hits ?? 1, tint: this.familyOf(g)?.tint })), dt);
  }

  /** A tidy lands on a Grumble: the pip ring fills; full, it brightens into a helper. */
  tidy(id: string) {
    const { state, view, content, world } = this.host;
    const g = this.find(id); const f = g && this.familyOf(g);
    if (!g || !f) return 'done';
    const tile = { x: Math.floor(g.fx / T), y: Math.floor(g.fy / T) };
    const first = g.hits === 0;
    const result = tidyOne(g, f);
    world.dustPuff(tile.x, tile.y);
    if (result === 'friend') {
      world.sparkleBurst(tile.x, tile.y, 14);
      view.feedback('fanfare', 'success');
      view.banner('Friend made! ✨');
      view.say(content.line('grumble.puff.helper') ?? '');
      state.flag('grumble_friend'); state.flag(`grumble_friend_${g.family}`);
      this.host.onboard({ type: 'befriended', family: g.family });
      this.host.refreshHud();
      this.host.save();
    } else if (result === 'more') {
      view.feedback('pff', 'light');
      view.say(first ? content.line('grumble.puff.tidy') ?? '' : `“${content.line(`grumble.${f.id}.before.${g.hits % 2 ? 1 : 2}`) ?? '...'}”`);
    }
    return result;
  }

  /** Tapping a helper: a happy hello. */
  greet(id: string) {
    const g = this.find(id); if (!g) return;
    this.host.world.sparkleBurst(Math.floor(g.fx / T), Math.floor(g.fy / T), 6);
    this.host.view.say(`“${this.host.content.line(`grumble.${g.family}.after.1`) ?? '!'}”`);
  }
}
