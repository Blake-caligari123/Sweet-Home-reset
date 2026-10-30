import { TUNING } from '../data/tuning';
import { DONE, type PlotState } from '../build/build';
import type { Mood } from '../life/mood';

// Town needs and the town fund (NEXT-PHASE §5.4, §5.8; Blake: clear needs, and a town fund).
// The town says what it's missing ("somewhere to sit", "light after dark"); building something
// that meets a need ticks it off, and the townsfolk chip in to the fund. Each morning everyone in
// town chips in too, more when they're happy. The fund pays first for big projects.

/** A need: met once any of `metBy` (building ids) stands finished. `unlock`: shown once that year-one key arrives. */
export interface NeedDef { id: string; name: string; hint: string; metBy: string[]; fund: number; unlock?: string }

/** Needs met by what stands in town now. */
export function metNeeds(needs: NeedDef[], plots: Record<string, PlotState>) {
  const standing = new Set(Object.values(plots).filter((p) => p.stage >= DONE).map((p) => p.buildingId));
  return needs.filter((n) => n.metBy.some((b) => standing.has(b))).map((n) => n.id);
}

/** What the townsfolk chip in this morning, from how each feels. */
export function chipIn(moods: Mood[]) {
  const { perHappy, perOther } = TUNING.townFund;
  return moods.reduce((sum, m) => sum + (m === 'happy' || m === 'glowing' ? perHappy : perOther), 0);
}
