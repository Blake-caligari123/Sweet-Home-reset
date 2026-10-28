import { describe, expect, it } from 'vitest';
import { recognise } from './gestures';

const path = (pts: [number, number][]) => pts.map(([x, y], i) => ({ x, y, t: i * 16 }));

describe('reading a finger', () => {
  it('a small press is a tap where it started', () => {
    expect(recognise(path([[100, 100], [103, 101], [102, 99]]))).toEqual({ kind: 'tap', x: 100, y: 100 });
  });

  it('back and forth over one spot is a rub, one pass per change of direction', () => {
    const g = recognise(path([[100, 100], [130, 100], [100, 102], [131, 100], [99, 101], [128, 100]]));
    expect(g.kind).toBe('rub');
    if (g.kind === 'rub') { expect(g.passes).toBe(5); expect(Math.abs(g.x - 114)).toBeLessThan(6); }
  });

  it('a long, mostly straight move is a drag from start to end', () => {
    expect(recognise(path([[100, 100], [140, 120], [180, 140], [220, 160]]))).toEqual({ kind: 'drag', from: { x: 100, y: 100 }, to: { x: 220, y: 160 } });
  });

  it('holding still is a hold, for as long as the finger stays', () => {
    const still = [[100, 100], [101, 100], [100, 101], [101, 101]].map(([x, y], i) => ({ x, y, t: i * 200 }));
    expect(recognise(still)).toEqual({ kind: 'hold', x: 100, y: 100, ms: 600 });
    // A quick press is still a tap.
    expect(recognise(still.slice(0, 2)).kind).toBe('tap');
  });

  it('round and round a spot is a circle, one pass per loop', () => {
    const loops: [number, number][] = [];
    for (let a = 0; a <= Math.PI * 4; a += Math.PI / 8) loops.push([100 + Math.cos(a) * 24, 100 + Math.sin(a) * 24]);
    const g = recognise(path(loops));
    expect(g.kind).toBe('circle');
    if (g.kind === 'circle') { expect(g.passes).toBe(2); expect(Math.abs(g.x - 100)).toBeLessThan(4); expect(Math.abs(g.y - 100)).toBeLessThan(4); }
  });

  it('a back-and-forth rub never reads as a circle', () => {
    expect(recognise(path([[100, 100], [130, 100], [100, 102], [131, 100], [99, 101], [128, 100]])).kind).toBe('rub');
  });
});
