import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import type { Crop } from '../state';
import { harvest, seedsIn, stageOf, type CropDef } from './crops';

const radish: CropDef = { id: 'radish', seed: 'radish_seeds', look: 'round' };
const berry: CropDef = { id: 'strawberry', seed: 'strawberry_seeds', look: 'berry' };
const grown = (crop: string, days: number): Crop => ({ area: 'yard', x: 1, y: 1, crop, days, watered: false });

describe('crops', () => {
  it('shows seed, sprout, then ready by days grown (from tuning)', () => {
    expect(stageOf(grown('radish', 0))).toBe(0);
    expect(stageOf(grown('radish', 1))).toBe(1);
    expect(stageOf(grown('radish', 3))).toBe(2);
  });

  it('a harvest takes the crop up, unless it grows back (strawberries), and never before it is ready', () => {
    const r = grown('radish', 3);
    expect(harvest(r, radish)).toBe('picked');
    expect(harvest(grown('radish', 1), radish)).toBe('growing');
    const s = grown('strawberry', 6);
    expect(harvest(s, berry)).toBe('regrows');
    expect(s.days).toBe(3);
    expect(stageOf(s)).toBe(1);
  });

  it('lists the kinds of seed in the bag, in pack order', () => {
    const bag = { count: (id: string) => ({ carrot_seeds: 2, radish_seeds: 1 } as Record<string, number>)[id] ?? 0 };
    expect(seedsIn(bag, pack.crops ?? []).map((c) => c.id)).toEqual(['radish', 'carrot']);
  });

  it('has four spring crops, each with seeds a shop sells, a harvest line, and the crop itself sellable', () => {
    const crops = pack.crops ?? [];
    expect(crops.map((c) => c.id)).toEqual(['radish', 'carrot', 'peas', 'strawberry']);
    const stock = (pack.shops ?? []).flatMap((s) => s.stock.map((e) => e.item));
    const buys = (pack.shops ?? []).flatMap((s) => s.buys ?? []);
    for (const c of crops) {
      expect(stock, c.seed).toContain(c.seed);
      expect(buys, c.id).toContain(c.id);
      expect(pack.items[c.id]?.sell, c.id).toBeGreaterThan(0);
      expect(pack.strings!['en-AU'][`crop.${c.id}.harvest`], c.id).toBeTruthy();
    }
  });
});
