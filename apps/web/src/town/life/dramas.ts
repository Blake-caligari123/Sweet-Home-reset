// Small dramas between townsfolk (NEXT-PHASE §5.3, Blake: friendships and small dramas Puff can
// help mend). A drama is pack data: two neighbours, the day it starts, and the talks that mend it,
// in order. While it's brewing, both feel it; once mended, a flag remembers how it ended.

export interface DramaDef {
  id: string;
  between: [string, string];
  fromDay: number;
  /** Who Puff talks to, in turn, and what they say. */
  steps: { talkTo: string; line: string }[];
  /** Set when it's mended (later scenes and lines can read it). */
  mendedFlag: string;
  /** Text id for the banner when it's mended. */
  banner?: string;
}

/** `state[id]`: how many steps are done. */
export type DramaState = Record<string, number>;

export function dramaStage(d: DramaDef, state: DramaState, day: number): 'waiting' | 'brewing' | 'mended' {
  if ((state[d.id] ?? 0) >= d.steps.length) return 'mended';
  return day >= d.fromDay ? 'brewing' : 'waiting';
}

/** Talking to `who`: the next step's line if it's theirs, with the new state and whether that mended it. */
export function advanceDrama(d: DramaDef, state: DramaState, who: string, day: number) {
  if (dramaStage(d, state, day) !== 'brewing') return null;
  const done = state[d.id] ?? 0;
  const step = d.steps[done];
  if (step.talkTo !== who) return null;
  const next = { ...state, [d.id]: done + 1 };
  return { line: step.line, state: next, mended: done + 1 >= d.steps.length };
}
