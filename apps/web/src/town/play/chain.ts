import { TUNING } from '../data/tuning';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { T } from '../world/art/texture';
import type { OnboardEvent } from './onboarding';

// Tidy chains (NEXT-PHASE §5.1, tidying 2.0): spots cleared one soon after another build a gentle
// chain, with a bigger sparkle each time and a few Sparkles every so often. It's never needed and
// nothing is lost when it ends: the next spot simply starts a new one.

export interface ChainState { count: number; at: number }

/** The chain after a spot cleared at `now` (ms): one longer if it was soon enough, else a new one. */
export function nextChain(c: ChainState, now: number): ChainState {
  return { count: now - c.at <= TUNING.tidyChain.windowMs ? c.count + 1 : 1, at: now };
}

/** Sparkles for reaching this length: some at every few spots, a little more each time, up to a cap. */
export function chainReward(count: number) {
  const { every, sparkles, maxSparkles } = TUNING.tidyChain;
  return count % every === 0 ? Math.min(maxSparkles, (count / every) * sparkles) : 0;
}

export interface ChainHost { state: TownState; view: View; world: World; feet(): { x: number; y: number }; refreshHud(): void }

/** Hears each cleared spot (through the guide) and cheers the chain as it grows. */
export class TidyChain {
  private chain: ChainState = { count: 0, at: -Infinity };

  constructor(private host: ChainHost, private now: () => number = () => performance.now()) {}

  hear(e: OnboardEvent) {
    if (e.type !== 'cleared') return;
    this.chain = nextChain(this.chain, this.now());
    const { count } = this.chain;
    if (count < 3) return;
    const { view, world, state } = this.host;
    const feet = this.host.feet();
    world.sparkleBurst(Math.floor(feet.x / T), Math.floor(feet.y / T) - 1, Math.min(30, 6 + count * 2));
    const gift = chainReward(count);
    if (gift) { state.sparkles += gift; view.feedback('chime', 'light'); this.host.refreshHud(); }
    view.toast(`Tidy chain ×${count}${gift ? `  +${gift} ✨` : ''}`);
  }
}
