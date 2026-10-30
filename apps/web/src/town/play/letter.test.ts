import { describe, expect, it } from 'vitest';
import { MESS_TYPES } from './mess';
import { letterText } from './letter';

describe('morning letter', () => {
  it('says only what one clean shows, for every kind of mess', () => {
    for (const type of MESS_TYPES.filter((t) => t !== 'none')) {
      const text = letterText(type, 2, 'Puff');
      expect(text, type).not.toMatch(/quiet day|whole/);
      expect(text, type).toMatch(/My paws sparkle!/);
    }
  });

  it('gives a quiet day a different cosy chore on the next few mornings', () => {
    const quiet = [3, 4, 5, 6].map((day) => letterText('none', day, 'Dusty'));
    expect(new Set(quiet).size).toBe(4);
    for (const text of quiet) { expect(text).toMatch(/quiet day/); expect(text).not.toMatch(/sparkle/); expect(text).toMatch(/♥ Dusty$/); }
  });
});
