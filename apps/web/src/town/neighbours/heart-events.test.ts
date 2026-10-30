import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Bag } from '../play/bag';
import { eventDue, stepsOf, type HeartEvent } from './heart-events';

const events = pack.heartEvents ?? [];

const ev = (id: string, hearts: number, over: Partial<HeartEvent> = {}): HeartEvent => ({
  id, neighbourId: 'hazel', hearts, trigger: { type: 'talk' }, scene: [{ speaker: 'hazel', line: `${id}.l01` }], ...over
});

describe('heart events', () => {
  const list = [ev('he_hazel_02', 2), ev('he_hazel_04', 4, { conditions: { seen: ['he_hazel_02'] } }), ev('he_bea_02', 2, { neighbourId: 'bea' })];
  const ctx = (hearts: number, flags: string[] = []) => ({ hearts, flags, minutes: 600, area: 'bakery' });

  it('fires at the right hearts for the right neighbour', () => {
    expect(eventDue(list, 'hazel', ctx(1))).toBeNull();
    expect(eventDue(list, 'hazel', ctx(2))?.id).toBe('he_hazel_02');
    expect(eventDue(list, 'bea', ctx(3))?.id).toBe('he_bea_02');
  });

  it('fires each event once, in order, never skipping one', () => {
    expect(eventDue(list, 'hazel', ctx(5))?.id).toBe('he_hazel_02');
    expect(eventDue(list, 'hazel', ctx(5, ['he_hazel_02_done']))?.id).toBe('he_hazel_04');
    expect(eventDue(list, 'hazel', ctx(5, ['he_hazel_02_done', 'he_hazel_04_done']))).toBeNull();
  });

  it('waits for its time band and place when it has one', () => {
    const morning = [ev('he_x', 2, { trigger: { type: 'talk', timeBand: ['morning'], areaId: 'bakery' } })];
    expect(eventDue(morning, 'hazel', ctx(2))?.id).toBe('he_x');
    expect(eventDue(morning, 'hazel', { ...ctx(2), minutes: 13 * 60 })).toBeNull();
    expect(eventDue(morning, 'hazel', { ...ctx(2), area: 'square' })).toBeNull();
  });

  it('remembers what Puff did: lines that depend on flags', () => {
    const e = ev('he_y', 2, { scene: [{ speaker: 'hazel', line: 'a' }, { speaker: 'hazel', line: 'b', if: { flag: 'onboard_counter_done' } }, { speaker: 'hazel', line: 'c', if: { notFlag: 'onboard_counter_done' } }] });
    expect(stepsOf(e, ['onboard_counter_done']).map((s) => 'line' in s && s.line)).toEqual(['a', 'b']);
    expect(stepsOf(e, []).map((s) => 'line' in s && s.line)).toEqual(['a', 'c']);
  });
});

describe('Hollowfern heart events', () => {
  const text = pack.strings!['en-AU'];

  it('has 2, 4, 6, 8 and 10 for every neighbour (Sorrel too), each needing the one before', () => {
    for (const { id } of pack.neighbours!) {
      // Story scenes (the Keeper welcome) play at 0 hearts and sit outside the heart arcs.
      const mine = events.filter((e) => e.neighbourId === id && e.hearts > 0);
      expect(mine.map((e) => e.hearts), id).toEqual([2, 4, 6, 8, 10]);
      mine.forEach((e, i) => { if (i) expect(e.conditions?.seen, e.id).toContain(mine[i - 1].id); });
    }
  });

  it('never holds up the heart arcs with a story scene the game plays itself (the fair thank-you)', () => {
    const ctx = { hearts: 2, flags: ['keeper_day1_done'], minutes: 9 * 60, area: 'bakery' };
    expect(eventDue(events, 'hazel', ctx)?.id).toBe('he_hazel_02');
    expect(eventDue(events, 'hazel', { ...ctx, flags: [...ctx.flags, 'festival_spring_fair'] })?.id).toBe('he_hazel_02');
  });

  it('only waits on flags the game can set (a festival finished, or another scene or reward)', () => {
    const settable = new Set([
      ...(pack.festivals ?? []).map((f) => `festival_${f.id}`),
      ...events.flatMap((e) => [`${e.id}_done`, ...(e.rewards?.flags ?? [])])
    ]);
    for (const e of events) for (const f of e.conditions?.flags ?? []) expect(settable.has(f), `${e.id} waits on ${f}`).toBe(true);
  });

  it('has Hazel name Puff the Keeper the first time they talk, once, before her 2-heart scene', () => {
    const at = (hearts: number, flags: string[]) => eventDue(events, 'hazel', { hearts, flags, minutes: 9 * 60, area: 'bakery' })?.id;
    expect(at(0, [])).toBe('keeper_day1');
    expect(at(2, [])).toBe('keeper_day1'); // an older save catches up first
    expect(at(2, ['keeper_day1_done'])).toBe('he_hazel_02');
    expect(at(0, ['keeper_day1_done'])).toBeUndefined();
    const keeper = events.find((e) => e.id === 'keeper_day1')!;
    expect(keeper.rewards?.flags).toContain('keeper_named');
    expect(text[keeper.banner!]).toContain('Keeper');
  });

  it('gives every line, choice and option text, kept short and kind', () => {
    for (const e of events) {
      for (const s of e.scene) {
        if ('line' in s) expect(text[s.line], s.line).toBeTruthy();
        else { expect(text[s.choice], s.choice).toBeTruthy(); for (const o of s.options) expect(text[o.label], o.label).toBeTruthy(); }
      }
    }
  });

  it('Hazel 2 remembers the counter request, and Hazel 10 the first-tart guest', () => {
    const h2 = events.find((e) => e.id === 'he_hazel_02')!;
    expect(stepsOf(h2, ['onboard_counter_done']).length).toBe(stepsOf(h2, []).length);
    expect(stepsOf(h2, ['onboard_counter_done']).some((s) => 'line' in s && s.if?.flag === 'onboard_counter_done')).toBe(true);
    const h10 = events.find((e) => e.id === 'he_hazel_10')!;
    const guest = (f: string) => stepsOf(h10, [f]).filter((s) => 'line' in s && s.if).map((s) => 'line' in s && s.line);
    expect(guest('first_tart_bea')).not.toEqual(guest('first_tart_pip'));
  });

  it('Moss 10 tells of things Puff really did, and Mabel 10 waits for Winter Lights', () => {
    const m10 = events.find((e) => e.id === 'he_moss_10')!;
    const told = (f: string[]) => stepsOf(m10, f).map((s) => 'line' in s && s.line);
    expect(told(['restored_bakery', 'onboard_counter_done'])).not.toEqual(told([]));
    expect(told([]).length).toBeGreaterThanOrEqual(4);
    expect(events.find((e) => e.id === 'he_mabel_10')!.conditions?.flags).toContain('festival_winter_lights');
  });

  it('Pip 6 stitches a bigger bag', () => {
    const p6 = events.find((e) => e.id === 'he_pip_06')!;
    expect(p6.rewards?.bagSlots).toBeGreaterThan(0);
    const bag = new Bag();
    const before = bag.slots.length;
    bag.add('sock');
    bag.grow(p6.rewards!.bagSlots!);
    expect(bag.slots.length).toBe(before + p6.rewards!.bagSlots!);
    expect(bag.count('sock')).toBe(1);
  });
});
