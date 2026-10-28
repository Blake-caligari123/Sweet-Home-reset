import { describe, expect, it } from 'vitest';
import { crossed } from './milestones';

describe('home progress pips', () => {
  it('rings each pip once, as progress passes it', () => {
    expect(crossed(0.2, 0.26)).toEqual([0.25]);
    expect(crossed(0.26, 0.3)).toEqual([]);
    expect(crossed(0.49, 0.8)).toEqual([0.5, 0.75]);
    expect(crossed(0.8, 0.96)).toEqual([]);
  });
});
