import { describe, expect, it } from 'vitest';
import { Fluff } from './fluff';
import { TUNING } from '../data/tuning';

describe('fluff', () => {
  it('costs the tuning amount per tool use, one more when tired', () => {
    const f = new Fluff();
    f.spend();
    expect(f.value).toBe(TUNING.fluffStart - TUNING.fluffToolUse);
    f.value = TUNING.fluffLowThreshold - 1;
    expect(f.costOf()).toBe(TUNING.fluffToolUse + 1);
  });

  it('stops tools at 0 but never goes below it', () => {
    const f = new Fluff(1);
    expect(f.spend()).toBe(false);
    expect(f.value).toBe(1);
  });

  it('refills on sleep, halves on a free doze-off, and caps snacks at max plus boost', () => {
    const f = new Fluff(10, 100, 30);
    f.eat(500);
    expect(f.value).toBe(130);
    f.doze();
    expect(f.value).toBe(100 * TUNING.dozeWakeFluffFraction);
    f.sleep();
    expect(f.value).toBe(100);
  });
});
