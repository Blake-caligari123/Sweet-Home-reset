import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TUNING } from '../data/tuning';
import { sniff, Trail, type Pet, type PetDef } from './pets';

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
    // A default name never belongs to someone in the story (Sorrel's sister is Bramble).
    const story = Object.values(text).join(' ');
    for (const p of pets) expect(story, p.defaultName).not.toMatch(new RegExp(`\\b${p.defaultName}\\b`));
  });
});

describe('the pet\'s help', () => {
  const cat: PetDef = { id: 'cat', name: 'Cat', defaultName: 'Mochi', line: '', finds: ['twig', 'shell'] };
  it('sniffs something out the first time Puff goes somewhere each day, a few times a day', () => {
    const pet: Pet = { kind: 'cat', name: 'Mochi', day: 4 };
    const per = 2;
    expect(cat.finds).toContain(sniff(pet, cat, 'yard', 5, per));
    expect(sniff(pet, cat, 'yard', 5, per)).toBeNull();
    expect(sniff(pet, cat, 'square', 5, per)).not.toBeNull();
    expect(sniff(pet, cat, 'lane', 5, per)).toBeNull();
    expect(sniff(pet, cat, 'yard', 6, per)).not.toBeNull();
  });

  it('gives each Hollowfern pet things it can find, that really exist', () => {
    for (const p of pack.pets!) {
      expect(p.finds?.length, p.id).toBeGreaterThan(0);
      for (const i of p.finds!) expect(pack.items[i], i).toBeTruthy();
    }
    expect(TUNING.petFindsPerDay).toBeGreaterThan(0);
  });
});
