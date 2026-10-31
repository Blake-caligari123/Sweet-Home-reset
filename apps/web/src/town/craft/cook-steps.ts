import type { RecipeDef } from './recipes';

// Cooking with gestures (NEXT-PHASE §5.7: chop, stir, knead, bake). Each dish is a few short
// hands-on steps before it's done: chop with quick taps, stir in circles, knead by pressing and
// holding. Nothing is spent until the last step. Tap-only mode makes each step a single tap.

export type CookGesture = 'chop' | 'stir' | 'knead';
export interface CookStep { gesture: CookGesture; need: number }

/** How much of each gesture a step takes: taps, full turns, or ms held. */
export const NEED: Record<CookGesture, number> = { chop: 6, stir: 2, knead: 1500 };

/** A dish's steps: the recipe's own, or chop then stir. One tap each in tap-only mode. */
export function stepsFor(r: RecipeDef, tapOnly: boolean): CookStep[] {
  return (r.gestures ?? ['chop', 'stir']).map((gesture) => ({ gesture, need: tapOnly ? 1 : NEED[gesture] }));
}

/** Turning angle between two points around a centre, in turns (−0.5 to 0.5). */
export function turnBetween(cx: number, cy: number, a: { x: number; y: number }, b: { x: number; y: number }) {
  let d = Math.atan2(b.y - cy, b.x - cx) - Math.atan2(a.y - cy, a.x - cx);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d / (2 * Math.PI);
}
