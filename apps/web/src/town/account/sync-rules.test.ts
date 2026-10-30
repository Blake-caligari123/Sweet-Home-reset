import { describe, expect, it } from 'vitest';
import { saveLine, syncStep } from './sync-rules';

describe('what sync does (BACKEND-PLAN step 4: the player chooses, nothing merges)', () => {
  it('sends this device\'s save when there is no cloud copy, or the cloud is the one it last matched', () => {
    expect(syncStep(undefined, null)).toBe('send');
    expect(syncStep(4, { version: 4 })).toBe('send');
  });

  it('asks when the cloud moved on elsewhere, or this device never matched it', () => {
    expect(syncStep(4, { version: 5 })).toBe('ask');
    expect(syncStep(undefined, { version: 1 })).toBe('ask');
  });

  it('describes a save by its day, season and when it was saved', () => {
    expect(saveLine({ day: 17, savedAt: '2026-10-30T19:05:00+11:00' })).toBe('Summer 3 · 30 Oct, 7:05 pm');
  });
});
