import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { AreaMess } from './mess';
import { returningMess } from './mess-return';

const burrow = new Area(pack.areas.find((a) => a.id === 'burrow')!);
const yard = new Area(pack.areas.find((a) => a.id === 'yard')!);
const restoredMess = (a: Area) => { const m = new AreaMess(a.w, a.h, [], true); m.restored = true; return m; };
const opts = { perNight: 2, maxFresh: 4 };

describe('mess gently coming back', () => {
  it('only drifts back into places already restored, and never undoes the restore', () => {
    const untidy = new AreaMess(burrow.w, burrow.h, burrow.spots, true);
    expect(returningMess(burrow, untidy, 5, opts)).toEqual([]);
    const m = restoredMess(burrow);
    const spots = returningMess(burrow, m, 5, opts);
    expect(spots.length).toBe(2);
    m.scatter(spots);
    expect(m.restored).toBe(true);
    expect(m.progress).toBe(1);
  });

  it('is a little light mess on open floor: dust indoors, weeds outside', () => {
    expect(returningMess(burrow, restoredMess(burrow), 5, opts).every((s) => s.type === 'dust' && burrow.walkable(s.x, s.y) && !burrow.doorAt(s.x, s.y))).toBe(true);
    expect(returningMess(yard, restoredMess(yard), 5, opts).every((s) => s.type === 'weeds' && yard.walkable(s.x, s.y))).toBe(true);
  });

  it('never piles up past the cap, and differs from night to night', () => {
    const m = restoredMess(burrow);
    for (let day = 2; day < 10; day += 1) m.scatter(returningMess(burrow, m, day, opts));
    expect(m.fresh.reduce((a, b) => a + b, 0)).toBe(4);
    expect(returningMess(burrow, restoredMess(burrow), 5, opts)).not.toEqual(returningMess(burrow, restoredMess(burrow), 6, opts));
  });
});
