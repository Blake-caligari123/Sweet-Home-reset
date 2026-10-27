import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateTownPack } from './area';
import { Bag } from './bag';
import { eventDue, stepsOf, type HeartEvent } from './scenes';

const pack = validateTownPack(JSON.parse(readFileSync(new URL('../../public/packs-bundled/hollowfern/1/pack.json', import.meta.url), 'utf8')));
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

  it('has 2, 4, 6, 8 and 10 for each free neighbour, each needing the one before', () => {
    for (const id of ['hazel', 'bea', 'pip']) {
      const mine = events.filter((e) => e.neighbourId === id);
      expect(mine.map((e) => e.hearts), id).toEqual([2, 4, 6, 8, 10]);
      mine.forEach((e, i) => { if (i) expect(e.conditions?.seen, e.id).toContain(mine[i - 1].id); });
    }
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
