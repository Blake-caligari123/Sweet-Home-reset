import type { FindDef, Finds } from './bloom';

// What surprise finds are for (Blake: they need a section and a use). Every find stays in the
// Collection (Pause). Most belong to someone in town: shown to them, they tell its story and the
// friendship grows. Finding the whole set earns a thank-you from Moss.

/** Found things that belong to this neighbour and haven't been shown to them yet. */
export function findsFor(defs: FindDef[], s: Finds, who: string) {
  return defs.filter((f) => f.owner === who && s.found.includes(f.id) && !(s.shown ?? []).includes(f.id));
}

export function showFind(s: Finds, id: string): Finds {
  return { ...s, shown: [...new Set([...(s.shown ?? []), id])] };
}

export const setDone = (defs: FindDef[], s: Finds) => defs.every((f) => s.found.includes(f.id));
