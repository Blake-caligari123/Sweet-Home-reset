import { describe, expect, it } from 'vitest';
import { hapticForStage } from './native';

describe('stage haptics', () => {
  it('buzzes lightly at 25, 50 and 75 percent, and celebrates at 100', () => {
    expect([1, 2, 3, 4].map(hapticForStage)).toEqual(['stage', 'stage', 'stage', 'complete']);
  });
});
