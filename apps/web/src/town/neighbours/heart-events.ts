import { timeBand, type TimeBand } from './talk';

// Heart events (GDD v3 A7, §7): a short scene at 2, 4, 6, 8 and 10 hearts (and story scenes at 0,
// like Hazel naming Puff the Keeper on day 1). Each plays once,
// in order, when Puff next talks to the neighbour (at the right time and place, if it has one).
// Lines can depend on what Puff did (save flags) and choices set flags later scenes remember.
// Everything is skippable; skipping still gives the rewards and takes the first choice.
export type SceneStep =
  | { speaker: string; line: string; emote?: string; if?: { flag?: string; notFlag?: string } }
  | { choice: string; options: { label: string; setFlag: string }[] };

export interface HeartEvent {
  id: string;
  neighbourId: string;
  hearts: number;
  trigger: { type: 'talk'; areaId?: string; timeBand?: TimeBand[] };
  conditions?: { seen?: string[]; flags?: string[] };
  scene: SceneStep[];
  /** `flags` mark unlocks other milestones read (recipes, the greenhouse); `bagSlots` grows the bag. */
  rewards?: { sparkles?: number; bagSlots?: number; flags?: string[] };
  skippable?: boolean;
  /** Text id for the banner at the end, instead of "A moment with …" (story scenes like the Keeper welcome). */
  banner?: string;
}

export interface EventContext { hearts: number; flags: string[]; minutes: number; area: string }

export const doneFlag = (e: HeartEvent) => `${e.id}_done`;

/** The next scene this neighbour has waiting, or null. */
export function eventDue(events: HeartEvent[], neighbourId: string, c: EventContext): HeartEvent | null {
  const mine = events.filter((e) => e.neighbourId === neighbourId && !c.flags.includes(doneFlag(e))).sort((a, b) => a.hearts - b.hearts);
  const next = mine[0];
  if (!next || c.hearts < next.hearts) return null;
  if ((next.conditions?.seen ?? []).some((id) => !c.flags.includes(`${id}_done`))) return null;
  if ((next.conditions?.flags ?? []).some((f) => !c.flags.includes(f))) return null;
  if (next.trigger.areaId && next.trigger.areaId !== c.area) return null;
  if (next.trigger.timeBand && !next.trigger.timeBand.includes(timeBand(c.minutes))) return null;
  return next;
}

/** The scene's steps for this save: lines whose flag conditions hold. */
export function stepsOf(e: HeartEvent, flags: string[]) {
  return e.scene.filter((s) => !('line' in s) || !s.if || ((!s.if.flag || flags.includes(s.if.flag)) && (!s.if.notFlag || !flags.includes(s.if.notFlag))));
}
