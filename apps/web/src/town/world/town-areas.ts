import { withBuilds, type PlotState } from '../build/build';
import { Area, type TownPack } from '../data/area';
import type { TownSave } from '../data/save';
import { AreaMess } from '../play/mess';
import { navFor, type NavGrid } from './nav';

/**
 * Every area in town, with its mess and its walking grid, made when first needed. Areas with
 * plots are rebuilt as things get built there (the walking grid follows; the mess carries on).
 */
export class TownAreas {
  private areas = new Map<string, Area>();
  private messes = new Map<string, AreaMess>();
  private navs = new Map<string, NavGrid>();

  constructor(private pack: TownPack) {
    for (const a of pack.areas) this.areas.set(a.id, new Area(a));
  }

  has(id: string) { return this.areas.has(id); }
  get(id: string) { return this.areas.get(id); }

  mess(id: string) {
    let m = this.messes.get(id);
    if (!m) {
      const area = this.areas.get(id)!;
      m = new AreaMess(area.w, area.h, area.spots, area.pack.drained);
      this.messes.set(id, m);
    }
    return m;
  }

  /** The fine walking grid: traced polygons for painted areas, else tiles. */
  nav(id: string) {
    let g = this.navs.get(id);
    if (!g) { g = navFor(this.areas.get(id)!); this.navs.set(id, g); }
    return g;
  }

  /** Areas as they stand today, with what's built on their plots. */
  rebuild(plots: Record<string, PlotState>) {
    const { areas, plots: defs = [], buildings = [] } = this.pack;
    for (const a of areas.filter((x) => defs.some((p) => p.area === x.id))) {
      this.areas.set(a.id, new Area(withBuilds(a, defs, plots, buildings)));
      this.navs.delete(a.id);
    }
  }

  /** The mess of every area visited, for the save. */
  snapshot() {
    const out: TownSave['areas'] = {};
    for (const [id, m] of this.messes) out[id] = m.snapshot();
    return out;
  }
}
