import { describe, expect, it } from 'vitest';
import { DirtMap, HP } from './dirt';
import type { TaskDef } from './pack';

const tasks: TaskDef[] = [
  { type: 'scrub', id: 's', label: 'Scrub', areas: [{ x: 10, y: 10, w: 40, h: 20 }], coverage: 0.6, seed: 1 },
  { type: 'wipe', id: 'w', label: 'Wipe', surface: 'glass', areas: [{ x: 100, y: 100, w: 10, h: 10 }] },
  { type: 'pop', id: 'p', label: 'Pop', bunnies: [{ x: 1, y: 1 }] }
];

describe('dirt map', () => {
  it('generates the same mess from the same seed, and a different one from another', () => {
    const a = new DirtMap(tasks, 1); const b = new DirtMap(tasks, 1); const c = new DirtMap(tasks, 2);
    expect(Buffer.from(a.hp).equals(Buffer.from(b.hp))).toBe(true);
    expect(Buffer.from(a.hp).equals(Buffer.from(c.hp))).toBe(false);
  });

  it('dulls the whole scrub area and stains about the requested share of it', () => {
    const map = new DirtMap(tasks, 1);
    let stained = 0;
    for (let i = 0; i < map.hp.length; i += 1) {
      if (map.owner[i] !== 0) continue;
      const x = i % 180; const y = Math.floor(i / 180);
      expect(x >= 10 && x < 50 && y >= 10 && y < 30).toBe(true);
      if (map.maxHp[i] === HP.grime) stained += 1;
    }
    expect(map.total[0]).toBe(800);
    expect(stained).toBeGreaterThanOrEqual(800 * 0.6);
    expect(map.total[1]).toBe(100);
    expect(map.total[2]).toBe(0);
  });

  it('wipes glass in one pass but needs repeat passes for grime', () => {
    const map = new DirtMap(tasks, 1);
    map.stroke(95, 105, 115, 105, 8);
    expect(map.progress(1)).toBeGreaterThan(0.5);
    const once = map.stroke(10, 20, 50, 20, 8);
    expect(once.changed).toBe(true);
    expect(map.progress(0)).toBeLessThan(0.5);
    for (let pass = 0; pass < 6; pass += 1) { map.stroke(10, 14, 50, 14, 8); map.stroke(50, 24, 10, 24, 8); }
    expect(map.progress(0)).toBeGreaterThan(0.9);
  });

  it('reports a box that covers every pixel it changed, on the 1x grid', () => {
    const map = new DirtMap(tasks, 1);
    const result = map.stamp(105.4, 104.7, 3);
    expect(result.box).not.toBeNull();
    const { x, y, w, h } = result.box!;
    expect([x, y, w, h].every(Number.isInteger)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(100); expect(x + w).toBeLessThanOrEqual(110);
  });

  it('clears a whole task at once and survives a save round trip', () => {
    const map = new DirtMap(tasks, 1);
    map.stroke(10, 20, 50, 20, 8);
    const saved = map.snapshot();
    const copy = new DirtMap(tasks, 1);
    copy.restore(saved);
    expect(copy.progress(0)).toBeCloseTo(map.progress(0));
    copy.clearTask(0);
    expect(copy.progress(0)).toBe(1);
    expect(copy.hintPoint(0)).toBeNull();
  });

  it('draws dull pixels from the drained room and stains darker', () => {
    const map = new DirtMap(tasks, 1);
    const dull = new Uint8ClampedArray(180 * 390 * 4).fill(200);
    const rgba = new Uint8ClampedArray(180 * 390 * 4);
    map.paint(rgba, undefined, dull);
    let plain = -1; let stain = -1;
    for (let i = 0; i < map.hp.length; i += 1) {
      if (map.owner[i] !== 0) continue;
      if (map.maxHp[i] === HP.dull && plain < 0) plain = i;
      if (map.maxHp[i] === HP.grime && stain < 0) stain = i;
    }
    expect(rgba[plain * 4]).toBe(200);
    expect(rgba[stain * 4 + 3]).toBe(255);
    expect(rgba[stain * 4 + 1]).toBeLessThan(200);
  });

  it('paints nothing where the dirt is gone', () => {
    const map = new DirtMap(tasks, 1);
    const rgba = new Uint8ClampedArray(180 * 390 * 4);
    map.paint(rgba);
    expect(rgba[(105 * 180 + 105) * 4 + 3]).toBeGreaterThan(0);
    map.clearTask(1);
    map.paint(rgba);
    expect(rgba[(105 * 180 + 105) * 4 + 3]).toBe(0);
    expect(HP.grime).toBeGreaterThan(HP.glass);
  });
});
