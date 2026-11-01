import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { markSpotless, meterOf, quarterPassed } from './tidy-meter';

describe('the tidy meter', () => {
  it('fills toward 100% until restored, then counts the last spots down to spotless', () => {
    expect(meterOf({ progress: 0, restored: false, remaining: 40, total: 40 })).toEqual({ kind: 'progress', pct: 0 });
    expect(meterOf({ progress: TUNING.restoreThreshold / 2, restored: false, remaining: 20, total: 40 })).toEqual({ kind: 'progress', pct: 50 });
    expect(meterOf({ progress: 1, restored: false, remaining: 0, total: 40 })).toEqual({ kind: 'progress', pct: 99 }); // never 100 until restored
    expect(meterOf({ progress: 0.97, restored: true, remaining: 3, total: 40 })).toEqual({ kind: 'left', left: 3 });
    expect(meterOf({ progress: 1, restored: true, remaining: 0, total: 40 })).toEqual({ kind: 'spotless' });
    expect(meterOf({ progress: 1, restored: false, remaining: 0, total: 0 })).toEqual({ kind: 'none' }); // the caves
  });

  it('pings each quarter once, as the bar passes it', () => {
    expect(quarterPassed(20, 26)).toBe(25); expect(quarterPassed(49, 52)).toBe(50); expect(quarterPassed(74, 80)).toBe(75);
    expect(quarterPassed(26, 30)).toBeNull(); expect(quarterPassed(48, 77)).toBe(75);
  });

  it('cheers each place once a day, and starts fresh the next morning', () => {
    const a = markSpotless({ day: 3, areas: [] }, 'lane', 3);
    expect(a).toEqual({ state: { day: 3, areas: ['lane'] }, first: true });
    expect(markSpotless(a.state, 'lane', 3).first).toBe(false);
    expect(markSpotless(a.state, 'square', 3).state.areas).toEqual(['lane', 'square']);
    expect(markSpotless(a.state, 'lane', 4)).toEqual({ state: { day: 4, areas: ['lane'] }, first: true });
  });
});

describe('the whole town spotless', () => {
  it('shines when every restored place has nothing left, and not with just one place', async () => {
    const { wholeTownSpotless } = await import('./tidy-meter');
    const left = (m: Record<string, number>) => (id: string) => m[id] ?? 0;
    expect(wholeTownSpotless(['lane', 'square'], left({}))).toBe(true);
    expect(wholeTownSpotless(['lane', 'square'], left({ square: 2 }))).toBe(false);
    expect(wholeTownSpotless(['lane'], left({}))).toBe(false);
  });
});
