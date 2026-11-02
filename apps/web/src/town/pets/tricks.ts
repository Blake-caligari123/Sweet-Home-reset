import type { Pet } from './pets';

// Pet tricks and walks (a chill side activity, 2 Nov): the pet's bond grows with pats (a few a
// day count), walks and time together, and with it the tricks it knows. A walk is three
// outdoor places visited together in a day, ending with a happy find. Nothing fades or is lost.

const TRICKS = [
  { id: 'sit', name: 'Sit', bond: 0 },
  { id: 'spin', name: 'Spin', bond: 5 },
  { id: 'roll', name: 'Roll over', bond: 12 },
  { id: 'paw', name: 'High five', bond: 20 },
  { id: 'dance', name: 'Happy dance', bond: 32 }
] as const;
export type TrickId = (typeof TRICKS)[number]['id'];

/** The tricks known at this bond. */
export const knownTricks = (bond: number) => TRICKS.filter((t) => bond >= t.bond);

/** A trick newly learned going from `before` to `after` bond, if any. */
export const newTrick = (before: number, after: number) => TRICKS.find((t) => t.bond > before && t.bond <= after) ?? null;

/** A pat: up to `perDay` count toward the bond each day. Returns the bond gained (0 or 1). */
export function pat(pet: Pet, day: number, perDay: number): number {
  const today = pet.pats?.day === day ? pet.pats.n : 0;
  pet.pats = { day, n: today + 1 };
  if (today >= perDay) return 0;
  pet.bond = (pet.bond ?? 0) + 1;
  return 1;
}

/** Walk places needed for a walk. */
export const WALK_PLACES = 3;

/** Start today's walk (one a day). False if today's is already done. */
export function startWalk(pet: Pet, day: number): boolean {
  if (pet.walk?.day === day && pet.walk.done) return false;
  if (pet.walk?.day !== day) pet.walk = { day, places: [], done: false };
  return true;
}

/** A new place on today's walk: how many so far, and whether that finished it. */
export function walkTo(pet: Pet, day: number, area: string): { count: number; finished: boolean } | null {
  const w = pet.walk;
  if (!w || w.day !== day || w.done) return null;
  if (w.places.includes(area)) return { count: w.places.length, finished: false };
  w.places = [...w.places, area];
  if (w.places.length < WALK_PLACES) return { count: w.places.length, finished: false };
  w.done = true;
  return { count: w.places.length, finished: true };
}
