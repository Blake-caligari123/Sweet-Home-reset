import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TUNING } from '../data/tuning';

describe('Hollowfern townsfolk life (pack)', () => {
  const text = pack.strings!['en-AU'];
  const areas = new Set(pack.areas.map((a) => a.id));

  it('gives every home a real place, and every neighbour a happy and a low line', () => {
    for (const n of pack.neighbours!) {
      if (n.home) expect(areas.has(n.home), n.id).toBe(true);
      const moods = pack.dialogue![n.id].filter((l) => l.mood).flatMap((l) => l.mood!);
      expect(moods, n.id).toEqual(expect.arrayContaining(['happy', 'low']));
    }
  });

  it('builds each drama from real neighbours, in turn, with every line written', () => {
    const ids = new Set(pack.neighbours!.map((n) => n.id));
    for (const d of pack.dramas ?? []) {
      for (const who of d.between) expect(ids.has(who), d.id).toBe(true);
      for (const s of d.steps) { expect(d.between, d.id).toContain(s.talkTo); expect(text[s.line], s.line).toBeTruthy(); }
      expect(text[d.banner!], d.id).toBeTruthy();
      for (const who of d.between) expect(pack.dialogue![who].some((l) => l.drama === d.id), `${who} ${d.id}`).toBe(true);
      // Never before both have arrived in town.
      for (const who of d.between) expect(d.fromDay, `${d.id} ${who}`).toBeGreaterThanOrEqual(TUNING.unlocks[who]?.day ?? 1);
    }
  });
});
