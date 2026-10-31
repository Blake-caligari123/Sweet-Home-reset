import { describe, expect, it } from 'vitest';
import { startBuild, type BuildingDef, type PlotDef } from '../build/build';
import { TownState } from '../state';
import { overnight } from './overnight';
import { TUNING } from '../data/tuning';

const bench: BuildingDef = { id: 'bench', name: 'Bench', nights: 1, cost: { sparkles: 40 }, prop: { type: 'bench', w: 2 } };
const plot: PlotDef = { id: 'p1', name: 'By the fountain', area: 'square', x: 14, y: 13, w: 2, h: 1, allow: ['bench'] };

describe('overnight', () => {
  for (const dozed of [false, true]) {
    it(`finishes a build and grows watered crops after ${dozed ? 'dozing off' : 'bedtime'}`, () => {
      const s = new TownState();
      s.sparkles = 100;
      startBuild(s, plot, bench, 2);
      s.crops = [{ area: 'yard', x: 1, y: 1, crop: 'radish', days: 0, watered: true }, { area: 'yard', x: 2, y: 1, crop: 'radish', days: 0, watered: false }];
      expect(overnight(s, { buildings: [bench], plots: [plot] }, 2, dozed)).toEqual([bench]);
      expect(s.plots.p1.stage).toBe(2);
      expect(s.crops.map((c) => [c.days, c.watered])).toEqual([[1, false], [0, false]]);
      expect(s.fluff.value).toBeGreaterThan(0);
    });
  }

  it('a finished greenhouse waters every crop in its area overnight', () => {
    const greenhouse: BuildingDef = { id: 'greenhouse', name: 'Greenhouse', nights: 1, cost: { sparkles: 0 }, prop: { type: 'greenhouse', w: 3, h: 3 }, effect: 'waters_garden' };
    const gp: PlotDef = { id: 'g1', name: 'By the garden', area: 'yard', x: 10, y: 11, w: 3, h: 3, allow: ['greenhouse'] };
    const s = new TownState();
    startBuild(s, gp, greenhouse, 1);
    s.crops = [{ area: 'yard', x: 3, y: 11, crop: 'radish', days: 0, watered: false }, { area: 'square', x: 1, y: 1, crop: 'radish', days: 0, watered: false }];
    const pack = { buildings: [greenhouse], plots: [gp] };
    overnight(s, pack, 1, false); // it finishes this night: no watering yet
    expect(s.crops.map((c) => c.days)).toEqual([0, 0]);
    overnight(s, pack, 2, false);
    expect(s.crops.map((c) => c.days)).toEqual([1, 0]);
  });

  it('a finished well starts the crops near it watered each morning, not ones further off', () => {
    const well: BuildingDef = { id: 'well', name: 'Well', nights: 1, cost: { sparkles: 0 }, prop: { type: 'well' }, effect: 'waters_nearby' };
    const wp: PlotDef = { id: 'w1', name: 'Beside the garden', area: 'yard', x: 5, y: 8, w: 1, h: 1, allow: ['well'] };
    const s = new TownState();
    startBuild(s, wp, well, 1);
    const reach = TUNING.wellReach;
    s.crops = [{ area: 'yard', x: 5 + reach, y: 8 + reach, crop: 'radish', days: 0, watered: false }, { area: 'yard', x: 5, y: 9 + reach, crop: 'radish', days: 0, watered: false }, { area: 'square', x: 5, y: 9, crop: 'radish', days: 0, watered: false }];
    const pack = { buildings: [well], plots: [wp] };
    overnight(s, pack, 1, false); // it finishes this night
    overnight(s, pack, 2, false);
    expect(s.crops.map((c) => c.watered)).toEqual([true, false, false]);
    overnight(s, pack, 3, false);
    expect(s.crops.map((c) => c.days)).toEqual([1, 0, 0]);
  });

  it('lets the rain water every outdoor crop for the day ahead, not indoor ones', () => {
    const s = new TownState();
    s.crops = [{ area: 'yard', x: 1, y: 1, crop: 'radish', days: 0, watered: false }, { area: 'greenhouse_in', x: 1, y: 1, crop: 'radish', days: 0, watered: false }];
    overnight(s, { buildings: [], plots: [], outdoor: new Set(['yard']) }, 8, false, true);
    expect(s.crops.map((c) => c.watered)).toEqual([true, false]);
    overnight(s, { buildings: [], plots: [], outdoor: new Set(['yard']) }, 9, false, false);
    expect(s.crops.map((c) => [c.days, c.watered])).toEqual([[1, false], [0, false]]);
  });

  it('rests crops out of their season (no growing, nothing lost), unless a greenhouse stands there', () => {
    const s = new TownState();
    s.crops = [{ area: 'yard', x: 1, y: 1, crop: 'radish', days: 1, watered: true }];
    const crops = [{ id: 'radish', seed: 'radish_seeds', look: 'round' as const }];
    overnight(s, { buildings: [], plots: [], crops }, 15, false); // night into summer day 16: summer
    expect(s.crops[0].days).toBe(1);
    expect(s.crops).toHaveLength(1);
  });

  it("sets the newcomer's home flag once their cottage is finished", () => {
    const cottage: BuildingDef = { id: 'cottage_sorrel', name: "Sorrel's cottage", nights: 1, cost: { sparkles: 0 }, prop: { type: 'cottage', w: 4, h: 3 }, effect: 'home', home: 'sorrel' };
    const cp: PlotDef = { id: 'c1', name: 'Lane end', area: 'lane', x: 20, y: 11, w: 4, h: 3, allow: ['cottage_sorrel'] };
    const s = new TownState();
    startBuild(s, cp, cottage, 8);
    expect(s.has('home_sorrel')).toBe(false);
    overnight(s, { buildings: [cottage], plots: [cp] }, 8, false);
    expect(s.has('home_sorrel')).toBe(true);
  });
});
