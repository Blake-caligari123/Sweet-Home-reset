import { describe, expect, it } from 'vitest';
import { aboutLines } from './about-sheet';

describe('About', () => {
  it('credits Grok Imagine as its terms ask, names the maker and the version', () => {
    const text = aboutLines('1.2.3').join(' ');
    expect(text).toContain('Some art created with Grok Imagine');
    expect(text).toContain('PixelVortex Games');
    expect(text).toContain('1.2.3');
  });
});
