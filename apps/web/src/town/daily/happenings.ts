import { seeded } from '../../shared/art/pixel-canvas';
import type { OnboardEvent } from '../play/onboarding';
import type { GoalFacts } from './goals';

// Daily happenings (Blake: "there isn't enough to do during a day… still repetitive"): on most
// days something different is going on in town, so no two days feel alike. A blustery night
// blows leaves everywhere, a neighbour drops something precious, Otto runs a fishing contest,
// there's a bake sale, the critters come out, a sparkle hour in the afternoon, a games day,
// a garden day, or a big clean sweep. Each has a
// bigger goal of its own, with nothing lost by letting it pass. Pure rules; happening-life.ts runs them.

export const HAPPENING_IDS = ['breeze', 'lost', 'derby', 'bake', 'parade', 'sparkle_hour', 'games_day', 'garden_day', 'clean_sweep'] as const;
export type HappeningId = (typeof HAPPENING_IDS)[number];

export interface HappeningFacts extends GoalFacts {
  /** Neighbours Puff has met, and whether Otto's in town (he runs the contest). */
  friends: string[]; otto: boolean;
}

interface HappeningDef {
  id: HappeningId;
  ready(f: HappeningFacts): boolean;
  /** The goal: how many, and what counts (lost is done by giving it back; sparkle hour has none). */
  count: number; counts?(e: OnboardEvent): boolean;
}

const WINDY = ['leaves', 'dust', 'weeds', 'cobweb'];
const HAPPENINGS: HappeningDef[] = [
  { id: 'breeze', count: 12, ready: (f) => f.tools.includes('rake') && f.places.some((p) => p !== 'yard'), counts: (e) => e.type === 'cleared' && WINDY.includes(e.mess) },
  { id: 'lost', count: 1, ready: (f) => f.friends.length > 0 && f.places.length > 1 },
  { id: 'derby', count: 3, ready: (f) => f.fish && f.otto, counts: (e) => e.type === 'caught' },
  { id: 'bake', count: 2, ready: (f) => f.day >= 5, counts: (e) => e.type === 'made' && e.station === 'kitchen' },
  { id: 'parade', count: 2, ready: (f) => f.day >= 6, counts: (e) => e.type === 'spotted' },
  { id: 'sparkle_hour', count: 0, ready: () => true },
  { id: 'games_day', count: 2, ready: (f) => f.games, counts: (e) => e.type === 'played' },
  { id: 'garden_day', count: 5, ready: (f) => f.crops, counts: (e) => e.type === 'watered' },
  { id: 'clean_sweep', count: 30, ready: (f) => f.day >= 4, counts: (e) => e.type === 'cleared' }
];
export const happening = (id: HappeningId) => HAPPENINGS.find((h) => h.id === id)!;

/** The afternoon's sparkle hour (game minutes): every tidy-up then gives extra Sparkles. */
const SPARKLE_HOUR: [number, number] = [16 * 60, 18 * 60];
export const inSparkleHour = (minutes: number) => minutes >= SPARKLE_HOUR[0] && minutes < SPARKLE_HOUR[1];

/** What's on today: the happening, how far along, and (lost) what, whose and where. */
export interface HappeningState { day: number; id: HappeningId | null; have: number; done: boolean; lost?: { item: string; owner: string; area: string; found?: boolean } }
export const NO_HAPPENING: HappeningState = { day: 0, id: null, have: 0, done: false };

/** Two days in three from day 3 there's something on, never the same two days running, never on a festival. */
export function happeningFor(f: HappeningFacts, festival: boolean, yesterday: HappeningId | null): HappeningId | null {
  if (f.day < 3 || festival) return null;
  const rnd = seeded(f.day * 7919 + 3);
  if (rnd() < 1 / 3) return null;
  const pool = HAPPENINGS.filter((h) => h.id !== yesterday && h.ready(f));
  return pool.length ? pool[Math.floor(rnd() * pool.length)].id : null;
}

/** A moment in play: one more toward today's happening, and whether that finished it. */
export function hearHappening(s: HappeningState, e: OnboardEvent): { state: HappeningState; finished: boolean } {
  const def = s.id && happening(s.id);
  if (!def?.counts || s.done || !def.counts(e)) return { state: s, finished: false };
  const have = s.have + 1;
  return { state: { ...s, have, done: have >= def.count }, finished: have >= def.count };
}

/** Lost things a neighbour might drop (none they'd need straight back). */
export const LOST_ITEMS = ['glass_marble', 'old_coin', 'tiny_key', 'pressed_flower', 'blue_feather', 'sea_glass', 'lost_button'];
