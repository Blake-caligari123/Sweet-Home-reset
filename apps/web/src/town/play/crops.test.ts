import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import type { Crop } from '../state';
import { grows, harvest, seedsIn, stageOf, type CropDef } from './crops';

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

  it('lists the kinds of seed in the bag that grow now, in pack order (any, under glass)', () => {
    const bag = { count: (id: string) => ({ carrot_seeds: 2, radish_seeds: 1, pumpkin_seeds: 1 } as Record<string, number>)[id] ?? 0 };
    expect(seedsIn(bag, pack.crops ?? [], 'Spring', false).map((c) => c.id)).toEqual(['radish', 'carrot']);
    expect(seedsIn(bag, pack.crops ?? [], 'Autumn', false).map((c) => c.id)).toEqual(['carrot', 'pumpkin']);
    expect(seedsIn(bag, pack.crops ?? [], 'Winter', true).map((c) => c.id)).toEqual(['radish', 'carrot', 'pumpkin']);
  });

  it('grows only in its seasons (spring if none given), or any time with a greenhouse; out of season it rests', () => {
    expect(grows(radish, 'Spring', false)).toBe(true);
    expect(grows(radish, 'Summer', false)).toBe(false);
    expect(grows(radish, 'Winter', true)).toBe(true);
    expect(grows({ ...radish, seasons: ['Summer', 'Autumn'] }, 'Autumn', false)).toBe(true);
  });

  it('plants watercress only by the river, where finished riverbank beds water it', () => {
    const crops = pack.crops ?? [];
    const bag = { count: (id: string) => (id === 'watercress_seeds' ? 3 : 0) };
    expect(seedsIn(bag, crops, 'Summer', false, 'yard')).toEqual([]);
    expect(seedsIn(bag, crops, 'Summer', false, 'riverside').map((c) => c.id)).toEqual(['watercress']);
    const beds = (pack.buildings ?? []).find((b) => b.id === 'riverbank_beds')!;
    expect([beds.paves, beds.effect]).toEqual(['s', 'waters_nearby']);
    expect((pack.plots ?? []).find((p) => p.allow.includes('riverbank_beds'))?.area).toBe('riverside');
  });

  it('has crops for spring, summer and autumn, each with seeds a shop sells that season, a harvest line, and sellable', () => {
    const crops = pack.crops ?? [];
    expect(crops.map((c) => c.id)).toEqual(['radish', 'carrot', 'peas', 'strawberry', 'tomato', 'corn', 'pumpkin', 'watercress']);
    for (const s of ['Spring', 'Summer', 'Autumn']) expect(crops.some((c) => (c.seasons ?? ['Spring']).includes(s)), s).toBe(true);
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
