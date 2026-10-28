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

  it('counts a step done early, so doing things out of order never gets stuck', () => {
    const o = new Onboarding();
    o.handle({ type: 'stood', ground: 'rug', area: 'burrow' });
    // The sock goes away while the hint still asks for dust.
    expect(o.handle({ type: 'putaway', item: 'sock' })).toEqual([]);
    expect(o.current?.id).toBe('dust');
    for (let i = 0; i < 3; i += 1) o.handle({ type: 'cleared', mess: 'dust', area: 'burrow' });
    expect(o.current?.id).toBe('stain');
  });

  it('remembers early steps across a save', () => {
    const o = new Onboarding();
    o.handle({ type: 'putaway', item: 'sock' });
    const copy = new Onboarding(o.step, JSON.parse(JSON.stringify(o.ahead)));
    copy.handle({ type: 'stood', ground: 'rug', area: 'burrow' });
    for (let i = 0; i < 3; i += 1) copy.handle({ type: 'cleared', mess: 'dust', area: 'burrow' });
    expect(copy.current?.id).toBe('stain');
  });

  it('lets restoring the burrow finish its tidying tips (the last bits sparkle away)', () => {
    const o = new Onboarding(1);
    o.handle({ type: 'cleared', mess: 'dust', area: 'burrow' });
    const done = o.handle({ type: 'restored', area: 'burrow' });
    expect(done.map((s) => s.id)).toEqual(['dust']);
    expect(o.current?.id).toBe('sock');
    o.handle({ type: 'putaway', item: 'sock' });
    expect(o.current?.id).toBe('fluff');
    o.handle({ type: 'timer' });
    expect(o.current?.id).toBe('yard');
  });

  it('carries on into town: Hazel and her tart, the board, her counter, Bea and Pip, then bed (A6 9:00–20:00)', () => {
    const o = new Onboarding(STEPS.findIndex((x) => x.id === 'town'));
    const ids = (e: Parameters<Onboarding['handle']>[0]) => o.handle(e).map((x) => x.id);
    expect(ids({ type: 'entered', area: 'square' })).toEqual(['town']);
    const hazel = o.handle({ type: 'met', id: 'hazel' });
    expect(hazel.map((x) => x.id)).toEqual(['hazel']);
    expect(hazel[0].gift).toEqual({ tart: 1 });
    expect(ids({ type: 'ate', item: 'biscuit' })).toEqual([]);
    expect(ids({ type: 'ate', item: 'tart' })).toEqual(['eat']);
    expect(ids({ type: 'accepted', id: 'hazel_counter' })).toEqual(['board']);
    expect(ids({ type: 'jobDone', id: 'hazel_counter' })).toEqual(['counter']);
    expect(ids({ type: 'met', id: 'bea' })).toEqual([]);
    expect(ids({ type: 'met', id: 'pip' })).toEqual(['lane']);
    expect(ids({ type: 'slept' })).toEqual(['bed']);
    expect(o.done).toBe(true);
  });

  it('counts town beats done early too: Bea met on the way, the counter job taken before the tart', () => {
    const o = new Onboarding(STEPS.findIndex((x) => x.id === 'town'));
    o.handle({ type: 'met', id: 'bea' });
    o.handle({ type: 'accepted', id: 'hazel_counter' });
    o.handle({ type: 'entered', area: 'square' });
    o.handle({ type: 'met', id: 'hazel' });
    o.handle({ type: 'ate', item: 'tart' });
    expect(o.current?.id).toBe('counter');
    o.handle({ type: 'jobDone', id: 'hazel_counter' });
    o.handle({ type: 'met', id: 'pip' });
    expect(o.current?.id).toBe('bed');
  });

  it('catches up from the save, so a tip about something already done never sticks', () => {
    const o = new Onboarding(STEPS.findIndex((x) => x.id === 'hazel'));
    expect(o.catchUp({ met: [], flags: [], accepted: [] })).toEqual([]);
    const done = o.catchUp({ met: ['hazel', 'bea'], flags: [], accepted: ['hazel_counter'] });
    expect(done.map((x) => x.id)).toEqual(['hazel']);
    expect(o.current?.id).toBe('eat');
    o.handle({ type: 'ate', item: 'tart' });
    expect(o.current?.id).toBe('counter');
    // Catching up again never counts the same neighbour twice.
    o.catchUp({ met: ['hazel', 'bea'], flags: ['onboard_counter_done'], accepted: [] });
    o.catchUp({ met: ['hazel', 'bea'], flags: ['onboard_counter_done'], accepted: [] });
    expect(o.current?.id).toBe('lane');
    o.catchUp({ met: ['hazel', 'bea', 'pip'], flags: ['onboard_counter_done'], accepted: [] });
    expect(o.current?.id).toBe('bed');
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
