import { DAILY_CHORE_REWARD_CAP } from '@sweet-home-reset/shared';
import type { Outfit } from '../art/puff';
import type { RoomDef } from './pack';
import type { SessionSave } from './session';

// Local-first player state. Balances here are display values until sync and the server ledger
// arrive (BACKEND-PLAN step 3); every rule below mirrors GAME-DESIGN "Economy".

export const REWARD = { task: 5, room: 25, chore: 10, choreEnergy: 1 } as const;
export const BOOST_COST = 1;

export interface Settings { sound: boolean; music: boolean; haptics: boolean; reducedMotion: boolean; bigBrush: boolean }

export interface RoomState { restored: number; seed: number; session?: SessionSave }

export interface Profile {
  schemaVersion: 1;
  sparkles: number;
  energy: number;
  owned: string[];
  outfit: Outfit;
  rooms: Record<string, RoomState>;
  chores: { total: number; day: string; today: number; keys: string[] };
  cosyDays: number;
  lastDay: string | null;
  onboarded: boolean;
  settings: Settings;
}

export function newProfile(reducedMotion = false): Profile {
  return {
    schemaVersion: 1, sparkles: 0, energy: 0, owned: [], outfit: null, rooms: {},
    chores: { total: 0, day: '', today: 0, keys: [] }, cosyDays: 0, lastDay: null, onboarded: false,
    settings: { sound: true, music: true, haptics: true, reducedMotion, bigBrush: false }
  };
}

/** Fill in anything missing from an older or partial save so it can never crash the game. */
export function migrate(raw: unknown, reducedMotion = false): Profile {
  const base = newProfile(reducedMotion);
  if (!raw || typeof raw !== 'object' || (raw as Profile).schemaVersion !== 1) return base;
  const p = raw as Partial<Profile>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
  return {
    ...base,
    sparkles: num(p.sparkles, 0), energy: num(p.energy, 0), cosyDays: num(p.cosyDays, 0),
    owned: Array.isArray(p.owned) ? p.owned.filter((v) => typeof v === 'string') : [],
    outfit: p.outfit === 'apron' || p.outfit === 'scarf' || p.outfit === 'beanie' ? p.outfit : null,
    rooms: p.rooms && typeof p.rooms === 'object' ? p.rooms : {},
    chores: { ...base.chores, ...(p.chores ?? {}), keys: Array.isArray(p.chores?.keys) ? p.chores!.keys : [] },
    lastDay: typeof p.lastDay === 'string' ? p.lastDay : null,
    onboarded: Boolean(p.onboarded),
    settings: { ...base.settings, ...(p.settings ?? {}) }
  };
}

export function localDate(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86_400_000);
}

/** Cosy Days only ever go up. Coming back after time away earns a party, never a penalty. */
export function showUp(p: Profile, today: string) {
  if (p.lastDay === today) return { welcomeBack: false, newDay: false };
  const away = p.lastDay ? daysBetween(p.lastDay, today) : 0;
  p.cosyDays += 1;
  p.lastDay = today;
  return { welcomeBack: away >= 2, newDay: true };
}

export function roomState(p: Profile, roomId: string): RoomState {
  return (p.rooms[roomId] ??= { restored: 0, seed: 1 });
}

export function isUnlocked(p: Profile, room: RoomDef) {
  if (!room.unlock) return true;
  return (p.rooms[room.unlock.afterRoom]?.restored ?? 0) > 0 || p.chores.total >= room.unlock.chores;
}

export function rewardTask(p: Profile) {
  p.sparkles += REWARD.task;
  return REWARD.task;
}

/** A restored room pays out, and the next visit brings a fresh mess (new seed). */
export function rewardRoom(p: Profile, roomId: string) {
  const state = roomState(p, roomId);
  state.restored += 1;
  state.seed += 1;
  delete state.session;
  p.sparkles += REWARD.room;
  return REWARD.room;
}

export function choresDoneToday(p: Profile, today: string) {
  return p.chores.day === today ? p.chores.keys : [];
}

/**
 * Honour-system chore tick, once per chore per day. Past the daily cap it still counts in
 * Our Home, it just earns nothing more.
 */
export function tickChore(p: Profile, today: string, key: string): { sparkles: number; energy: number; capped: boolean } | null {
  if (p.chores.day !== today) p.chores = { ...p.chores, day: today, today: 0, keys: [] };
  if (p.chores.keys.includes(key)) return null;
  p.chores.keys.push(key);
  p.chores.total += 1;
  if (p.chores.today >= DAILY_CHORE_REWARD_CAP) return { sparkles: 0, energy: 0, capped: true };
  p.chores.today += 1;
  p.sparkles += REWARD.chore;
  p.energy += REWARD.choreEnergy;
  return { sparkles: REWARD.chore, energy: REWARD.choreEnergy, capped: false };
}

export function buy(p: Profile, itemId: string, price: number): 'bought' | 'owned' | 'short' {
  if (p.owned.includes(itemId)) return 'owned';
  if (p.sparkles < price) return 'short';
  p.sparkles -= price;
  p.owned.push(itemId);
  return 'bought';
}

/** Energy only powers optional boosts; a spend below zero changes nothing. */
export function spendEnergy(p: Profile, amount: number) {
  if (p.energy < amount) return false;
  p.energy -= amount;
  return true;
}
