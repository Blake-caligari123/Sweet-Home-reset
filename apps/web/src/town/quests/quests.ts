import type { OnboardEvent } from '../play/onboarding';

// Quest chains (NEXT-PHASE §5.3: multi-day quest chains with a story and a real reward). A quest
// is pack data: who offers it, from when, its steps in order and its reward. A step is done by
// doing things (tidying somewhere, cooking, picking, finding, fishing, spotting critters) or by a talk; some only open the day
// after the last step, so a quest unfolds over days. Nothing is lost by waiting.

export type QuestGoal =
  | { type: 'cleared'; area?: string; count: number }
  | { type: 'made'; station?: 'bench' | 'kitchen'; count: number }
  | { type: 'picked'; count: number }
  | { type: 'found'; count: number }
  | { type: 'caught'; count: number }
  | { type: 'spotted'; count: number }
  /** Talk to `who`: `ask` is their chat-box button, `line` what they say. */
  | { type: 'talk'; who: string; ask: string; line: string };

export interface QuestStep { hint: string; goal: QuestGoal; nextDay?: boolean }

export interface QuestDef {
  /** Offered from `fromDay`, and (a festival's prep) only until `untilDay`. */
  id: string; name: string; giver: string; fromDay: number; untilDay?: number;
  /** Only once this save flag is set (a story chapter after a place is restored). */
  needs?: string;
  /** The giver's chat-box button, and what they say when Puff takes it on. */
  offer: string; intro: string;
  steps: QuestStep[];
  reward: { sparkles: number; item?: string; qty?: number; flag: string };
}

/** Where a quest is: the step on now, how far into it, and the day it opened. */
export interface QuestProgress { step: number; count: number; day: number }
export type QuestLogState = Record<string, QuestProgress>;

export const finished = (q: QuestDef, s: QuestLogState) => (s[q.id]?.step ?? -1) >= q.steps.length;

/** The step on now, if it's open today (a next-day step waits for tomorrow). */
export function currentStep(q: QuestDef, s: QuestLogState, day: number) {
  const p = s[q.id];
  if (!p || p.step >= q.steps.length) return null;
  const step = q.steps[p.step];
  return step.nextDay && day <= p.day ? null : step;
}

/** Can the giver offer it today? */
export const offerable = (q: QuestDef, s: QuestLogState, day: number, flags: readonly string[] = []) => !s[q.id] && day >= q.fromDay && day <= (q.untilDay ?? Infinity) && (!q.needs || flags.includes(q.needs));

export const start = (q: QuestDef, s: QuestLogState, day: number): QuestLogState => ({ ...s, [q.id]: { step: 0, count: 0, day } });

/** One step further (a talk, or a goal met). */
export const advance = (q: QuestDef, s: QuestLogState, day: number): QuestLogState => ({ ...s, [q.id]: { step: (s[q.id]?.step ?? 0) + 1, count: 0, day } });

/** Does this moment count toward the step's goal? */
export function counts(goal: QuestGoal, e: OnboardEvent) {
  switch (goal.type) {
    case 'cleared': return e.type === 'cleared' && (!goal.area || e.area === goal.area);
    case 'made': return e.type === 'made' && (!goal.station || e.station === goal.station);
    case 'picked': return e.type === 'picked';
    case 'found': return e.type === 'found';
    case 'caught': return e.type === 'caught';
    case 'spotted': return e.type === 'spotted';
    default: return false;
  }
}

/** A moment in play: the new state, and whether the step was done by it. */
export function hearQuest(q: QuestDef, s: QuestLogState, e: OnboardEvent, day: number) {
  const step = currentStep(q, s, day);
  if (!step || step.goal.type === 'talk' || !counts(step.goal, e)) return { state: s, stepDone: false };
  const p = s[q.id];
  if (p.count + 1 < step.goal.count) return { state: { ...s, [q.id]: { ...p, count: p.count + 1 } }, stepDone: false };
  return { state: advance(q, s, day), stepDone: true };
}
