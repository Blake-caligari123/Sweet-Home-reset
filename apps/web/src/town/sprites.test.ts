import { describe, expect, it } from 'vitest';
import { blinkClip, BREATH_MS, BREATH_RISE, breathScale, HOP_LIFT, puffClip } from './sprites';

const have = (...names: string[]) => (n: string) => names.includes(n);

describe('Puff sprite clips', () => {
  it('stays code-drawn until a sheet arrives', () => {
    for (const pose of ['walk', 'idle', 'swing', 'sleep', 'hop'] as const) expect(puffClip('down', pose, have())).toBeNull();
  });

  it('walks left by mirroring the right sheet', () => {
    expect(puffClip('left', 'walk', have('puff_walk_right'))).toEqual({ name: 'puff_walk_right', mirror: true });
    expect(puffClip('right', 'walk', have('puff_walk_right'))).toEqual({ name: 'puff_walk_right', mirror: false });
    expect(puffClip('up', 'walk', have('puff_walk_right'))).toBeNull();
  });

  it('idles on the first walk frame until the idle sheet lands', () => {
    expect(puffClip('down', 'idle', have('puff_walk_down'))).toEqual({ name: 'puff_walk_down', mirror: false, hold: 0 });
    expect(puffClip('down', 'idle', have('puff_walk_down', 'puff_idle_down'))).toEqual({ name: 'puff_idle_down', mirror: false });
  });

  it('falls back from swing and hop to idle, and lifts Puff for the hop', () => {
    expect(puffClip('up', 'swing', have('puff_idle_up'))).toEqual({ name: 'puff_idle_up', mirror: false });
    expect(puffClip('left', 'swing', have('puff_swing_right'))).toEqual({ name: 'puff_swing_right', mirror: true });
    expect(puffClip('down', 'swing', have('puff_swing_down', 'puff_swing_sponge_down'), 'sponge')).toEqual({ name: 'puff_swing_sponge_down', mirror: false, withTool: true });
    expect(puffClip('down', 'swing', have('puff_swing_down', 'puff_swing_sponge_down'), 'duster')).toEqual({ name: 'puff_swing_down', mirror: false });
    expect(puffClip('down', 'hop', have('puff_hop'))).toEqual({ name: 'puff_hop', mirror: false, lift: HOP_LIFT });
    expect(puffClip('down', 'hop', have('puff_idle_down'))?.name).toBe('puff_idle_down');
  });

  it('only dozes with the doze sheet (eyes closed), and blinks per facing', () => {
    expect(puffClip('down', 'sleep', have('puff_walk_down', 'puff_idle_down'))).toBeNull();
    expect(puffClip('down', 'sleep', have('puff_doze'))?.name).toBe('puff_doze');
    expect(blinkClip('left', have('puff_blink_right'))).toEqual({ name: 'puff_blink_right', mirror: true });
    expect(blinkClip('up', have('puff_blink_down'))).toBeNull();
  });

  it('breathes visibly but gently: up to 3.5% taller mid-breath, back to rest each cycle', () => {
    expect(breathScale(0)).toEqual([1, 1]);
    const [x, y] = breathScale(BREATH_MS / 2);
    expect(y).toBeCloseTo(1 + BREATH_RISE);
    expect(x).toBeLessThan(1);
    expect(breathScale(BREATH_MS)[1]).toBeCloseTo(1);
    // 3.5% of a 28 px Puff is about 1 world pixel: enough to read as breathing on a phone.
    expect(28 * BREATH_RISE).toBeGreaterThanOrEqual(0.95);
  });
});
