import { TUNING } from '../data/tuning';
import type { PlayEvent } from '../play/events';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { cleared, fade, NO_CHAIN } from './chain';
import { crossed } from './milestones';
import type { RewardHud } from './reward-hud';

export interface RewardsHost {
  state: TownState;
  view: View;
  hud: RewardHud;
  /** The area Puff is in: its id and name, how tidy it is, and whether there's a home bar to show. */
  here(): { id: string; name: string; progress: number; bar: boolean };
  /** A tile's centre on screen. */
  tileToScreen(x: number, y: number): { x: number; y: number };
  hopPuff(): void;
  refreshHud(): void;
}

/** The rewards overhaul (claude/REWARDS-PLAN.md): turns what Puff does into Sparkles, pips and cheer. */
export class Rewards {
  private chain = NO_CHAIN;
  /** The area and progress last seen, so a pip rings as it's passed. */
  private seen = { area: '', progress: 0 };

  constructor(private host: RewardsHost) {}

  handle(e: PlayEvent) {
    if (e.type === 'cleared') this.cleaned(e.x, e.y);
  }

  /** Each frame while play isn't held: the chain fades unless Puff is busy, and the home bar follows the area. */
  tick(dt: number, puffBusy: boolean) {
    this.chain = fade(this.chain, dt, puffBusy);
    this.host.hud.setChain(this.chain.count);
    const here = this.host.here();
    if (here.id === this.seen.area) for (const pip of crossed(this.seen.progress, here.progress)) this.pip(here.name, pip);
    this.seen = { area: here.id, progress: here.progress };
    this.host.hud.setProgress(here.name, here.progress, here.bar);
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

  private pip(name: string, at: number) {
    const { state, view } = this.host;
    const sparkles = TUNING.rewards.milestoneSparkles;
    state.sparkles += sparkles;
    view.feedback('chime', 'light');
    view.banner(`${name}: ${at === 0.5 ? 'halfway sparkly' : `${Math.round(at * 100)}% tidy`}! +${sparkles} ✨`);
    this.host.refreshHud();
  }
}
