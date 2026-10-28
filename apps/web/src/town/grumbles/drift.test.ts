import { describe, expect, it } from 'vitest';
import { drift, type Drift } from './drift';

const open = { clear: () => true, pick: (from: { x: number; y: number }) => ({ x: from.x + 20, y: from.y }) };

describe('grumble drift', () => {
  it('ambles slowly toward a spot, then rests a moment', () => {
    const g = { fx: 100, fy: 100 }; const d: Drift = { to: null, waitMs: 0 };
    drift(g, d, 100, { ...open, speed: 0.012, puff: { x: 500, y: 500 }, rng: () => 0.5 });
    expect(g.fx).toBeCloseTo(101.2);
    for (let i = 0; i < 40; i += 1) drift(g, d, 100, { ...open, speed: 0.012, puff: { x: 500, y: 500 }, rng: () => 0.5 });
    expect(g.fx).toBe(120);
    expect(d.to).toBeNull();
    expect(d.waitMs).toBeGreaterThan(0);
  });

  it('drifts away from Puff when Puff comes close, never toward', () => {
    const g = { fx: 100, fy: 100 }; const d: Drift = { to: null, waitMs: 5000 };
    drift(g, d, 100, { ...open, speed: 0.012, puff: { x: 90, y: 100 }, rng: () => 0.5 });
    expect(g.fx).toBeGreaterThan(100);
  });

  it('stays put rather than drifting through walls', () => {
    const g = { fx: 100, fy: 100 }; const d: Drift = { to: null, waitMs: 0 };
    drift(g, d, 100, { clear: () => false, pick: () => null, speed: 0.012, puff: { x: 90, y: 100 }, rng: () => 0.5 });
    expect(g).toEqual({ fx: 100, fy: 100 });
  });
});
