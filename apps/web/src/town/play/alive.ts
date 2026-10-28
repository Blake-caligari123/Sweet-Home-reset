// A home coming alive (claude/ALIVE-PLAN.md): as a room gets tidier, things switch on in stages:
// a lamp, sunlight, a sleepy cat. Each stage is pack data; progress only rises, so a stage once
// reached stays on.

/** One thing that switches on, in tiles. */
export type AliveEffect =
  | { type: 'glow'; x: number; y: number; size: number }
  | { type: 'sunbeam'; x: number; y: number; w: number; h: number }
  | { type: 'cat'; x: number; y: number }
  | { type: 'decor'; item: string; x: number; y: number }
  | { type: 'music'; bloom: number };

export interface AliveStage {
  /** How tidy (0..1) the room is when this switches on; 1 means restored. */
  at: number;
  /** What Puff says (or several lines, one after another). */
  say?: string;
  effects: AliveEffect[];
}

/** How many stages this much progress has reached. */
export function reached(stages: AliveStage[], progress: number) {
  return stages.filter((s) => progress >= s.at).length;
}

/** The stages passed going from `before` to `after`, by index. */
export function passed(stages: AliveStage[], before: number, after: number) {
  return stages.flatMap((s, i) => (before < s.at && after >= s.at ? [i] : []));
}
