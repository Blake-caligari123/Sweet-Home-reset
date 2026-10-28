import { describe, expect, it } from 'vitest';
import { AreaMess, FULL_COLOUR, hitsFor, matchingAround } from './mess';
import { TUNING } from '../data/tuning';

const spots = [
  { type: 'dust' as const, x: 1, y: 1 }, { type: 'stain' as const, x: 3, y: 1 },
  { type: 'grime' as const, x: 5, y: 1 }, { type: 'clutter' as const, x: 7, y: 1, item: 'sock' }
];

describe('area mess', () => {
  it('takes the hits set in tuning.json at tier 1', () => {
    const m = new AreaMess(10, 4, spots, true);
    expect(m.hit(3, 1, 'sponge', 1).cleared).toBe(false);
    expect(m.hit(3, 1, 'sponge', 1).cleared).toBe(false);
    expect(m.hit(3, 1, 'sponge', 1).cleared).toBe(TUNING.messHitsTier1.stain === 3);
    expect(m.hit(1, 1, 'duster', 1).cleared).toBe(true);
  });

  it('needs the right tool and gates grime until a Copper sponge', () => {
    const m = new AreaMess(10, 4, spots, true);
    expect(m.hit(1, 1, 'sponge', 1).reason).toBe('wrong-tool');
    expect(m.hit(5, 1, 'sponge', 1).reason).toBe('tier');
    expect(m.hit(5, 1, 'sponge', 2).ok).toBe(true);
    expect(hitsFor('stain', 3)).toBe(1);
  });

  it('floods colour into the cleared tile and its neighbours, never draining it again', () => {
    const m = new AreaMess(10, 4, spots, true);
    m.hit(1, 1, 'duster', 1);
    expect(m.colour[1 * 10 + 1]).toBe(FULL_COLOUR);
    expect(m.colour[1 * 10 + 2]).toBeGreaterThan(0);
    expect(m.colour[3 * 10 + 9]).toBe(0);
  });

  it('hands clutter to the bag and restores the area at the threshold', () => {
    const m = new AreaMess(10, 4, spots, true);
    expect(m.hit(7, 1, 'hands', 1).item).toBe('sock');
    m.hit(1, 1, 'duster', 1);
    for (let i = 0; i < 3; i += 1) m.hit(3, 1, 'sponge', 1);
    expect(m.restored).toBe(false);
    for (let i = 0; i < 3; i += 1) m.hit(5, 1, 'sponge', 2);
    expect(m.progress).toBe(1);
    expect(m.restored).toBe(true);
    expect(Array.from(m.colour).every((c) => c === FULL_COLOUR)).toBe(true);
  });

  it('progress never goes down and survives a save round trip', () => {
    const m = new AreaMess(10, 4, spots, true);
    m.hit(1, 1, 'duster', 1);
    const p = m.progress;
    m.hit(1, 1, 'duster', 1);
    expect(m.progress).toBe(p);
    const copy = new AreaMess(10, 4, [], true);
    copy.load(JSON.parse(JSON.stringify(m.snapshot())));
    expect(copy.progress).toBe(p);
    expect(copy.item[7 + 10]).toBe('sock');
  });

  it('a save from a differently sized area starts it fresh, unless it was already restored', () => {
    const old = new AreaMess(10, 4, spots, true);
    old.hit(1, 1, 'duster', 1);
    const snap = JSON.parse(JSON.stringify(old.snapshot()));
    const bigger = new AreaMess(12, 5, spots, true);
    expect(() => bigger.load(snap)).toThrow();
    const done = new AreaMess(10, 4, spots, true);
    done.restore();
    const restored = new AreaMess(12, 5, spots, true);
    restored.load(JSON.parse(JSON.stringify(done.snapshot())));
    expect(restored.restored).toBe(true);
    expect(restored.progress).toBe(1);
    expect([...restored.colour].every((c) => c === FULL_COLOUR)).toBe(true);
    expect([...restored.type].every((t) => t === 0)).toBe(true);
  });
});

describe('charged swings', () => {
  it('find matching mess around a spot: two for Copper, the whole patch for Silver, never clutter', () => {
    const patch = [];
    for (let y = 0; y < 3; y += 1) for (let x = 0; x < 3; x += 1) patch.push({ type: 'dust' as const, x, y });
    const m = new AreaMess(4, 4, [...patch, { type: 'clutter' as const, x: 3, y: 1, item: 'sock' }], true);
    expect(matchingAround(m, 1, 1, 2)).toHaveLength(2);
    expect(matchingAround(m, 1, 1, 8)).toHaveLength(8);
    expect(matchingAround(m, 2, 1, 8).some((p) => p.x === 3)).toBe(false);
  });
});
