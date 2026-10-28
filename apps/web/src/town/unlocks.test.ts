import { describe, expect, it } from 'vitest';
import { isUnlocked } from './unlocks';

const rules = { mabel: { day: 43 }, wren: { day: 29, flag: 'he_pip_08_done' }, letters: { flag: 'keeper_named' } };

describe('unlocks', () => {
  it('opens on its day and stays open', () => {
    expect(isUnlocked('mabel', { day: 42, flags: [] }, rules)).toBe(false);
    expect(isUnlocked('mabel', { day: 43, flags: [] }, rules)).toBe(true);
    expect(isUnlocked('mabel', { day: 120, flags: [] }, rules)).toBe(true);
  });

  it('waits for both the day and the story flag when a rule has both', () => {
    expect(isUnlocked('wren', { day: 30, flags: [] }, rules)).toBe(false);
    expect(isUnlocked('wren', { day: 20, flags: ['he_pip_08_done'] }, rules)).toBe(false);
    expect(isUnlocked('wren', { day: 30, flags: ['he_pip_08_done'] }, rules)).toBe(true);
    expect(isUnlocked('letters', { day: 1, flags: ['keeper_named'] }, rules)).toBe(true);
  });

  it('treats anything without a rule as open from the start', () => {
    expect(isUnlocked('hazel', { day: 1, flags: [] }, rules)).toBe(true);
  });

  it('has the year-one timings in tuning', () => {
    expect(isUnlocked('mabel', { day: 1, flags: [] })).toBe(false);
    expect(isUnlocked('mabel', { day: 43, flags: [] })).toBe(true);
  });
});
