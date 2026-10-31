import { describe, expect, it, vi } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { TownState } from '../state';
import type { View } from '../ui/view';
import { cafeOrders, cafePrice, stillWanted, supply } from './cafe';
import { cafeButtons, knownDishes } from './cafe-buttons';

describe('the café', () => {
  it('wants a couple of dishes Puff can cook, the same all day', () => {
    const known = ['soup', 'fritters', 'pie'];
    const a = cafeOrders(7, known);
    expect(a).toHaveLength(TUNING.cafe.ordersPerDay);
    for (const d of a) expect(known).toContain(d);
    expect(cafeOrders(7, known)).toEqual(a);
    expect(cafeOrders(7, [])).toEqual([]);
  });

  it('crosses off what\'s supplied, and starts fresh tomorrow', () => {
    const known = ['soup', 'fritters'];
    const s = supply({ day: 0, done: [] }, 3, 'soup');
    expect(stillWanted(s, 3, known)).toEqual(['fritters']);
    expect(stillWanted(s, 4, known).length).toBe(2);
    expect(cafePrice(40)).toBeGreaterThan(40);
  });

  it('takes a dish in the keeper\'s chat for Sparkles and a thank-you note', () => {
    const state = new TownState();
    const content = new Content(pack, () => state.names);
    const view = { banner: vi.fn(), feedback: vi.fn() } as unknown as View;
    const known = knownDishes(state, content);
    expect(known.length).toBeGreaterThan(0);
    for (const d of known) state.bag.add(d);
    const keeper = pack.cafe!.keeper;
    const host = { state, content, view, day: () => 5, changed: () => {} };
    const buttons = cafeButtons(host, keeper);
    expect(buttons.length).toBe(Math.min(TUNING.cafe.ordersPerDay, known.length));
    buttons[0].onClick();
    expect(state.sparkles).toBeGreaterThan(0);
    expect(state.tokens[keeper]).toBe(1);
    expect(cafeButtons(host, keeper).length).toBe(buttons.length - 1);
    expect(cafeButtons(host, 'pip')).toEqual([]);
  });
});
