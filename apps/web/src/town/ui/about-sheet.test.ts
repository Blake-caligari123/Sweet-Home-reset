import { describe, expect, it } from 'vitest';
import { aboutLines } from './about-sheet';

describe('About', () => {
  it('names the maker and the version', () => {
    const text = aboutLines('1.2.3').join(' ');
    expect(text).toContain('PixelVortex Games');
    expect(text).toContain('1.2.3');
  });
});
