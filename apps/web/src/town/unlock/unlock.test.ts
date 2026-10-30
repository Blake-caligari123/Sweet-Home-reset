import { describe, expect, it } from 'vitest';
import { TUNING } from '../data/tuning';
import { resolveBuilds, type BuildingDef } from '../build/build';
import { regrow } from '../caves/caves';
import { offerTonight, restNight, restsTonight } from './unlock';

describe('the free first spring (VISION §10)', () => {
  const last = TUNING.freeDays;

  it('lets every night pass while the full game is owned, or when no store is set up', () => {
    expect(restsTonight(last, { owned: true, gate: true })).toBe(false);
    expect(restsTonight(last, { owned: false, gate: false })).toBe(false);
  });

  it('rests at the end of the free spring, never before it', () => {
    expect(restsTonight(last - 1, { owned: false, gate: true })).toBe(false);
    expect(restsTonight(last, { owned: false, gate: true })).toBe(true);
  });

  it('offers the postcard on the first rest night, then once a week of nights, never in between', () => {
    const shown = [1, 2, 3, 7, 8, 9, 15].filter(offerTonight);
    expect(shown).toEqual([1, 1 + TUNING.unlockOfferRepeatNights, 1 + 2 * TUNING.unlockOfferRepeatNights].filter((n) => n <= 15));
  });

  it('lets time pass on a rest night for builds and cave rocks, without touching anything else', () => {
    const state = { plots: { a: { buildingId: 'bench', stage: 0, startedDay: 14, readyDay: 16 }, b: { buildingId: 'lamp', stage: 2, startedDay: 8, readyDay: 10 } }, caves: { mined: ['r1'], resetDay: 20 }, sparkles: 5 };
    restNight(state);
    expect(state.plots.a.readyDay).toBe(15);
    expect(state.plots.b.readyDay).toBe(10);
    expect(state.caves.resetDay).toBe(19);
    expect(state.sparkles).toBe(5);
  });

  it('finishes a two-night build after two rest nights, and brings rocks back after a week of them', () => {
    const day = TUNING.freeDays;
    const bench = { id: 'cottage', name: 'Cottage', nights: 2, cost: { sparkles: 0 }, prop: { type: 'cottage' } } as BuildingDef;
    const state = { plots: { a: { buildingId: 'cottage', stage: 0, startedDay: day, readyDay: day + 2 } }, caves: { mined: ['r1'], resetDay: day + 7 } };
    const night = () => { restNight(state); const done = resolveBuilds(state.plots, [bench], day - 1); regrow(state.caves, day); return done; };
    expect(night()).toEqual([]);
    expect(night()).toEqual(['a']);
    for (let n = 3; n <= 7; n += 1) night();
    expect(state.caves.mined).toEqual([]);
  });
});
