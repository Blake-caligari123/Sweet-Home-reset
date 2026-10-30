import { seeded } from '../../shared/art/pixel-canvas';
import type { Area } from '../data/area';
import type { AreaMess, MessSpot, MessType } from '../play/mess';
import { TUNING } from '../data/tuning';

// Requests (GDD v3 A8, Part B): the notice board posts 1–3 jobs each morning, the same ones on
// every device for that day. A job is tidying a spot (fresh mess appears when it's accepted) or
// bringing someone an item. A missed one just goes after 2–3 days and the neighbour is fine.
/** Who a town job is from: the whole town, not one neighbour (its thanks is Town Bloom, not friendship). */
export const TOWN = 'town';

export interface RequestTemplate {
  id: string;
  /** Who asks: a neighbour's id, or TOWN. */
  neighbourId: string;
  kind: 'clean' | 'bring' | 'grumble';
  /** Text id in the string table. */
  text: string;
  sparkles: number;
  /** clean: where, which tiles (x, y, w, h), and what mess turns up. */
  area?: string; rect?: [number, number, number, number]; mess?: Exclude<MessType, 'none'>;
  /** bring: the item to hand over. */
  item?: string;
  /** grumble: how many Grumbles to befriend (of this family, or any). */
  count?: number; family?: string;
  /** Not posted before this day (a job in a place that opens later). */
  fromDay?: number;
  /** Always on the board on day 1 (the onboarding request). */
  first?: boolean;
  /** Set when it's done, for scenes that remember it. */
  setFlag?: string;
}

/** `until`: the last day it's up (inclusive); `tiles`: a tidy job's mess, as area tile indexes; `count`: Grumbles befriended so far. */
export interface PostedRequest { id: string; until: number; accepted: boolean; tiles?: number[]; count?: number }
export interface RequestState { day: number; list: PostedRequest[] }

export const MAX_ACCEPTED = 3;

/** A new morning: missed requests go (unless relaxed mode keeps them), then fresh ones go up. */
export function newDay(s: RequestState, templates: RequestTemplate[], day: number, opts: { expire: boolean }) {
  const rand = seeded(day * 7919 + 13);
  const [lo, hi] = TUNING.requestsPerDay;
  const [elo, ehi] = TUNING.requestExpiryDays;
  const expired = opts.expire ? s.list.filter((r) => r.until < day).map((r) => r.id) : [];
  // Unaccepted posts come down each morning; accepted ones stay until done or missed.
  const list = s.list.filter((r) => r.accepted && !expired.includes(r.id));
  const want = lo + Math.floor(rand() * (hi - lo + 1));
  const pool = templates.filter((t) => (t.fromDay ?? 1) <= day && !list.some((r) => r.id === t.id));
  const pick: RequestTemplate[] = day === 1 ? pool.filter((t) => t.first) : [];
  const rest = pool.filter((t) => !pick.includes(t));
  while (pick.length < want && rest.length) pick.push(rest.splice(Math.floor(rand() * rest.length), 1)[0]);
  for (const t of pick) list.push({ id: t.id, until: day + elo - 1 + Math.floor(rand() * (ehi - elo + 1)), accepted: false });
  return { state: { day, list }, expired };
}

/** Take a posted request; null when it isn't there or Puff already has the most they can carry. */
export function accept(s: RequestState, id: string): RequestState | null {
  if (s.list.filter((r) => r.accepted).length >= MAX_ACCEPTED) return null;
  const r = s.list.find((x) => x.id === id && !x.accepted);
  if (!r) return null;
  return { ...s, list: s.list.map((x) => (x === r ? { ...x, accepted: true } : x)) };
}

export function finish(s: RequestState, id: string): RequestState {
  return { ...s, list: s.list.filter((r) => r.id !== id) };
}

/** Tiles in the request's rect where fresh mess can sit: walkable or next to walkable, nothing there yet. */
export function freshMess(t: RequestTemplate, area: Area, m: AreaMess): MessSpot[] {
  if (t.kind !== 'clean' || !t.rect || !t.mess) return [];
  const [x0, y0, w, h] = t.rect;
  const out: MessSpot[] = [];
  for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) {
    if (m.typeAt(x, y) !== 'none' || !area.inside(x, y)) continue;
    if (area.walkable(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => area.walkable(x + dx, y + dy))) out.push({ type: t.mess, x, y });
  }
  return out;
}

/** Remember which tiles a tidy job put its mess on. */
export function withTiles(s: RequestState, id: string, tiles: number[]): RequestState {
  return { ...s, list: s.list.map((r) => (r.id === id ? { ...r, tiles } : r)) };
}

/** A tidy job is done when the mess it put down is gone (or, if it found its spot already messy, the whole spot). */
export function cleanDone(t: RequestTemplate, m: AreaMess, tiles?: number[]) {
  if (tiles?.length) return tiles.every((i) => !m.type[i]);
  if (!t.rect) return false;
  const [x0, y0, w, h] = t.rect;
  for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) if (m.typeAt(x, y) !== 'none') return false;
  return true;
}

/** A Grumble befriended: each accepted Grumble job it counts for moves on. Returns the jobs it finished. */
export function befriended(s: RequestState, templates: RequestTemplate[], family: string) {
  const done: string[] = [];
  const list = s.list.map((r) => {
    const t = templates.find((x) => x.id === r.id);
    if (!r.accepted || t?.kind !== 'grumble' || (t.family && t.family !== family)) return r;
    const count = (r.count ?? 0) + 1;
    if (count >= (t.count ?? 1)) done.push(t.id);
    return { ...r, count };
  });
  return { state: { ...s, list }, done };
}
