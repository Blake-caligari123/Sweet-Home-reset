import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import type { FindDef, Finds } from './bloom';
import { findsFor, setDone, showFind } from './finds';

const defs: FindDef[] = [
  { id: 'coin', name: 'Old coin', areas: ['square'], owner: 'moss' },
  { id: 'button', name: 'Lost button', areas: ['burrow'], owner: 'hazel' },
  { id: 'thimble', name: 'Tiny thimble', areas: ['bakery'] }
];

describe('finds (Blake: a section and a use)', () => {
  it('offers each found thing to its owner, once', () => {
    let s: Finds = { cleans: {}, found: ['coin', 'thimble'], shown: [] };
    expect(findsFor(defs, s, 'moss').map((f) => f.id)).toEqual(['coin']);
    expect(findsFor(defs, s, 'hazel')).toEqual([]);
    s = showFind(s, 'coin');
    expect(findsFor(defs, s, 'moss')).toEqual([]);
    expect(s.shown).toEqual(['coin']);
  });

  it('knows when the whole set is found', () => {
    expect(setDone(defs, { cleans: {}, found: ['coin', 'button'] })).toBe(false);
    expect(setDone(defs, { cleans: {}, found: ['coin', 'button', 'thimble'] })).toBe(true);
  });

  it('gives every find in the pack a story, and every owned one an owner who exists and a thank-you', () => {
    const text = pack.strings!['en-AU'];
    const people = new Set(pack.neighbours!.map((n) => n.id));
    for (const f of pack.finds!) {
      expect(text[`find.${f.id}.about`], f.id).toBeTruthy();
      if (f.owner) { expect(people.has(f.owner), f.id).toBe(true); expect(text[`find.${f.id}.owner`], f.id).toBeTruthy(); }
    }
    expect(pack.finds!.filter((f) => f.owner).length).toBeGreaterThanOrEqual(6);
  });
});
