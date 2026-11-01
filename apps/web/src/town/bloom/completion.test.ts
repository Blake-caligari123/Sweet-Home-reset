import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { completionParts, completionPct } from './completion';

describe('town completion', () => {
  it('starts near nothing, and counts every kind of thing to do as an equal part', () => {
    const s = new TownState();
    const parts = completionParts(s, pack);
    expect(parts.map((p) => p.id)).toEqual(['places', 'story', 'finds', 'critters', 'fish', 'harvest', 'secrets', 'friends', 'festivals']);
    expect(completionPct(parts)).toBe(0);
    expect(parts.find((p) => p.id === 'secrets')!.total).toBe(4);
  });

  it('only says 100% when every part is full, and never rounds up to it', () => {
    const full = [{ id: 'a', icon: '', label: '', have: 3, total: 3 }, { id: 'b', icon: '', label: '', have: 2, total: 2 }];
    expect(completionPct(full)).toBe(100);
    expect(completionPct([...full, { id: 'c', icon: '', label: '', have: 199, total: 200 }])).toBe(99);
  });
});
