import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { faceFor, newDay, tidyOne, type FamilyDef, type GrumbleState } from './grumbles';

const dust: FamilyDef = { id: 'dust', tool: 'duster', hits: 3, areas: ['lane', 'library'], unlock: 'grumble_dust' };
const spot = (area: string, k: number) => ({ x: 40 + k * 16, y: 60 });
const fresh = (): GrumbleState => ({ day: 0, list: [] });
const opts = (day: number, open = day >= 3) => ({ day, families: [dust], arrived: () => open, spot, perArea: 3, helpersMax: 12 });

describe('grumbles', () => {
  it('appear only once their family has arrived (dust from day 3), a few per area, once a day', () => {
    expect(newDay(fresh(), opts(2)).list).toEqual([]);
    const g = newDay(fresh(), opts(3));
    expect(g.day).toBe(3);
    for (const a of dust.areas) {
      const here = g.list.filter((x) => x.area === a);
      expect(here.length).toBeGreaterThanOrEqual(1);
      expect(here.length).toBeLessThanOrEqual(3);
    }
    expect(g.list.every((x) => x.state === 'grumpy' && x.hits === 0 && x.family === 'dust')).toBe(true);
    expect(newDay(g, opts(3))).toBe(g); // the same day again changes nothing (a reload)
    expect(new Set(g.list.map((x) => x.id)).size).toBe(g.list.length);
  });

  it('brightens into a helper after its family\'s tidies, never going back', () => {
    const g = newDay(fresh(), opts(3));
    const one = g.list[0];
    expect(tidyOne(one, dust)).toBe('more');
    expect(tidyOne(one, dust)).toBe('more');
    expect(tidyOne(one, dust)).toBe('friend');
    expect(one.state).toBe('helper');
    expect(tidyOne(one, dust)).toBe('done');
    expect(one.hits).toBe(3);
  });

  it('cheers up as it is tidied: droopy, then wide-eyed, then winking (Blake\'s grumpy sheet frames 1, 4, 2)', () => {
    expect([0, 1, 2].map((p) => faceFor(p, 3))).toEqual([0, 3, 1]);
    expect([0, 1, 2, 3, 4].map((p) => faceFor(p, 5))).toEqual([0, 0, 3, 3, 1]);
  });

  it('lets the untidied drift away overnight, with nothing lost, and keeps helpers (up to the cap)', () => {
    const g = newDay(fresh(), opts(3));
    const helper = g.list[0];
    for (let i = 0; i < 3; i += 1) tidyOne(helper, dust);
    const next = newDay(g, opts(4));
    expect(next.list.filter((x) => x.state === 'helper')).toEqual([helper]);
    expect(next.list.filter((x) => x.state === 'grumpy').every((x) => x.id.includes(':4:'))).toBe(true);
    const many: GrumbleState = { day: 3, list: Array.from({ length: 15 }, (_, i) => ({ ...helper, id: `h${i}` })) };
    expect(newDay(many, opts(4)).list.filter((x) => x.state === 'helper')).toHaveLength(12);
  });

  it('has the dust family in the pack, in places Puff can reach, needing tool use the copy calls tidying', () => {
    const fam = pack.grumbleFamilies ?? [];
    const d = fam.find((f) => f.id === 'dust')!;
    expect(d.hits).toBeGreaterThan(0);
    for (const a of d.areas) expect(pack.areas.some((x) => x.id === a), a).toBe(true);
    const text = pack.strings!['en-AU'];
    for (const id of ['grumble.dust.before.1', 'grumble.dust.before.2', 'grumble.dust.after.1', 'grumble.puff.first', 'grumble.puff.helper', 'grumble.hint']) expect(text[id], id).toBeTruthy();
    for (const [id, t] of Object.entries(text).filter(([k]) => k.startsWith('grumble.'))) expect(t, id).not.toMatch(/\b(combat|hit|kill|damage|attack|fight)\b/i);
  });
});
