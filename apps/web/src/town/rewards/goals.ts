import { seeded } from '../../shared/art/pixel-canvas';
import { TUNING } from '../data/tuning';
import type { PlayEvent } from '../play/events';

// Today's three goals: small, gentle things to aim for, picked per day (the same on every device).
// Each finished goal gives Sparkles; skipping them costs nothing and nothing resets.
export type GoalKind = 'clean' | 'chat' | 'gift' | 'putaway' | 'find' | 'job';
export interface Goal { kind: GoalKind; target: number }
export interface GoalState { day: number; goals: Goal[]; progress: number[] }

const POOL: Goal[] = [
  { kind: 'clean', target: 15 }, { kind: 'clean', target: 25 }, { kind: 'chat', target: 2 }, { kind: 'chat', target: 3 },
  { kind: 'gift', target: 1 }, { kind: 'putaway', target: 3 }, { kind: 'find', target: 1 }, { kind: 'job', target: 1 }
];

const COUNTS: Record<GoalKind, PlayEvent['type']> = { clean: 'cleared', chat: 'talked', gift: 'gifted', putaway: 'putaway', find: 'found', job: 'jobDone' };

/** The day's goals (three), each a different kind. */
export function goalsFor(day: number): Goal[] {
  const rand = seeded(day * 7907 + 3);
  const pool = [...POOL];
  const out: Goal[] = [];
  while (out.length < TUNING.rewards.goalsPerDay && pool.length) {
    const g = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    if (!out.some((x) => x.kind === g.kind)) out.push(g);
  }
  return out;
}

/** Count an event toward the goals; `finished` lists the goals it just completed. */
export function progressGoals(s: GoalState, e: PlayEvent) {
  const finished: number[] = [];
  const progress = s.progress.map((p, i) => {
    const g = s.goals[i];
    if (COUNTS[g.kind] !== e.type || p >= g.target) return p;
    if (p + 1 >= g.target) finished.push(i);
    return p + 1;
  });
  return { state: { ...s, progress }, finished };
}

export function goalLabel(g: Goal) {
  const n = g.target;
  switch (g.kind) {
    case 'clean': return `Clean ${n} spots`;
    case 'chat': return `Chat with ${n} neighbours`;
    case 'gift': return n === 1 ? 'Give someone a gift' : `Give ${n} gifts`;
    case 'putaway': return `Put ${n} things away`;
    case 'find': return n === 1 ? 'Find a little treasure' : `Find ${n} treasures`;
    case 'job': return n === 1 ? 'Finish a job' : `Finish ${n} jobs`;
  }
}
