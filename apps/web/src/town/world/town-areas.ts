import { withBuilds, type PlotState } from '../build/build';
import { Area, type AreaPack, type TownPack } from '../data/area';
import { withDecor, type Placed } from '../decor/decor';
import { withRocks, type CaveState } from '../caves/caves';
import { festivalToday, withLanterns } from '../festivals/festivals';
import type { TownSave } from '../data/save';
import { TUNING } from '../data/tuning';
import { AreaMess } from '../play/mess';
import { returningMess } from '../play/mess-return';
import { navFor, type NavGrid } from './nav';

/**
 * Every area in town, with its mess and its walking grid, made when first needed. Areas with
 * plots are rebuilt as things get built there (the walking grid follows; the mess carries on).
 */
export class TownAreas {
  private areas = new Map<string, Area>();
  private messes = new Map<string, AreaMess>();
  private navs = new Map<string, NavGrid>();
  /** Each rebuilt area's pack with its builds (before decor). */
  private built = new Map<string, AreaPack>();

  constructor(private pack: TownPack, private day: () => number = () => 1) {
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

  /** Areas as they stand today: what's built on their plots, rocks still standing, festival lanterns, then the decor placed in them. */
  rebuild(s: { plots: Record<string, PlotState>; decor: Placed[]; caves: CaveState; flags: string[] }) {
    const { areas, plots: defs = [], buildings = [], items } = this.pack;
    const { plots, decor } = s;
    const day = this.day();
    const festival = festivalToday(this.pack.festivals ?? [], day);
    for (const a of areas.filter((x) => defs.some((p) => p.area === x.id) || decor.some((d) => d.area === x.id) || x.rocks?.length || x.id === festival?.area || this.built.has(x.id))) {
      const built = withLanterns(withRocks(withBuilds(a, defs, plots, buildings), a.rocks ?? [], s.caves), festival, s.flags, day);
      this.built.set(a.id, built);
      this.areas.set(a.id, new Area(withDecor(built, decor, items)));
      this.navs.delete(a.id);
    }
  }

  /** An area with its builds but before decor (what decor is placed onto). */
  withoutDecor(id: string) { return this.built.get(id) ?? this.areas.get(id)!.pack; }

  /** Overnight: a little light mess drifts back into the restored places Puff has been (muddy if it's raining). */
  driftBack(day: number, rainy = false) {
    for (const [id, m] of this.messes) m.scatter(returningMess(this.areas.get(id)!, m, day, TUNING.messReturn, rainy));
  }

  /** How many places are restored (for Town Bloom). */
  restoredCount() { let n = 0; for (const m of this.messes.values()) if (m.restored) n += 1; return n; }

  /** The mess of every area visited, for the save. */
  snapshot() {
    const out: TownSave['areas'] = {};
    for (const [id, m] of this.messes) out[id] = m.snapshot();
    return out;
  }
}
