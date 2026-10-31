import { TUNING } from '../data/tuning';

// Puff's market stall (NEXT-PHASE §5.4 working buildings, §5.8: Puff's own stall, set prices,
// customers come by). Puff puts crops and dishes out on the stall in the square; overnight
// townsfolk buy some, paying a little more than the shops would. Fixed prices; how many sell
// grows with the town's Bloom, never by chance.

export interface StallSlot { id: string; count: number }
export interface StallState { slots: StallSlot[] }

/** How many different things fit on the stall. */
export const STALL_SLOTS = 6;

export function stocked(s: StallState) { return s.slots.reduce((n, x) => n + x.count, 0); }

/** Put one out (if there's a free slot or one already holding it). */
export function putOut(s: StallState, id: string): boolean {
  const slot = s.slots.find((x) => x.id === id);
  if (slot) { slot.count += 1; return true; }
  if (s.slots.length >= STALL_SLOTS) return false;
  s.slots.push({ id, count: 1 });
  return true;
}

/** Take one back to the bag. */
export function takeBack(s: StallState, id: string): boolean {
  const slot = s.slots.find((x) => x.id === id);
  if (!slot) return false;
  slot.count -= 1;
  if (!slot.count) s.slots = s.slots.filter((x) => x !== slot);
  return true;
}

/** What one sells for at the stall: the shop price, a little more. */
export const stallPrice = (sell: number) => Math.round(sell * TUNING.stall.markup);

/** The night's customers: the first few things in order, as many as the town's Bloom brings by. */
export function stallNight(s: StallState, sellOf: (id: string) => number, bloom: number) {
  let left = TUNING.stall.salesBase + TUNING.stall.salesPerBloom * bloom;
  let sold = 0; let sparkles = 0;
  for (const slot of s.slots) {
    while (slot.count && left) { slot.count -= 1; left -= 1; sold += 1; sparkles += stallPrice(sellOf(slot.id)); }
  }
  s.slots = s.slots.filter((x) => x.count);
  return { sold, sparkles };
}
