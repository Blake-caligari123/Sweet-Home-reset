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
      expect(overnight(s, [bench], 2, dozed)).toEqual(['Bench']);
      expect(s.plots.p1.stage).toBe(2);
      expect(s.crops.map((c) => [c.days, c.watered])).toEqual([[1, false], [0, false]]);
      expect(s.fluff.value).toBeGreaterThan(0);
    });
  }
});
