import { seeded } from '../../shared/art/pixel-canvas';
import type { ToolId } from '../play/mess';
import type { Pt } from '../world/nav';

// Grumbles (VISION §7, NEW-FEATURES F3): little clouds of sleepy fluff from places nobody visited,
// stirred awake by the sparkle that made Puff. Tidying one brightens it into a helper. Nothing is
// harmed and nothing is lost: the untidied simply drift away overnight and others come by.

/** A family: the tool that tidies it, how many tidies it takes, where it gathers, when it arrives. */
export interface FamilyDef { id: string; tool: ToolId; hits: number; areas: string[]; unlock: string }

/** `fx`, `fy`: feet position in world px. `hits`: tidies so far (the pip ring). */
export interface Grumble { id: string; family: string; area: string; fx: number; fy: number; hits: number; state: 'grumpy' | 'helper' }

/** Today's Grumbles: `day` is the day they were set out for. */
export interface GrumbleState { day: number; list: Grumble[] }

export interface DayOptions {
  day: number;
  families: FamilyDef[];
  /** Whether a family's unlock key has arrived (the year-one schedule). */
  arrived(key: string): boolean;
  /** An open spot in an area for the k-th Grumble there, or null if there's no room. */
  spot(area: string, k: number): Pt | null;
  perArea: number;
  helpersMax: number;
}

/**
 * A new day: last night's untidied Grumbles have drifted away, helpers stay (the newest, up to the
 * cap), and each arrived family gathers 1 to `perArea` in each of its places. Once a day only.
 */
export function newDay(g: GrumbleState, o: DayOptions): GrumbleState {
  if (g.day === o.day) return g;
  const helpers = g.list.filter((x) => x.state === 'helper').slice(-o.helpersMax);
  const list: Grumble[] = [...helpers];
  for (const f of o.families.filter((x) => o.arrived(x.unlock))) {
    for (const area of f.areas) {
      const r = seeded(o.day * 97 + area.length * 13 + area.charCodeAt(0));
      const count = 1 + Math.floor(r() * o.perArea);
      for (let k = 0; k < count; k += 1) {
        const p = o.spot(area, k);
        if (p) list.push({ id: `${area}:${o.day}:${f.id}${k}`, family: f.id, area, fx: p.x, fy: p.y, hits: 0, state: 'grumpy' });
      }
    }
  }
  return { day: o.day, list };
}

/** The grumpy sheet's frames in the order a Grumble cheers up: droopy, wide-eyed, winking. */
const CHEERING = [0, 3, 1];

/** Which grumpy face to show after `hits` of the `of` tidies it needs. */
export function faceFor(hits: number, of: number) {
  return CHEERING[Math.min(CHEERING.length - 1, Math.floor((hits / of) * CHEERING.length))];
}

/** One tidy: `friend` when it brightens into a helper, `done` if it already has. */
export function tidyOne(g: Grumble, f: FamilyDef): 'more' | 'friend' | 'done' {
  if (g.state === 'helper') return 'done';
  g.hits = Math.min(f.hits, g.hits + 1);
  if (g.hits < f.hits) return 'more';
  g.state = 'helper';
  return 'friend';
}
