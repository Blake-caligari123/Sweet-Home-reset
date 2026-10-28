import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { earned, newlyEarned, type OutfitDef } from './outfits';

const bow: OutfitDef = { id: 'bow', name: 'Peach bow', hint: 'Restore your burrow', earn: { flag: 'restored_burrow' } };
const crown: OutfitDef = { id: 'crown', name: 'Flower crown', hint: 'Town Bloom 2', earn: { bloom: 2 } };
const clip: OutfitDef = { id: 'clip', name: 'Star clip', hint: 'Find 4 treasures', earn: { finds: 4 } };

describe('outfits', () => {
  it('are earned by playing: a story moment, Town Bloom, or finds', () => {
    const s = new TownState();
    expect([bow, crown, clip].map((o) => earned(s, o))).toEqual([false, false, false]);
    s.flag('restored_burrow'); s.bloom = 2; s.finds.found = ['a', 'b', 'c', 'd'];
    expect([bow, crown, clip].map((o) => earned(s, o))).toEqual([true, true, true]);
  });

  it('tells about each new outfit once', () => {
    const s = new TownState();
    expect(newlyEarned(s, [bow, crown])).toEqual([]);
    s.flag('restored_burrow');
    expect(newlyEarned(s, [bow, crown]).map((o) => o.id)).toEqual(['bow']);
    expect(newlyEarned(s, [bow, crown])).toEqual([]);
  });

  it('has ten to earn (one from each festival), each with a name and a hint, and none for sale', () => {
    const o = pack.outfits ?? [];
    expect(o.length).toBe(10);
    for (const x of o) { expect(x.name).toBeTruthy(); expect(x.hint).toBeTruthy(); expect(Object.keys(x.earn).length).toBeGreaterThan(0); }
    const sold = (pack.shops ?? []).flatMap((sh) => sh.stock.map((e) => e.item));
    for (const x of o) expect(sold).not.toContain(x.id);
  });
});
