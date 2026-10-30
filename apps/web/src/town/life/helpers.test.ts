import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { AreaMess } from '../play/mess';
import { listNames, tidySome } from './helpers';

const messy = () => new AreaMess(10, 1, Array.from({ length: 10 }, (_, x) => ({ type: x === 9 ? 'clutter' : 'dust', x, y: 0 } as const)), true);

describe('neighbours helping tidy (NEXT-PHASE §5.1)', () => {
  it('tidies a few spots, never clutter', () => {
    const m = messy();
    expect(tidySome(m, 2)).toBe(2);
    expect(m.typeAt(9, 0)).toBe('clutter');
  });

  it('stops short of restoring the place: that stays Puff\'s moment', () => {
    const m = messy();
    tidySome(m, 100);
    expect(m.restored).toBe(false);
    expect(m.progress).toBeLessThan(TUNING.restoreThreshold);
  });

  it('names the helpers kindly', () => {
    expect(listNames(['Hazel'])).toBe('Hazel');
    expect(listNames(['Hazel', 'Bea'])).toBe('Hazel and Bea');
    expect(listNames(['Hazel', 'Bea', 'Pip'])).toBe('Hazel, Bea and Pip');
  });
});
