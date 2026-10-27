import { TUNING } from '../data/tuning';

export interface Slot { id: string; count: number }
export const STACK = 99;

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
