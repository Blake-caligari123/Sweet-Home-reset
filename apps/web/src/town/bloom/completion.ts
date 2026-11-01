import type { TownPack } from '../data/area';
import { heartsOf } from '../neighbours/talk';
import type { TownState } from '../state';
import { collectionSets } from './sets';

// Town completion (polish: the completionist's number). One percentage for everything there is to
// do in Hollowfern, made of equal parts, each with its own bar: places restored, the story, each
// Collection set, secrets found, best friends and festivals. It only ever goes up.

export interface CompletionPart { id: string; icon: string; label: string; have: number; total: number }

export function completionParts(state: TownState, pack: TownPack): CompletionPart[] {
  const tidyPlaces = pack.areas.filter((a) => (a.mess?.length ?? 0) > 0 || a.restoreReward).map((a) => a.id);
  const secrets = [...new Set(pack.areas.flatMap((a) => a.doors.filter((d) => d.needsFind).map((d) => d.to)))];
  const steps = pack.story?.steps.length ?? 0;
  const folk = pack.neighbours ?? [];
  const festivals = pack.festivals ?? [];
  const sets = collectionSets(state, pack);
  const icons: Record<string, string> = { finds: '🔍', critters: '🐞', fish: '🐟', harvest: '🥕' };
  return [
    { id: 'places', icon: '🌸', label: 'Places restored', have: tidyPlaces.filter((id) => state.has(`restored_${id}`)).length, total: tidyPlaces.length },
    { id: 'story', icon: '📖', label: "The Keeper's Story", have: Math.min(state.story.step, steps), total: steps },
    ...sets.map((s) => ({ id: s.id, icon: icons[s.id], label: s.name, have: s.have, total: s.total })),
    { id: 'secrets', icon: '🗝', label: 'Secret places', have: secrets.filter((id) => state.visited.includes(id)).length, total: secrets.length },
    { id: 'friends', icon: '💛', label: 'Best friends (10 hearts)', have: folk.filter((n) => heartsOf(state.friends[n.id]?.points ?? 0) >= 10).length, total: folk.length },
    { id: 'festivals', icon: '🎪', label: 'Festivals enjoyed', have: festivals.filter((f) => state.has(`festival_${f.id}`)).length, total: festivals.length }
  ].filter((p) => p.total > 0);
}

/** The whole town's percentage: each part counts the same. 100 only when everything is done. */
export function completionPct(parts: CompletionPart[]) {
  if (!parts.length) return 0;
  const avg = parts.reduce((n, p) => n + Math.min(1, p.have / p.total), 0) / parts.length;
  return avg >= 1 ? 100 : Math.min(99, Math.floor(avg * 100));
}

/** Keeper ranks: a title that grows with the town's completion (never goes down). */
export const RANKS: [number, string][] = [[0, 'New Keeper'], [10, 'Little Keeper'], [25, 'Tidy Keeper'], [50, 'Town Keeper'], [75, 'Grand Keeper'], [100, 'Keeper of {town}']];

/** The rank for a completion %, and its place in the list. */
export function rankFor(pct: number): { index: number; title: string } {
  let index = 0;
  RANKS.forEach(([at], i) => { if (pct >= at) index = i; });
  return { index, title: RANKS[index][1] };
}
