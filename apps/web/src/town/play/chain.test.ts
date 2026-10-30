import { describe, expect, it, vi } from 'vitest';
import { TUNING } from '../data/tuning';
import { TownState } from '../state';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { chainReward, nextChain, TidyChain } from './chain';

const cleared = { type: 'cleared', mess: 'dust', area: 'burrow' } as const;

describe('tidy chains (NEXT-PHASE §5.1)', () => {
  it('grows while spots clear soon after each other, and quietly starts again after a pause', () => {
    const w = TUNING.tidyChain.windowMs;
    let c = nextChain({ count: 0, at: -Infinity }, 0);
    c = nextChain(c, w - 1);
    expect(c.count).toBe(2);
    expect(nextChain(c, c.at + w + 1).count).toBe(1);
  });

  it('pays a few Sparkles every so often, a little more each time, up to a cap', () => {
    const { every, sparkles, maxSparkles } = TUNING.tidyChain;
    expect(chainReward(every - 1)).toBe(0);
    expect(chainReward(every)).toBe(sparkles);
    expect(chainReward(every * 2)).toBe(sparkles * 2);
    expect(chainReward(every * 100)).toBe(maxSparkles);
  });

  it('cheers a chain in play from the third spot, adding its Sparkles', () => {
    let t = 0;
    const state = new TownState();
    const view = { toast: vi.fn(), feedback: vi.fn() } as unknown as View;
    const world = { sparkleBurst: vi.fn() } as unknown as World;
    const chain = new TidyChain({ state, view, world, feet: () => ({ x: 40, y: 40 }), refreshHud: () => {} }, () => (t += 500));
    for (let i = 0; i < TUNING.tidyChain.every; i++) chain.hear(cleared);
    chain.hear({ type: 'timer' });
    expect(view.toast).toHaveBeenCalledTimes(TUNING.tidyChain.every - 2);
    expect(state.sparkles).toBe(TUNING.tidyChain.sparkles);
  });
});
