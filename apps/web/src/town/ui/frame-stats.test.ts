import { describe, expect, it } from 'vitest';
import { FrameStats } from './frame-stats';

describe('frame stats readout', () => {
  it('reports fps, the worst frame and stalls over 100 ms, then resets', () => {
    const s = new FrameStats();
    for (let i = 0; i < 58; i += 1) s.push(1000 / 60);
    s.push(250); s.push(16);
    const a = s.take();
    expect(a.worstMs).toBe(250);
    expect(a.stalls).toBe(1);
    expect(a.fps).toBeGreaterThan(40);
    expect(s.take()).toEqual({ fps: 0, worstMs: 0, stalls: 0 });
  });
});
