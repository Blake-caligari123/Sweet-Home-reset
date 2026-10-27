import { describe, expect, it } from 'vitest';
import { Combo, COMBO_BONUS_CAP } from './combo';

describe('combo', () => {
  it('reaches a milestone every 5 quick actions', () => {
    const combo = new Combo();
    const milestones = Array.from({ length: 10 }, (_, i) => combo.hit(i * 300)).filter(Boolean);
    expect(milestones).toEqual([5, 10]);
    expect(combo.bonus).toBe(2);
  });

  it('starts again after a pause, with nothing taken away', () => {
    const combo = new Combo();
    for (let i = 0; i < 5; i += 1) combo.hit(i * 100);
    expect(combo.hit(5000)).toBeNull();
    expect(combo.count).toBe(1);
    expect(combo.bonus).toBe(1);
  });

  it('caps the bonus per room', () => {
    const combo = new Combo();
    for (let i = 0; i < 200; i += 1) combo.hit(i * 10);
    expect(combo.bonus).toBe(COMBO_BONUS_CAP);
  });
});
