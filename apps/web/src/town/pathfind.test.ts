import { describe, expect, it } from 'vitest';
import { findPath, pathToward, retarget, standTiles, type Grid } from './pathfind';

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
    const t0 = performance.now();
    for (let i = 0; i < 50; i += 1) findPath(g, { x: 0, y: 0 }, { x: 39, y: 29 });
    expect((performance.now() - t0) / 50).toBeLessThan(2);
  });

  it('re-targets mid-step without snapping back to the last tile', () => {
    const g = grid(['.....', '.....']);
    // Puff is 70% of the way from (1,0) to (2,0) and the new goal is further right: carry on.
    const ahead = retarget(g, { x: 1, y: 0 }, { x: 2, y: 0 }, 0.7, { x: 4, y: 0 })!;
    expect(ahead).toEqual({ from: { x: 1, y: 0 }, seg: 0.7, path: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }] });
    // New goal is behind: turn around from where Puff is drawn, keeping the same on-screen spot.
    const back = retarget(g, { x: 1, y: 0 }, { x: 2, y: 0 }, 0.7, { x: 0, y: 0 })!;
    expect(back.from).toEqual({ x: 2, y: 0 });
    expect(back.seg).toBeCloseTo(0.3);
    expect(back.path).toEqual([{ x: 1, y: 0 }, { x: 0, y: 0 }]);
    const drawnX = (r: typeof back) => r.from.x + (r.path[0].x - r.from.x) * r.seg;
    expect(drawnX(back)).toBeCloseTo(1.7);
    expect(drawnX(ahead)).toBeCloseTo(1.7);
  });

  it('re-targets from a standstill as a plain path', () => {
    const g = grid(['...']);
    expect(retarget(g, { x: 0, y: 0 }, null, 0, { x: 2, y: 0 })).toEqual({ from: { x: 0, y: 0 }, seg: 0, path: [{ x: 1, y: 0 }, { x: 2, y: 0 }] });
    expect(retarget(grid(['.#.']), { x: 0, y: 0 }, null, 0, { x: 2, y: 0 })).toBeNull();
  });
});
