import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { fishHere, reel, whichFish, type FishDef } from './fishing';

const fish: FishDef[] = [
  { id: 'minnow', areas: ['river'] },
  { id: 'trout', areas: ['river'], seasons: ['Spring'], time: 'day' },
  { id: 'moonfish', areas: ['river'], time: 'night' }
];

describe('fishing', () => {
  it('has different fish by place, season and day or night', () => {
    expect(fishHere(fish, 'river', 'Spring', 12 * 60).map((f) => f.id)).toEqual(['minnow', 'trout']);
    expect(fishHere(fish, 'river', 'Summer', 12 * 60).map((f) => f.id)).toEqual(['minnow']);
    expect(fishHere(fish, 'river', 'Spring', 22 * 60).map((f) => f.id)).toEqual(['minnow', 'moonfish']);
    expect(fishHere(fish, 'pond', 'Spring', 12 * 60)).toEqual([]);
  });

  it('picks the fish by the day and the count, never by chance', () => {
    const here = fishHere(fish, 'river', 'Spring', 12 * 60);
    expect(whichFish(here, 3, 0)).toBe(whichFish(here, 3, 0));
    expect(new Set([0, 1, 2, 3].map((n) => whichFish(here, 3, n)?.id)).size).toBe(2);
    expect(whichFish([], 3, 0)).toBeNull();
  });

  it('catches only when Reel in! comes in time', () => {
    expect(reel(1000, 900, 500)).toBe('early');
    expect(reel(1000, 1400, 500)).toBe('caught');
    expect(reel(1000, 1600, 500)).toBe('late');
  });

  it('gives every Hollowfern fishing spot something to catch, day and night', () => {
    const spots = new Set(pack.areas.filter((a) => a.props.some((p) => p.action === 'fish')).map((a) => a.id));
    expect(spots.size).toBeGreaterThan(0);
    for (const a of spots) for (const m of [12 * 60, 22 * 60]) expect(fishHere(pack.fish!, a, 'Winter', m).length, `${a} ${m}`).toBeGreaterThan(0);
    for (const f of pack.fish!) expect(pack.items[f.id]?.sell, f.id).toBeGreaterThan(0);
  });
});
