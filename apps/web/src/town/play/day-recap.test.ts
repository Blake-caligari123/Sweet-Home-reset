import { describe, expect, it } from 'vitest';
import { emptyTally, recapLine, tallyHear } from './day-recap';

describe('the day recap', () => {
  it('sums up only what happened, with ones and many', () => {
    let t = emptyTally();
    for (let i = 0; i < 12; i += 1) t = tallyHear(t, { type: 'cleared', mess: 'dust', area: 'lane' });
    t = tallyHear(t, { type: 'caught', fish: 'minnow' });
    t = tallyHear(t, { type: 'entered', area: 'yard' }); // not a thing to count
    expect(recapLine(t, 1, 85)).toBe('🧹 12 spots tidied · ✨ 1 place spotless · 🐟 1 fish · +85 ✨');
    expect(recapLine(emptyTally(), 0, 0)).toBeNull(); // a quiet day is fine
  });
});
