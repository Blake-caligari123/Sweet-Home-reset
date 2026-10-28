import { describe, expect, it } from 'vitest';
import { startBuild, type BuildingDef, type PlotDef } from '../build/build';
import { TownState } from '../state';
import { overnight } from './overnight';

const bench: BuildingDef = { id: 'bench', name: 'Bench', nights: 1, cost: { sparkles: 40 }, prop: { type: 'bench', w: 2 } };
const plot: PlotDef = { id: 'p1', name: 'By the fountain', area: 'square', x: 14, y: 13, w: 2, h: 1, allow: ['bench'] };

describe('overnight', () => {
  for (const dozed of [false, true]) {
    it(`finishes a build and grows watered crops after ${dozed ? 'dozing off' : 'bedtime'}`, () => {
      const s = new TownState();
      s.sparkles = 100;
      startBuild(s, plot, bench, 2);
      s.crops = [{ area: 'yard', x: 1, y: 1, crop: 'radish', days: 0, watered: true }, { area: 'yard', x: 2, y: 1, crop: 'radish', days: 0, watered: false }];
      expect(overnight(s, { buildings: [bench], plots: [plot] }, 2, dozed)).toEqual(['Bench']);
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
});
