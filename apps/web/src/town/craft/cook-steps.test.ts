import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { NEED, stepsFor, turnBetween } from './cook-steps';
import type { RecipeDef } from './recipes';

const soup: RecipeDef = { id: 'soup', name: 'Soup', station: 'kitchen', makes: { item: 'soup', qty: 1 }, cost: {} };

describe('cooking with gestures', () => {
  it('chops then stirs by default, or follows the recipe', () => {
    expect(stepsFor(soup, false)).toEqual([{ gesture: 'chop', need: NEED.chop }, { gesture: 'stir', need: NEED.stir }]);
    expect(stepsFor({ ...soup, gestures: ['knead'] }, false)).toEqual([{ gesture: 'knead', need: NEED.knead }]);
  });

  it('needs just one tap a step in tap-only mode', () => {
    for (const s of stepsFor({ ...soup, gestures: ['chop', 'stir', 'knead'] }, true)) expect(s.need).toBe(1);
  });

  it('measures stirring as turns around the pot', () => {
    expect(turnBetween(0, 0, { x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(0.25);
    expect(turnBetween(0, 0, { x: 0, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(-0.25);
    expect(turnBetween(0, 0, { x: -1, y: 0.01 }, { x: -1, y: -0.01 })).toBeCloseTo(0.0032, 3);
  });

  it('only uses gestures that exist, and only in the kitchen', () => {
    for (const r of pack.recipes!) for (const g of r.gestures ?? []) { expect(Object.keys(NEED)).toContain(g); expect(r.station, r.id).toBe('kitchen'); }
  });
});
