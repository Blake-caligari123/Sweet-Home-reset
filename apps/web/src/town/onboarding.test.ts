import { describe, expect, it } from 'vitest';
import { Onboarding, STEPS } from './onboarding';

describe('onboarding', () => {
  it('walks through the A6 beats in order', () => {
    const o = new Onboarding();
    expect(o.handle({ type: 'stood', ground: 'wood', area: 'burrow' })).toEqual([]);
    expect(o.handle({ type: 'stood', ground: 'rug', area: 'burrow' })[0].id).toBe('walk');
    o.handle({ type: 'cleared', mess: 'dust', area: 'burrow' });
    o.handle({ type: 'cleared', mess: 'dust', area: 'burrow' });
    expect(o.current?.id).toBe('dust');
    o.handle({ type: 'cleared', mess: 'dust', area: 'burrow' });
    expect(o.current?.id).toBe('sock');
    const done = [o.handle({ type: 'putaway', item: 'sock' }), o.handle({ type: 'cleared', mess: 'stain', area: 'burrow' })].flat();
    expect(done.map((s) => s.id)).toEqual(['sock', 'stain']);
    expect(done[1].grant).toEqual(['sponge']);
  });

  it('can be skipped only after the first clean, handing over what it would have given', () => {
    const o = new Onboarding();
    expect(o.skippable).toBe(false);
    o.step = 2;
    expect(o.skippable).toBe(true);
    const rest = o.skip();
    expect(rest.flatMap((s) => s.grant ?? [])).toEqual(expect.arrayContaining(['rake', 'can']));
    expect(o.done).toBe(true);
  });

  it('every hint stays short', () => {
    for (const s of STEPS) expect(s.hint.length).toBeLessThanOrEqual(60);
  });
});
