import { TUNING } from '../data/tuning';

export interface Slot { id: string; count: number }
const STACK = 99;

/** Puff's bag: a fixed number of slots, items stack up to 99. */
export class Bag {
  constructor(public slots: (Slot | null)[] = new Array(TUNING.bagSlotsStart).fill(null)) {}

  count(id: string) { return this.slots.reduce((n, s) => n + (s?.id === id ? s.count : 0), 0); }

  canAdd(id: string, n = 1) {
    let room = 0;
    for (const s of this.slots) room += !s ? STACK : s.id === id ? STACK - s.count : 0;
    return room >= n;
  }

  add(id: string, n = 1) {
    if (!this.canAdd(id, n)) return false;
    for (const s of this.slots) if (s?.id === id && n > 0) { const k = Math.min(n, STACK - s.count); s.count += k; n -= k; }
    for (let i = 0; i < this.slots.length && n > 0; i += 1) if (!this.slots[i]) { const k = Math.min(n, STACK); this.slots[i] = { id, count: k }; n -= k; }
    return true;
  }

  /**
   * Tidy the bag (one tap, very satisfying): stacks merge, like things sit together in `rank`
   * order (then by name), and empty slots gather at the end. Nothing is ever lost.
   */
  tidy(rank: (id: string) => number) {
    const totals = new Map<string, number>();
    for (const s of this.slots) if (s) totals.set(s.id, (totals.get(s.id) ?? 0) + s.count);
    const ids = [...totals.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    const next: (Slot | null)[] = [];
    for (const id of ids) for (let n = totals.get(id)!; n > 0; n -= STACK) next.push({ id, count: Math.min(STACK, n) });
    while (next.length < this.slots.length) next.push(null);
    this.slots = next;
  }

  /** A bigger bag (Pip's 6-heart gift): new empty slots on the end. */
  grow(n: number) { for (let i = 0; i < n; i += 1) this.slots.push(null); }

  remove(id: string, n = 1) {
    if (this.count(id) < n) return false;
    for (let i = this.slots.length - 1; i >= 0 && n > 0; i -= 1) {
      const s = this.slots[i];
      if (s?.id !== id) continue;
      const k = Math.min(n, s.count); s.count -= k; n -= k;
      if (!s.count) this.slots[i] = null;
    }
    return true;
  }
}
