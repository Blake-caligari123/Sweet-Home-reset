import { describe, expect, it } from 'vitest';
import { Puff } from './puff';

describe('Puff walking', () => {
  it('walks the waypoints at its speed, noting each new tile, and says when it has arrived', () => {
    const p = new Puff();
    p.fx = 8; p.fy = 8; p.x = 0; p.y = 0;
    p.path = [{ x: 40, y: 8 }];
    const tiles: number[] = [];
    expect(p.walk(100, 0.16, () => tiles.push(p.x))).toBe(false);
    expect(p.fx).toBeCloseTo(24);
    expect(p.pose).toBe('walk');
    expect(p.dir).toBe('right');
    expect(p.walk(100, 0.16, () => tiles.push(p.x))).toBe(true);
    expect(p.fx).toBe(40);
    expect(p.pose).toBe('idle');
    expect(tiles).toEqual([1, 2]);
    expect(p.walk(100, 0.16, () => {})).toBe(false); // already there
  });
});
