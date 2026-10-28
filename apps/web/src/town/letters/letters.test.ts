import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { lettersWaiting, readFlag, type LetterDef } from './letters';

const l1: LetterDef = { id: 'mabel_1', from: 'mabel', day: 10, area: 'square', x: 17, y: 12, lines: ['a'], replies: [{ label: 'r1', flag: 'f1' }] };
const l2: LetterDef = { ...l1, id: 'mabel_2', day: 13 };

describe('bottle letters', () => {
  it('wash up on their day, one at a time in order, until read', () => {
    expect(lettersWaiting([l1, l2], 9, [])).toEqual([]);
    expect(lettersWaiting([l1, l2], 10, []).map((l) => l.id)).toEqual(['mabel_1']);
    expect(lettersWaiting([l1, l2], 14, []).map((l) => l.id)).toEqual(['mabel_1']); // the first still unread
    expect(lettersWaiting([l1, l2], 14, [readFlag(l1)]).map((l) => l.id)).toEqual(['mabel_2']);
    expect(lettersWaiting([l1, l2], 14, [readFlag(l1), readFlag(l2)])).toEqual([]);
  });

  it("has Mabel's letters from day 10 to before she is met (day 43), each with text and replies", () => {
    const letters = pack.letters ?? [];
    expect(letters.length).toBeGreaterThanOrEqual(4);
    expect(letters[0].day).toBe(10);
    expect(letters[0].gives).toContain('cave_leaf_1');
    const text = pack.strings!['en-AU'];
    for (const l of letters) {
      expect(l.day).toBeLessThan(43);
      for (const id of l.lines) expect(text[id], id).toBeTruthy();
      for (const r of l.replies) expect(text[r.label], r.label).toBeTruthy();
    }
  });
});
