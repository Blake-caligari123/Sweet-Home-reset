import { seeded } from '../../shared/art/pixel-canvas';
import type { OnboardEvent } from '../play/onboarding';

// Today's little goals (Blake: "there isn't enough to do during a day… it gets boring fast"):
// three small, different things to aim for each day, picked fresh every morning from what Puff
// can do so far. Each done is a cheer and some Sparkles; all three, a bonus. No streak, nothing
// lost by skipping one. Pure rules here; daily-life.ts runs them.

/** What a goal counts. */
export interface GoalKind {
  id: string;
  /** Different kinds each day: never two from the same family. */
  family: 'tidy' | 'nature' | 'grow' | 'make' | 'town';
  /** How many, and the text (with {n} and {place}). */
  count: number; text: string;
  /** Does this moment count? (`place`: the place picked for it today, if any.) */
  counts(e: OnboardEvent, place?: string): boolean;
  /** Can Puff do it yet? */
  ready(f: GoalFacts): boolean;
  /** Picks a place for it (a visit, tidying somewhere). */
  place?: 'visited' | 'tidy';
  /** A week's goal: bigger, picked on Mondays (this week's three). */
  weekly?: boolean;
}

/** What Puff can do so far. */
export interface GoalFacts { day: number;
  /** Neighbours Puff knows who have a mini-game to play. */
  games: boolean;
  /** Compost in the bag, for feeding crops. */
  compost?: boolean; tools: string[]; fish: boolean; crops: boolean; animals: boolean; grumbles: boolean; places: string[]; tidyPlaces: string[] }

const KINDS: GoalKind[] = [
  { id: 'tidy', family: 'tidy', count: 15, text: 'Tidy {n} spots anywhere', counts: (e) => e.type === 'cleared', ready: () => true },
  { id: 'tidy_place', family: 'tidy', count: 8, text: 'Tidy {n} spots in {place}', place: 'tidy', counts: (e, p) => e.type === 'cleared' && e.area === p, ready: (f) => f.tidyPlaces.length > 1 },
  { id: 'weeds', family: 'tidy', count: 6, text: 'Rake up {n} weeds, leaves or mud', counts: (e) => e.type === 'cleared' && (e.mess === 'weeds' || e.mess === 'leaves' || e.mess === 'mud'), ready: (f) => f.tools.includes('rake') },
  { id: 'dust', family: 'tidy', count: 8, text: 'Dust away {n} dusty spots', counts: (e) => e.type === 'cleared' && ['dust', 'cobweb', 'crumbs', 'flour', 'sawdust'].includes(e.mess), ready: () => true },
  { id: 'wipe', family: 'tidy', count: 4, text: 'Sponge away {n} stains or smudges', counts: (e) => e.type === 'cleared' && ['stain', 'grime', 'fog', 'ink', 'soap'].includes(e.mess), ready: (f) => f.tools.includes('sponge') },
  { id: 'gather', family: 'nature', count: 3, text: 'Shake trees or forage bushes {n} times', counts: (e) => e.type === 'gathered', ready: (f) => f.day >= 3 },
  { id: 'chop', family: 'make', count: 1, text: 'Chop a tree for logs', counts: (e) => e.type === 'chopped', ready: (f) => f.tools.includes('axe') },
  { id: 'rest', family: 'town', count: 1, text: 'Sit on a bench and rest a while', counts: (e) => e.type === 'rested', ready: (f) => f.day >= 3 },
  { id: 'fish', family: 'nature', count: 2, text: 'Catch {n} fish', counts: (e) => e.type === 'caught', ready: (f) => f.fish },
  { id: 'critter', family: 'nature', count: 1, text: 'Spot a critter', counts: (e) => e.type === 'spotted', ready: (f) => f.day >= 3 },
  { id: 'grumble', family: 'nature', count: 1, text: 'Befriend a Grumble', counts: (e) => e.type === 'befriended', ready: (f) => f.grumbles },
  { id: 'plant', family: 'grow', count: 3, text: 'Plant {n} seeds', counts: (e) => e.type === 'planted', ready: (f) => f.tools.includes('can') },
  { id: 'water', family: 'grow', count: 3, text: 'Water {n} crops', counts: (e) => e.type === 'watered', ready: (f) => f.crops },
  { id: 'pick', family: 'grow', count: 2, text: 'Pick {n} crops', counts: (e) => e.type === 'picked', ready: (f) => f.crops },
  { id: 'feed', family: 'grow', count: 1, text: 'Give a crop some compost', counts: (e) => e.type === 'fed', ready: (f) => f.crops && !!f.compost },
  { id: 'tend', family: 'grow', count: 1, text: 'Look after your farm animals', counts: (e) => e.type === 'tended', ready: (f) => f.animals },
  { id: 'cook', family: 'make', count: 1, text: 'Cook something in your kitchen', counts: (e) => e.type === 'made' && e.station === 'kitchen', ready: (f) => f.day >= 4 },
  { id: 'craft', family: 'make', count: 1, text: 'Make something at a workbench', counts: (e) => e.type === 'made' && e.station === 'bench', ready: (f) => f.day >= 9 },
  { id: 'job', family: 'town', count: 1, text: 'Finish a job from the notice board', counts: (e) => e.type === 'jobDone', ready: (f) => f.day >= 2 },
  { id: 'game', family: 'town', count: 1, text: 'Play a little game with a friend', counts: (e) => e.type === 'played', ready: (f) => f.games },
  { id: 'visit', family: 'town', count: 1, text: 'Pay a visit to {place}', place: 'visited', counts: (e, p) => e.type === 'entered' && e.area === p, ready: (f) => f.places.length > 2 }
,
  // The week's bigger goals: three each week from day 3, with a gift for all three.
  { id: 'w_tidy', family: 'tidy', count: 120, text: 'Tidy {n} spots this week', weekly: true, counts: (e) => e.type === 'cleared', ready: () => true },
  { id: 'w_fish', family: 'nature', count: 8, text: 'Catch {n} fish this week', weekly: true, counts: (e) => e.type === 'caught', ready: (f) => f.fish },
  { id: 'w_critters', family: 'nature', count: 4, text: 'Spot {n} critters this week', weekly: true, counts: (e) => e.type === 'spotted', ready: (f) => f.day >= 3 },
  { id: 'w_grow', family: 'grow', count: 8, text: 'Pick {n} crops this week', weekly: true, counts: (e) => e.type === 'picked', ready: (f) => f.crops },
  { id: 'w_cook', family: 'make', count: 4, text: 'Cook {n} dishes this week', weekly: true, counts: (e) => e.type === 'made' && e.station === 'kitchen', ready: (f) => f.day >= 4 },
  { id: 'w_games', family: 'town', count: 5, text: 'Play {n} games with friends this week', weekly: true, counts: (e) => e.type === 'played', ready: (f) => f.games },
  { id: 'w_logs', family: 'make', count: 3, text: 'Chop {n} trees this week', weekly: true, counts: (e) => e.type === 'chopped', ready: (f) => f.tools.includes('axe') },
  { id: 'w_gather', family: 'nature', count: 12, text: 'Gather from trees and bushes {n} times this week', weekly: true, counts: (e) => e.type === 'gathered', ready: (f) => f.day >= 3 },
  { id: 'w_jobs', family: 'town', count: 4, text: 'Finish {n} board jobs this week', weekly: true, counts: (e) => e.type === 'jobDone', ready: (f) => f.day >= 2 }
];

/** A goal for today: which kind, the place picked for it, and how far along. */
export interface Goal { kind: string; place?: string; have: number }
export interface DailyGoals { day: number; goals: Goal[]; bonus: boolean;
  /** Mini-games finished today (each gives Sparkles once a day; they're free to play again). */
  played?: string[] }

/** A day's happening already asks for these (daily/happenings.ts), so the goals pick something else. */
export const SAME_AS: Record<string, string> = { bake: 'cook', derby: 'fish', parade: 'critter', breeze: 'weeds', games_day: 'game', garden_day: 'water', clean_sweep: 'tidy' };

/** Today's three: different families, picked the same way on any device for the same day and save. */
export function pickGoals(f: GoalFacts, avoid: string[] = [], salt = 0): Goal[] {
  if (f.day < 2) return []; // the first day has its own guide
  const rnd = seeded(f.day * 92821 + salt * 7 + 17);
  const pool = KINDS.filter((k) => !k.weekly && k.ready(f) && !avoid.includes(k.id));
  const shuffled = pool.map((k) => ({ k, r: rnd() })).sort((a, b) => a.r - b.r).map((x) => x.k);
  const out: Goal[] = [];
  const families = new Set<string>();
  for (const k of shuffled) {
    if (out.length >= 3 || families.has(k.family)) continue;
    families.add(k.family);
    const from = k.place === 'visited' ? f.places : k.place === 'tidy' ? f.tidyPlaces : [];
    out.push({ kind: k.id, have: 0, ...(from.length ? { place: from[Math.floor(rnd() * from.length)] } : {}) });
  }
  return out;
}

/** Which week a day is in (1 = days 1 to 7). */
export const weekOf = (day: number) => Math.floor((day - 1) / 7) + 1;

/** This week's three bigger goals, from different families (none in the first two days). */
export function pickWeekly(f: GoalFacts): Goal[] {
  if (f.day < 3) return [];
  const rnd = seeded(weekOf(f.day) * 6151 + 29);
  const pool = KINDS.filter((k) => k.weekly && k.ready(f)).map((k) => ({ k, r: rnd() })).sort((a, b) => a.r - b.r).map((x) => x.k);
  const families = new Set<string>();
  return pool.filter((k) => !families.has(k.family) && families.add(k.family)).slice(0, 3).map((k) => ({ kind: k.id, have: 0 }));
}

export const kindOf = (g: Goal) => KINDS.find((k) => k.id === g.kind)!;

/** A moment in play: the goals moved on, and which ones it just finished. */
export function hearGoal(goals: Goal[], e: OnboardEvent): { goals: Goal[]; done: Goal[] } {
  const done: Goal[] = [];
  const next = goals.map((g) => {
    const k = kindOf(g);
    if (!k || g.have >= k.count || !k.counts(e, g.place)) return g;
    const moved = { ...g, have: g.have + 1 };
    if (moved.have >= k.count) done.push(moved);
    return moved;
  });
  return { goals: next, done };
}

/** A goal's line, with its count and place filled in. */
export const goalText = (g: Goal, placeName: (id: string) => string) => kindOf(g).text.replace('{n}', String(kindOf(g).count)).replace('{place}', g.place ? placeName(g.place) : 'town');
export const goalDone = (g: Goal) => g.have >= kindOf(g).count;
