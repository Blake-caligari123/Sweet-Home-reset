import { counts, type QuestGoal } from '../quests/quests';
import type { OnboardEvent } from '../play/onboarding';

// The Keeper's Story (claude/MAIN-PATH.md): one story step a day, through the whole year. A
// neighbour asks for each step, the step can tick itself off from things Puff has already done,
// and finishing it writes a line in the journal and hints at tomorrow. Nothing is missed by
// waiting: a step just waits, and one tied to a festival day moves on quietly once the day passes.
// Pure rules here; story-path.ts runs them in the game.

/** What a step asks for: something done while it's on (`made`, `cleared`, …), or a fact about the save. */
export type StoryGoal =
  | Exclude<QuestGoal, { type: 'talk' }>
  /** Just the talk: done once the neighbour has asked. */
  | { type: 'talk' }
  | { type: 'flag'; flag: string }
  /** A building started on any plot (one of these, if several). */
  | { type: 'built'; building: string | string[] }
  | { type: 'visited'; area: string }
  | { type: 'pet' }
  | { type: 'fish'; count: number }
  | { type: 'critters'; count: number }
  | { type: 'cafe' }
  | { type: 'onboarded' }
  /** A quest taken on: the quest then runs alongside the story as its own thread. */
  | { type: 'quest'; id: string };

export interface StoryStep {
  id: string;
  /** The first day it can be on, and (a festival) the last. */
  day: number; until?: number;
  chapter: string;
  /** Who asks (a neighbour id); none for a letter, a knock at the door or a festival. */
  who?: string;
  goal: StoryGoal;
  /** Handed over with the ask (Otto's spare rod), and flags set (a recipe Pip teaches). */
  gift?: Record<string, number>; teach?: string[];
  /** Text ids follow `story.<id>.`: ask (button), line (what they say), call (tracker before asking), hint (tracker), diary (journal), tease (bedtime, the night before). */
}

export interface StoryChapter { id: string; name: string }
export interface StoryDef { chapters: StoryChapter[]; steps: StoryStep[] }

/** How far along: the step on, whether it's been asked, progress on a counted goal, and the day the last step was done. */
export interface StoryState { step: number; asked: boolean; count: number; day: number }
export const NEW_STORY: StoryState = { step: 0, asked: false, count: 0, day: 0 };

/** What the save knows, for the goals that are facts. */
export interface StoryFacts {
  has(flag: string): boolean; built(building: string): boolean; visited(area: string): boolean;
  pet: boolean; fish: number; critters: number; cafe: boolean; onboarded: boolean; questStarted(id: string): boolean;
}

const QUEST_GOALS = new Set(['cleared', 'made', 'picked', 'found', 'caught', 'spotted']);

/** The step on today, if any: the next one, once its day has come and not on the day another was done. */
export function today(def: StoryDef, s: StoryState, day: number): StoryStep | null {
  const step = def.steps[s.step];
  return step && day >= step.day && day > s.day ? step : null;
}

/** Whether Puff still has to be asked (a quest step is asked by the quest's own button). */
export const needsAsking = (step: StoryStep, s: StoryState) => !!step.who && !s.asked && step.goal.type !== 'quest';

/** Is the goal met? Counted goals need the step asked first; facts count whenever they're true. */
export function met(step: StoryStep, s: StoryState, f: StoryFacts): boolean {
  const g = step.goal;
  switch (g.type) {
    case 'talk': return s.asked;
    case 'flag': return f.has(g.flag);
    case 'built': return (Array.isArray(g.building) ? g.building : [g.building]).some((b) => f.built(b));
    case 'visited': return f.visited(g.area);
    case 'pet': return f.pet;
    case 'fish': return f.fish >= g.count;
    case 'critters': return f.critters >= g.count;
    case 'cafe': return f.cafe;
    case 'onboarded': return f.onboarded;
    case 'quest': return f.questStarted(g.id);
    default: return s.count >= g.count;
  }
}

/** A moment in play: one more toward a counted goal, if it counts. */
export function hear(step: StoryStep, s: StoryState, e: OnboardEvent): StoryState {
  return QUEST_GOALS.has(step.goal.type) && s.asked && counts(step.goal as QuestGoal, e) ? { ...s, count: s.count + 1 } : s;
}

/**
 * Done: on to the next step. A step done the moment it came up (already done before anyone asked)
 * doesn't use up the day, so a player ahead of the story never waits on it.
 */
export const done = (s: StoryState, day: number, early: boolean): StoryState => ({ step: s.step + 1, asked: false, count: 0, day: early ? s.day : day });

/** A festival step whose day has gone by moves on quietly (nothing is missed). */
export const passed = (step: StoryStep, day: number) => step.until !== undefined && day > step.until;

/** The step after the one just done, if it comes up tomorrow: what the bedtime hint is about. */
export function tomorrow(def: StoryDef, s: StoryState, day: number): StoryStep | null {
  const next = def.steps[s.step];
  return s.day === day && next && next.day <= day + 1 ? next : null;
}

/** The chapter so far: [chapter, diary step ids done, steps in it]. */
export function chapterNow(def: StoryDef, s: StoryState) {
  const on = def.steps[Math.min(s.step, def.steps.length - 1)];
  const chapter = def.chapters.find((c) => c.id === on?.chapter) ?? def.chapters[0];
  const inIt = def.steps.map((x, i) => [x, i] as const).filter(([x]) => x.chapter === chapter.id);
  return { chapter, done: inIt.filter(([, i]) => i < s.step).map(([x]) => x.id), total: inIt.length };
}
