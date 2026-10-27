import { localDate } from '../game/profile';
import type { AreaMess } from './mess';

// One versioned save (BACKEND-PLAN "Saves"): `shr` IndexedDB, `saves` store, slots main + backup.
// Backup is written first, then main; a corrupt main loads the backup. Unknown fields are kept.
export const SCHEMA_VERSION = 2;
export const CATALOGUE_VERSION = 1;

export interface TownSave {
  schemaVersion: number;
  catalogueVersion: number;
  deviceId: string;
  savedAt: string;
  localDate: string;
  day: number;
  minutes: number;
  fluff: { value: number; max: number; boost: number };
  sparkles: number;
  bag: ({ id: string; count: number } | null)[];
  tools: Record<string, number>;
  area: string;
  /** x, y: tile; fx, fy: exact feet position in world px (optional; older saves have only the tile). */
  puff: { x: number; y: number; fx?: number; fy?: number; facing: 'down' | 'up' | 'left' | 'right' };
  areas: Record<string, ReturnType<AreaMess['snapshot']>>;
  crops: { area: string; x: number; y: number; crop: string; days: number; watered: boolean }[];
  flags: string[];
  /** Per neighbour: friendship points (10 a heart, never lower), the last day they were talked to, met yet, lines heard lately. */
  friends: Record<string, Friend>;
  onboarding: number;
  chores: { day: string; keys: string[]; total: number };
  settings: { sound: boolean; music: boolean; haptics: boolean; reducedMotion: boolean; relaxed: boolean; autoTool: boolean };
  [extra: string]: unknown;
}

export interface Friend { points: number; talkedDay: number; met: boolean; recent?: string[] }

export type Migration = (save: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a save at version n to n + 1. */
export const MIGRATIONS: Record<number, Migration> = {
  // M2: neighbours arrive.
  1: (s) => ({ ...s, friends: {} })
};

export function migrate(raw: unknown, migrations: Record<number, Migration> = MIGRATIONS, target = SCHEMA_VERSION): TownSave | null {
  if (!raw || typeof raw !== 'object') return null;
  let save = { ...(raw as Record<string, unknown>) };
  let v = Number(save.schemaVersion);
  if (!Number.isInteger(v) || v < 1 || v > target) return null;
  while (v < target) {
    const step = migrations[v];
    if (!step) return null;
    save = { ...save, ...step(save), schemaVersion: v + 1 };
    v += 1;
  }
  return isSave(save) ? (save as TownSave) : null;
}

export function isSave(s: Record<string, unknown>) {
  return typeof s.day === 'number' && s.day >= 1 && typeof s.minutes === 'number' && typeof s.area === 'string'
    && !!s.fluff && typeof s.sparkles === 'number' && Array.isArray(s.bag) && !!s.areas && typeof s.areas === 'object';
}

/** Main if it loads cleanly, else the backup, else nothing (a fresh game). */
export function pickSave(main: unknown, backup: unknown) {
  return migrate(main) ?? migrate(backup);
}

export function stamp(save: Omit<TownSave, 'savedAt' | 'localDate' | 'schemaVersion' | 'catalogueVersion'> & Partial<TownSave>): TownSave {
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const local = new Date(now.getTime() + offset * 60_000).toISOString().slice(0, 19);
  return { ...save, schemaVersion: SCHEMA_VERSION, catalogueVersion: CATALOGUE_VERSION, savedAt: `${local}${sign}${pad(offset / 60)}:${pad(offset % 60)}`, localDate: localDate(now) } as TownSave;
}

// ---- IndexedDB --------------------------------------------------------------------------------

const DB = 'shr';
const STORE = 'saves';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function get(db: IDBDatabase, key: string) {
  return new Promise<unknown>((resolve) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function put(db: IDBDatabase, key: string, value: unknown) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}

export async function loadTown(): Promise<TownSave | null> {
  try {
    const db = await open();
    const [main, backup] = await Promise.all([get(db, 'main'), get(db, 'backup')]);
    db.close();
    return pickSave(main, backup);
  } catch {
    try { return pickSave(JSON.parse(localStorage.getItem('shr:main') ?? 'null'), JSON.parse(localStorage.getItem('shr:backup') ?? 'null')); } catch { return null; }
  }
}

/** Bedtime writes both slots; autosaves write only the backup. Backup always goes first. */
export async function writeTown(save: TownSave, bedtime: boolean) {
  const plain = JSON.parse(JSON.stringify(save));
  try {
    const db = await open();
    await put(db, 'backup', plain);
    if (bedtime) await put(db, 'main', plain);
    db.close();
  } catch {
    try { localStorage.setItem('shr:backup', JSON.stringify(plain)); if (bedtime) localStorage.setItem('shr:main', JSON.stringify(plain)); } catch { /* keep playing */ }
  }
}

export async function eraseTown() {
  try { indexedDB.deleteDatabase(DB); } catch { /* ignore */ }
  try { localStorage.removeItem('shr:main'); localStorage.removeItem('shr:backup'); } catch { /* ignore */ }
}
