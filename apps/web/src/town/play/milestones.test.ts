import { describe, expect, it } from 'vitest';
import { milestoneFlag, milestoneReached, milestoneSparkles, totalTidied } from './milestones';

describe('tidying milestones', () => {
  it('counts every spot ever tidied, and cheers each milestone once', () => {
    expect(totalTidied({ finds: { cleans: { lane: 30, yard: 25 }, found: [] } })).toBe(55);
    expect(milestoneReached(49, () => false)).toBeNull();
    expect(milestoneReached(55, () => false)).toBe(50);
    expect(milestoneReached(55, (f) => f === milestoneFlag(50))).toBeNull();
    expect(milestoneReached(260, (f) => f === milestoneFlag(50))).toBe(250); // a big jump cheers the biggest one passed
    expect(milestoneSparkles(100)).toBe(20);
  });
});
