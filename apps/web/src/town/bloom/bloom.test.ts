import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { bloomLevel, bloomPoints, bloomUp, nextFind, type FindDef } from './bloom';

describe('Town Bloom', () => {
  it('grows with restored places, builds, friendship, helpers and town jobs', () => {
    expect(bloomPoints({ restored: 0, builds: 0, hearts: 0, helpers: 0, townJobs: 0 })).toBe(0);
    expect(bloomPoints({ restored: 2, builds: 1, hearts: 3, helpers: 1, townJobs: 2 })).toBe(2 * 3 + 2 + 3 + 1 + 2);
  });

  it('reads levels from tuning, from 1, never past the top', () => {
    expect(bloomLevel(0)).toBe(1);
    expect(bloomLevel(1000)).toBe(5);
    expect(bloomLevel(5)).toBeLessThan(bloomLevel(30));
  });
});

describe('Town Bloom rising', () => {
  it('only ever rises, and says so once each time', () => {
    const s = new TownState();
    expect(bloomUp(s, 0)).toBeNull();
    expect(bloomUp(s, 2)).toBe(2);
    expect(bloomUp(s, 2)).toBeNull();
    expect(bloomUp(s, 0)).toBeNull();
    expect(s.bloom).toBe(2);
  });
});

describe('surprise finds', () => {
  const finds: FindDef[] = [{ id: 'lost_button', name: 'Lost button', areas: ['burrow'] }, { id: 'thimble', name: 'Thimble', areas: ['burrow', 'bakery'] }];

  it('turns up every few cleans in a place, each find once, in order, then no more there', () => {
    const s = { cleans: {} as Record<string, number>, found: [] as string[] };
    const got: (string | null)[] = [];
    for (let i = 0; i < 24; i += 1) got.push(nextFind(s, 'burrow', finds, 8));
    expect(got.filter(Boolean)).toEqual(['lost_button', 'thimble']);
    expect(got.indexOf('lost_button')).toBe(7);
    expect(s.found).toEqual(['lost_button', 'thimble']);
    expect(nextFind({ cleans: { bakery: 7 }, found: ['thimble'] }, 'bakery', finds, 8)).toBeNull();
  });

  it('has finds for many places, each with a name', () => {
    const f = pack.finds ?? [];
    expect(f.length).toBeGreaterThanOrEqual(8);
    const places = new Set(f.flatMap((x) => x.areas));
    for (const a of places) expect(pack.areas.some((x) => x.id === a), a).toBe(true);
    expect(places.size).toBeGreaterThanOrEqual(8);
  });
});
