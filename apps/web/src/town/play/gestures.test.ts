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
});
