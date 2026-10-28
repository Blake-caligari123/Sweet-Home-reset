import { describe, expect, it } from 'vitest';
import { tilesAlong } from './sweep';

describe('sweeping', () => {
  it('finds the messy tiles along a swipe, in the order the finger went, each once', () => {
    const messy = new Set(['2,1', '4,1', '6,1', '4,3']);
    const has = (x: number, y: number) => messy.has(`${x},${y}`);
    expect(tilesAlong({ x: 8, y: 24 }, { x: 120, y: 24 }, has)).toEqual([{ x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }]);
    expect(tilesAlong({ x: 120, y: 24 }, { x: 8, y: 24 }, has)).toEqual([{ x: 6, y: 1 }, { x: 4, y: 1 }, { x: 2, y: 1 }]);
    expect(tilesAlong({ x: 8, y: 8 }, { x: 120, y: 8 }, has)).toEqual([]);
  });
});
