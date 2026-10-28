import type { Area } from '../data/area';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { Clock } from '../play/clock';
import type { PlayEvent } from '../play/events';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { cleared, fade, NO_CHAIN } from './chain';
import { rollFind } from './finds';
import { GOLDEN, goldenPickup, goldenSpot } from './golden';
import { crossed } from './milestones';
import type { RewardHud } from './reward-hud';

/** What the rewards keep in the save. */
export interface RewardState {
  /** Finds collected, by item, for the Finds book. */
  finds: Record<string, number>;
  /** Cleans since the last find (for findPity). */
  sinceFind: number;
}

export const newRewardState = (): RewardState => ({ finds: {}, sinceFind: 0 });

export interface RewardsHost {
  state: TownState;
  view: View;
  content: Content;
  clock: Clock;
  areas: Map<string, Area>;
  hud: RewardHud;
  /** The area Puff is in: its id and name, how tidy it is, and whether there's a home bar to show. */
  here(): { id: string; name: string; progress: number; bar: boolean };
  /** A tile's centre on screen. */
  tileToScreen(x: number, y: number): { x: number; y: number };
  hopPuff(): void;
  /** A burst of sparkles on a tile. */
  sparkle(x: number, y: number, count: number): void;
  refreshHud(): void;
}

/** How often golden dust glints. */
const TWINKLE_MS = 1200;

/** The rewards overhaul (claude/REWARDS-PLAN.md): turns what Puff does into Sparkles, pips and cheer. */
export class Rewards {
  private chain = NO_CHAIN;
  /** The area and progress last seen, so a pip rings as it's passed. */
  private seen = { area: '', progress: 0 };
  private twinkleMs = 0;

  constructor(private host: RewardsHost) {}

  handle(e: PlayEvent) {
    if (e.type === 'cleared') { this.cleaned(e.x, e.y); this.maybeFind(e.area, e.x, e.y); }
    if (e.type === 'took' && e.item === GOLDEN) this.caughtGolden(e.x, e.y);
  }

  /** Where today's golden dust waits. */
  goldenToday() { const { content, clock, areas } = this.host; return goldenSpot(clock.state.day, content.pack.areas, areas); }

  /** Today's golden dust, if it waits in this area. */
  goldenHere(area: string) { return goldenPickup(this.goldenToday(), area, this.host.clock.state.day); }

  /** For the morning letter: the name of the place today's golden dust waits. */
  goldenHint() { const spot = this.goldenToday(); return spot ? this.host.areas.get(spot.area)!.pack.name : null; }

  /** Each frame while play isn't held: the chain fades unless Puff is busy, and the home bar follows the area. */
  tick(dt: number, puffBusy: boolean) {
    this.chain = fade(this.chain, dt, puffBusy);
    this.host.hud.setChain(this.chain.count);
    const here = this.host.here();
    if (here.id === this.seen.area) for (const pip of crossed(this.seen.progress, here.progress)) this.pip(here.name, pip);
    this.seen = { area: here.id, progress: here.progress };
    this.host.hud.setProgress(here.name, here.progress, here.bar);
    this.twinkle(here.id, dt);
  }

  /** Golden dust glints now and then, so it can be spotted across the room. */
  private twinkle(area: string, dt: number) {
    this.twinkleMs -= dt;
    if (this.twinkleMs > 0) return;
    this.twinkleMs = TWINKLE_MS;
    const { state, clock } = this.host;
    const g = this.goldenHere(area)[0];
    if (g && !(state.picked.day === clock.state.day && state.picked.ids.includes(g.id))) this.host.sparkle(g.x, g.y, 4);
  }

  private cleaned(x: number, y: number) {
    const { state, view, hud } = this.host;
    const r = cleared(this.chain);
    this.chain = r.chain;
    state.sparkles += r.sparkles;
    const at = this.host.tileToScreen(x, y);
    hud.popup(at.x, at.y, `+${r.sparkles} ✨`);
    hud.fly(at.x, at.y, r.sparkles);
    if (r.chain.count > 1) view.chime(Math.min(1, r.chain.count / 12));
    if (r.chain.count % TUNING.rewards.chainHopEvery === 0) this.host.hopPuff();
    this.host.refreshHud();
  }

  private maybeFind(area: string, x: number, y: number) {
    const r = this.host.state.rewards;
    const item = rollFind(this.host.content.pack.finds ?? [], { day: this.host.clock.state.day, area, x, y, sinceFind: r.sinceFind });
    if (item) this.found(item, x, y); else r.sinceFind += 1;
  }

  /** A find: into the bag (if there's room) and the Finds book. */
  private found(item: string, x: number, y: number) {
    const { state, view, content } = this.host;
    const r = state.rewards;
    const first = !r.finds[item];
    r.finds[item] = (r.finds[item] ?? 0) + 1;
    r.sinceFind = 0;
    const roomy = state.bag.add(item);
    this.host.sparkle(x, y, 10);
    view.feedback(first ? 'fanfare' : 'coin', 'medium');
    view.banner(`${first ? 'New find' : 'A find'}: ${content.itemName(item)}!${first ? ' Into the Finds book.' : ''}${roomy ? '' : ' (Bag\'s full.)'}`);
    this.host.refreshHud();
  }

  private caughtGolden(x: number, y: number) {
    const { state, view, hud } = this.host;
    const sparkles = TUNING.rewards.goldenSparkles;
    state.sparkles += sparkles;
    const at = this.host.tileToScreen(x, y);
    hud.popup(at.x, at.y, `+${sparkles} ✨`);
    hud.fly(at.x, at.y, sparkles);
    this.host.hopPuff();
    view.say('Golden dust! It tickles!');
    const item = rollFind(this.host.content.pack.finds ?? [], { day: this.host.clock.state.day, area: 'golden', x, y, sinceFind: TUNING.rewards.findPity });
    window.setTimeout(() => { if (item) this.found(item, x, y); }, 900);
  }

  private pip(name: string, at: number) {
    const { state, view } = this.host;
    const sparkles = TUNING.rewards.milestoneSparkles;
    state.sparkles += sparkles;
    view.feedback('chime', 'light');
    view.banner(`${name}: ${at === 0.5 ? 'halfway sparkly' : `${Math.round(at * 100)}% tidy`}! +${sparkles} ✨`);
    this.host.refreshHud();
  }
}
