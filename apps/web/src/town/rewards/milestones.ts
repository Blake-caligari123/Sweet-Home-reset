import { TUNING } from '../data/tuning';

/** The progress pips (25, 50, 75%) passed going from `before` to `after`. Progress only rises, so each rings once. */
export function crossed(before: number, after: number, marks = TUNING.rewards.milestones) {
  return marks.filter((m) => before < m && after >= m);
}
