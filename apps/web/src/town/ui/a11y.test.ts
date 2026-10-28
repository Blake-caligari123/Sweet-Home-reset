import { describe, expect, it } from 'vitest';
import { applyLook } from './a11y';

describe('look settings', () => {
  it('puts each one on the page as a class, and takes it off again', () => {
    const root = { classList: new Set<string>() } as unknown as HTMLElement;
    const list = root.classList as unknown as Set<string>;
    (root.classList as unknown as { toggle(c: string, on: boolean): void }).toggle = (c, on) => { if (on) list.add(c); else list.delete(c); };
    applyLook({ reducedMotion: true, bigText: true, highContrast: false }, root);
    expect([...list].sort()).toEqual(['big-text', 'reduce-motion']);
    applyLook({ reducedMotion: false, bigText: false, highContrast: true }, root);
    expect([...list]).toEqual(['high-contrast']);
  });
});
