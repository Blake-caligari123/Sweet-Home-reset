import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TUNING } from '../data/tuning';
import { TownState } from '../state';
import { putOut, STALL_SLOTS, stallNight, stallPrice, stocked, takeBack, type StallState } from './stall';

describe('Puff\'s market stall', () => {
  it('holds a few kinds of thing, one at a time', () => {
    const s: StallState = { slots: [] };
    for (let i = 0; i < STALL_SLOTS; i++) expect(putOut(s, `item${i}`)).toBe(true);
    expect(putOut(s, 'one_more')).toBe(false);
    expect(putOut(s, 'item0')).toBe(true);
    expect(stocked(s)).toBe(STALL_SLOTS + 1);
    expect(takeBack(s, 'item1')).toBe(true);
    expect(s.slots.some((x) => x.id === 'item1')).toBe(false);
  });

  it('sells overnight, more as the town blooms, a little above shop prices', () => {
    const s: StallState = { slots: [{ id: 'radish', count: 20 }] };
    const r1 = stallNight(s, () => 20, 1);
    expect(r1.sold).toBe(TUNING.stall.salesBase + TUNING.stall.salesPerBloom);
    expect(r1.sparkles).toBe(r1.sold * stallPrice(20));
    expect(stallPrice(20)).toBeGreaterThan(20);
    expect(stallNight(s, () => 20, 3).sold).toBeGreaterThan(r1.sold);
  });

  it('is saved, and stands in the square', () => {
    const st = new TownState(); putOut(st.stall, 'radish');
    const again = new TownState(); again.load(JSON.parse(JSON.stringify(st.toSave())));
    expect(again.stall.slots).toEqual([{ id: 'radish', count: 1 }]);
    expect(pack.areas.find((a) => a.id === 'square')!.props.some((p) => p.action === 'stall')).toBe(true);
  });
});
