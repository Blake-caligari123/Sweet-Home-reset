import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TUNING } from '../data/tuning';
import { rollFind } from './finds';

const finds = pack.finds!;
const R = TUNING.rewards;

describe('hidden finds', () => {
  it('turns up now and then, about as often as tuning says, and the same on every replay', () => {
    let hits = 0; let since = 0;
    for (let i = 0; i < 2000; i += 1) {
      const ctx = { day: 1 + (i % 30), area: 'burrow', x: i % 20, y: Math.floor(i / 20) % 10, sinceFind: since };
      const f = rollFind(finds, ctx);
      expect(rollFind(finds, ctx)).toBe(f);
      if (f) { hits += 1; since = 0; } else since += 1;
    }
    expect(hits / 2000).toBeGreaterThan(R.findChance * 0.8);
    expect(hits / 2000).toBeLessThan(1 / R.findPity * 2);
  });

  it('never makes Puff wait more than findPity cleans', () => {
    expect(rollFind(finds, { day: 3, area: 'burrow', x: 1, y: 1, sinceFind: R.findPity - 1 })).not.toBeNull();
  });

  it('only finds things where they belong (shells by the river)', () => {
    for (let i = 0; i < 3000; i += 1) {
      const f = rollFind(finds, { day: i, area: 'burrow', x: i % 7, y: 3, sinceFind: R.findPity });
      expect(['shell', 'river_stone', 'acorn', 'feather', 'pebble']).not.toContain(f);
    }
  });

  it('names every find, each a real item, and keeps the Glimmer drop rare', () => {
    for (const f of finds) expect(pack.items[f.item]?.name, f.item).toBeTruthy();
    const glimmer = finds.find((f) => f.item === 'glimmer_drop')!;
    expect(glimmer.weight).toBeLessThan(Math.min(...finds.filter((f) => f !== glimmer).map((f) => f.weight)));
  });
});
