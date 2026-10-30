import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { TownState } from '../state';
import { earnToken, tokensOf, trade, type ThanksDef } from './tokens';

const bread: ThanksDef = { item: 'bread', qty: 2, tokens: 2 };

describe('thank-you notes (neighbour tokens)', () => {
  it('are earned one per job, per neighbour, and saved', () => {
    const s = new TownState();
    earnToken(s, 'hazel'); earnToken(s, 'hazel'); earnToken(s, 'bea');
    expect([tokensOf(s, 'hazel'), tokensOf(s, 'bea'), tokensOf(s, 'pip')]).toEqual([2, 1, 0]);
    const again = new TownState(); again.load(JSON.parse(JSON.stringify(s.toSave())));
    expect(again.tokens).toEqual({ hazel: 2, bea: 1 });
  });

  it('trade for something special, all or nothing', () => {
    const s = new TownState();
    expect(trade(s, 'hazel', bread)).toBe(false);
    earnToken(s, 'hazel'); earnToken(s, 'hazel');
    expect(trade(s, 'hazel', bread)).toBe(true);
    expect([tokensOf(s, 'hazel'), s.bag.count('bread')]).toEqual([0, 2]);
  });

  it('every Hollowfern neighbour offers real things', () => {
    for (const n of pack.neighbours!) {
      expect(n.thanks?.length, n.id).toBeGreaterThan(0);
      for (const t of n.thanks!) { expect(pack.items[t.item], t.item).toBeTruthy(); expect(t.tokens).toBeGreaterThan(0); }
    }
  });
});
