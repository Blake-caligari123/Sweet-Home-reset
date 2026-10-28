import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Trail } from './pets';

describe('pet trail', () => {
  it('follows a little way behind Puff, along the way Puff actually walked', () => {
    const t = new Trail(18);
    t.reset({ x: 0, y: 0 });
    expect(t.spot).toEqual({ x: 0, y: 0 });
    for (let x = 0; x <= 60; x += 2) t.push({ x, y: 0 });
    expect(t.spot.x).toBeCloseTo(42, 0);
    expect(t.spot.y).toBe(0);
    // Round a corner: the pet goes round it too, never cutting across.
    for (let y = 2; y <= 10; y += 2) t.push({ x: 60, y });
    expect(t.spot).toEqual({ x: 52, y: 0 });
  });

  it('starts beside Puff in a new area', () => {
    const t = new Trail(18);
    for (let x = 0; x <= 60; x += 2) t.push({ x, y: 0 });
    t.reset({ x: 200, y: 100 });
    expect(t.spot).toEqual({ x: 200, y: 100 });
  });
});

describe('Hollowfern pets', () => {
  it('offers the cat, the pup and the hedgehoglet, each with a name and a line', () => {
    const pets = pack.pets ?? [];
    expect(pets.map((p) => p.id)).toEqual(['cat', 'pup', 'hedgehoglet']);
    const text = pack.strings!['en-AU'];
    for (const p of pets) { expect(p.name).toBeTruthy(); expect(p.defaultName.length).toBeLessThanOrEqual(12); expect(text[p.line], p.line).toBeTruthy(); }
  });
});
