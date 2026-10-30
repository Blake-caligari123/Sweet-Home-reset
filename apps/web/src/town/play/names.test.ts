import { describe, expect, it } from 'vitest';
import { hollowfern } from '../data/test-pack';
import { cleanName, DEFAULT_NAMES, NAME_MAX, withNames } from './names';

describe('names', () => {
  it('fills the name tokens in text', () => {
    expect(withNames('Hello, {puff}! Welcome to {town}.', { puff: 'Dusty', town: 'Mossbrook' })).toBe('Hello, Dusty! Welcome to Mossbrook.');
    expect(withNames('{puff}\'s burrow', DEFAULT_NAMES)).toBe('Puff\'s burrow');
    expect(withNames('No tokens here.', DEFAULT_NAMES)).toBe('No tokens here.');
  });

  it('tidies what the player types, falling back to the default', () => {
    expect(cleanName('  dusty   bun ', 'Puff')).toBe('Dusty bun');
    expect(cleanName('', 'Puff')).toBe('Puff');
    expect(cleanName('   ', 'Hollowfern')).toBe('Hollowfern');
    expect(cleanName('<b>{town}</b>', 'Puff')).toBe('Btownb');
    expect(cleanName('Bartholomew the Brave', 'Puff')).toBe('Bartholomew');
    expect(cleanName('Abcdefghijklmnop', 'Puff')).toHaveLength(NAME_MAX);
    expect(cleanName('Zoë-Mae O\'Brien', 'Puff')).toBe('Zoë-Mae O\'Br');
  });

  it('never writes Puff or the town by name in the pack, only as {puff} and {town}', () => {
    for (const [id, text] of Object.entries(hollowfern.strings!['en-AU'])) expect(text, id).not.toMatch(/\b(Puff|Hollowfern)\b/);
  });
});
