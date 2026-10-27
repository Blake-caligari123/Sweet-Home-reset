import { describe, expect, it } from 'vitest';
import { findPath, pathToward, standTiles, type Grid } from './pathfind';

function grid(rows: string[]): Grid {
  return { w: rows[0].length, h: rows.length, walkable: (x, y) => rows[y]?.[x] === '.' };
}

describe('pathfinder', () => {
  it('finds the shortest 4-direction path around furniture and never steps on blocked tiles', () => {
    const g = grid([
      '.....',
      '.###.',
      '...#.',
      '.#...'
    ]);
    const path = findPath(g, { x: 0, y: 2 }, { x: 4, y: 3 })!;
    expect(path.length).toBe(5);
    for (const t of path) expect(g.walkable(t.x, t.y)).toBe(true);
    path.reduce((prev, t) => { expect(Math.abs(prev.x - t.x) + Math.abs(prev.y - t.y)).toBe(1); return t; }, { x: 0, y: 2 });
  });

  it('walks to the nearest reachable tile when the tap is unreachable', () => {
    const g = grid([
      '...#.',
      '...#.',
      '...#.'
    ]);
    const path = pathToward(g, { x: 0, y: 0 }, { x: 4, y: 1 });
    expect(path.at(-1)).toEqual({ x: 2, y: 1 });
  });

  it('returns no path through walls', () => {
    const g = grid(['.#.', '.#.', '.#.']);
    expect(findPath(g, { x: 0, y: 0 }, { x: 2, y: 2 })).toBeNull();
  });

  it('lists the free tiles beside a target', () => {
    const g = grid(['...', '.#.', '...']);
    expect(standTiles(g, { x: 1, y: 1 })).toHaveLength(4);
  });

  it('plans a path on a 40x30 area in well under 2 ms', () => {
    const rows = Array.from({ length: 30 }, (_, y) => Array.from({ length: 40 }, (_, x) => (x % 6 === 3 && y % 10 !== 5 ? '#' : '.')).join(''));
    const g = grid(rows);
    // Warm up first so the timing measures planning, not the JIT on a cold shared CI runner.
    for (let i = 0; i < 20; i += 1) findPath(g, { x: 0, y: 0 }, { x: 39, y: 29 });
    const t0 = performance.now();
    for (let i = 0; i < 50; i += 1) findPath(g, { x: 0, y: 0 }, { x: 39, y: 29 });
    expect((performance.now() - t0) / 50).toBeLessThan(2);
  });
});
