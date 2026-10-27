import { describe, expect, it } from 'vitest';
import { CELL, NavGrid, pointInPoly, type Pt } from './nav';

const rect = (x0: number, y0: number, x1: number, y1: number) => [x0, y0, x1, y0, x1, y1, x0, y1];
/** An open room 160×96 world px with a 32×32 block in the middle. */
const room = () => NavGrid.fromPolygons(160, 96, [rect(0, 0, 160, 96)], [rect(64, 32, 96, 64)], 1);

describe('free-movement nav grid', () => {
  it('knows when a point is inside a polygon', () => {
    expect(pointInPoly(5, 5, rect(0, 0, 10, 10))).toBe(true);
    expect(pointInPoly(15, 5, rect(0, 0, 10, 10))).toBe(false);
    expect(pointInPoly(2, 6, [0, 0, 10, 0, 0, 10])).toBe(true); // triangle
    expect(pointInPoly(8, 8, [0, 0, 10, 0, 0, 10])).toBe(false);
  });

  it('keeps Puff a little clear of blockers but lets them get close', () => {
    const g = room();
    expect(g.openAt(80, 48)).toBe(false); // inside the block
    expect(g.openAt(62, 48)).toBe(false); // within the clearance
    expect(g.openAt(58, 48)).toBe(true); // right up beside it
  });

  it('walks in a straight line across open floor', () => {
    const g = room();
    const path = g.findPathTo({ x: 10, y: 10 }, { x: 150, y: 14 })!;
    expect(path).toHaveLength(1);
    expect(path[0]).toEqual({ x: 150, y: 14 });
  });

  it('goes around a blocker, never through it', () => {
    const g = room();
    const path = g.findPathTo({ x: 30, y: 48 }, { x: 130, y: 48 })!;
    expect(path.length).toBeGreaterThan(1);
    let prev: Pt = { x: 30, y: 48 };
    for (const p of path) {
      for (let t = 0; t <= 1; t += 0.02) expect(g.openAt(prev.x + (p.x - prev.x) * t, prev.y + (p.y - prev.y) * t)).toBe(true);
      prev = p;
    }
    expect(path.at(-1)).toEqual({ x: 130, y: 48 });
  });

  it('walks to the nearest open spot when the target is blocked', () => {
    const g = room();
    const path = g.findPathTo({ x: 20, y: 48 }, { x: 70, y: 48 })!;
    const end = path.at(-1)!;
    expect(g.openAt(end.x, end.y)).toBe(true);
    expect(end.x).toBeLessThan(64);
    expect(Math.abs(end.y - 48)).toBeLessThanOrEqual(CELL * 2);
  });

  it('can stop within reach of a target on the near side', () => {
    const g = room();
    const target = { x0: 64, y0: 32, x1: 96, y1: 64 };
    const path = g.findPathNear({ x: 150, y: 48 }, target, 10)!;
    const end = path.at(-1)!;
    expect(end.x).toBeGreaterThan(96);
    expect(end.x - 96).toBeLessThanOrEqual(10);
  });

  it('builds the grid from tiles for code-drawn areas', () => {
    const g = NavGrid.fromTiles(3, 2, (x, y) => !(x === 1 && y === 0), 0);
    expect(g.openAt(8, 8)).toBe(true);
    expect(g.openAt(24, 8)).toBe(false);
    expect(g.openAt(24, 24)).toBe(true);
  });

  it('plans across a whole area quickly', () => {
    const blockers = [];
    for (let x = 40; x < 460; x += 60) blockers.push(rect(x, 20, x + 12, 320));
    const g = NavGrid.fromPolygons(480, 352, [rect(0, 0, 480, 352)], blockers, 1);
    const t0 = performance.now();
    for (let i = 0; i < 10; i += 1) expect(g.findPathTo({ x: 5, y: 5 }, { x: 475, y: 345 })).not.toBeNull();
    // Generous so shared CI machines never flake; locally this is a few ms.
    expect((performance.now() - t0) / 10).toBeLessThan(50);
  });
});
