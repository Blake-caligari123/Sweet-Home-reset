import { seeded } from '../../shared/art/pixel-canvas';
import { TUNING } from '../data/tuning';

// The café (NEXT-PHASE §5.4: the café serves dishes Puff supplies). Each day it wants a couple of
// dishes, picked from the ones Puff can cook (so an order is always something possible), the
// same on every device. Puff hands them over in the keeper's chat for a good price.

/** Today's café: which dishes it wants, and which are already supplied. */
export interface CafeState { day: number; done: string[] }

/** Today's orders, from the dishes Puff knows (fixed by the day). */
export function cafeOrders(day: number, known: string[]) {
  if (!known.length) return [];
  const rand = seeded(day * 4241 + 7);
  const pool = [...known];
  const out: string[] = [];
  while (out.length < TUNING.cafe.ordersPerDay && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

/** What the café pays for one dish. */
export const cafePrice = (sell: number) => Math.round(sell * TUNING.cafe.markup);

/** Orders still wanted today. */
export function stillWanted(s: CafeState, day: number, known: string[]) {
  const done = s.day === day ? s.done : [];
  return cafeOrders(day, known).filter((d) => !done.includes(d));
}

export function supply(s: CafeState, day: number, dish: string): CafeState {
  return { day, done: [...(s.day === day ? s.done : []), dish] };
}
