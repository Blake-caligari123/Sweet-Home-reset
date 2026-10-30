import { describe, expect, it } from 'vitest';
import { stickPull, stickTarget } from './stick';

describe('the on-screen stick', () => {
  it('ignores a small wobble, and pulls up to full strength at the rim', () => {
    expect(stickPull(3, 2, 50)).toBeNull();
    expect(stickPull(50, 0, 50)).toMatchObject({ x: 1, y: 0, dir: 'right' });
    expect(stickPull(0, -200, 50)).toMatchObject({ x: 0, y: -1, dir: 'up' });
    const half = stickPull(0, 25, 50)!;
    expect(half.y).toBeCloseTo(0.5);
    expect(half.dir).toBe('down');
  });

  it('heads a short way along the pull, sliding along a wall when straight on is blocked', () => {
    const open = () => true;
    expect(stickTarget({ x: 100, y: 100 }, { x: 1, y: 0 }, 16, open)).toEqual({ x: 116, y: 100 });
    // A wall to the right: a diagonal pull slides down instead.
    const wallRight = (_a: unknown, b: { x: number; y: number }) => b.x <= 100;
    const t = stickTarget({ x: 100, y: 100 }, { x: 0.7, y: 0.7 }, 16, wallRight)!;
    expect(t.x).toBe(100);
    expect(t.y).toBeGreaterThan(100);
    expect(stickTarget({ x: 100, y: 100 }, { x: 1, y: 0 }, 16, () => false)).toBeNull();
  });
});
