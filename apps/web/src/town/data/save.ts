import type { CafeState } from '../cafe/cafe';
import type { Memory } from '../life/memory';
import type { QuestLogState } from '../quests/quests';
import type { StoryState } from '../story/path';
import type { PuffDay } from '../skills/puff-mood';
import type { StallState } from '../stall/stall';
import type { FarmState } from '../farm/animals';
import type { SkillLog } from '../skills/skills';
import { TOWN_SAVE_SCHEMA } from '@sweet-home-reset/shared';
import { localDate } from '../../shared/date';
import type { PlotState } from '../build/build';
import type { GrumbleState } from '../grumbles/grumbles';
import type { Pet } from '../pets/pets';
import type { Finds } from '../bloom/bloom';
import type { Placed } from '../decor/decor';
import type { CaveState } from '../caves/caves';
import type { AreaMess } from '../play/mess';
import { DEFAULT_NAMES, type Names } from '../play/names';
import type { RequestState } from '../requests/requests';

// One versioned save (BACKEND-PLAN "Saves"): `shr` IndexedDB, `saves` store, slots main + backup.
// Backup is written first, then main; a corrupt main loads the backup. Unknown fields are kept.
// Schema 3 is "save v2" in NEW-FEATURES §7.
export const SCHEMA_VERSION = TOWN_SAVE_SCHEMA;
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
  /** Onboarding progress already made on later steps (done out of order). */
  onboardingAhead?: Record<string, number>;
  /** Pickups taken today (they're back each morning). */
  picked?: { day: number; ids: string[] };
  chores: { day: string; keys: string[]; total: number };
  /** The notice board's jobs. */
  requests?: RequestState;
  /** The last kind of mess cleaned today, for the morning letter. */
  lastClean?: string;
  /** What's built (or being built) on each plot. */
  plots?: Record<string, PlotState>;
  /** Today's Grumbles and the helpers made so far. */
  grumbles?: GrumbleState;
  /** Puff's pet, once chosen. */
  pet?: Pet | null;
  /** Town Bloom level celebrated so far. */
  bloom?: number;
  /** Town jobs done. */
  townJobs?: number;
  /** The best practice dash. */
  dashBest?: number;
  /** The one unlock (VISION §10): owned, and which store it came from. Missing means not bought. */
  unlock?: Unlock;
  /** Nights rested at the end of the free spring, which pace the unlock postcard. */
  restNights?: number;
  /** Places Puff has been (the town map offers these). */
  visited?: string[];
  /** What the townsfolk remember Puff did, and how far each drama has got (life/). */
  memories?: Memory[]; dramas?: Record<string, number>;
  /** Puff's skill XP (skills/). */
  skills?: SkillLog;
  /** Today's snack and new places, for Puff's mood. */
  puffDay?: PuffDay;
  /** The town fund, and the town needs met (needs/). */
  fund?: number; needsMet?: string[];
  /** Thank-you notes from each neighbour. */
  tokens?: Record<string, number>;
  /** How far each quest has got. */
  quests?: QuestLogState;
  /** How far along the Keeper's Story is. */
  story?: StoryState;
  /** What's out on Puff's market stall. */
  stall?: StallState;
  /** Today's café orders supplied. */
  cafe?: CafeState;
  /** Fish caught, all told. */
  fishCaught?: number;
  /** Critters spotted. */
  critters?: string[];
  /** The farm animals' care. */
  farm?: FarmState;
  /** The cloud save's version this device last matched (sync asks the player when it differs). */
  cloudVersion?: number;
  /** Cleans counted per place, and the surprise finds collected. */
  finds?: Finds;
  /** Rocks broken in the caves this week. */
  caves?: CaveState;
  /** Decor placed around town. */
  decor?: Placed[];
  /** The outfit Puff is wearing. */
  outfit?: string | null;
  /** What the player called Puff and the town. */
  names: Names;
  /** The tool in Puff's paws. */
  selected?: string;
  settings: { sound: boolean; music: boolean; haptics: boolean; reducedMotion: boolean; relaxed: boolean; autoTool: boolean;
    /** Accessibility (FRONTEND-PLAN §11); missing in older saves, so off. */
    bigText?: boolean; highContrast?: boolean; tapOnly?: boolean;
    /** Text size as a percent (100, 125, 150); older saves only have `bigText`. */
    textSize?: number;
    /** Anonymous play counts (GDD A10); on unless turned off. */
    shareCounts?: boolean;
    /** Walk with the on-screen stick instead of tapping; how far the view is zoomed (tiles across). */
    joystick?: boolean; zoomTiles?: number };
  [extra: string]: unknown;
}

/** The full game, once bought (`via`: the store; `at`: when, ISO). */
export interface Unlock { owned: boolean; via?: 'web' | 'ios' | 'android'; at?: string }

/** `giftDay`: the last day they were given a gift; `known`: gifts found to be loved or liked. */
export interface Friend { points: number; talkedDay: number; met: boolean; recent?: string[]; giftDay?: number; known?: string[] }

export type Migration = (save: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a save at version n to n + 1. */
export const MIGRATIONS: Record<number, Migration> = {
  // M2: neighbours arrive.
  1: (s) => ({ ...s, friends: {} }),
  // Phase 0: the player names Puff and the town; older games keep the usual names.
  2: (s) => ('names' in s ? {} : { names: { ...DEFAULT_NAMES } })
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

/**
 * The newest of the slots that load cleanly (the earlier slot on a tie: main, backup, quick), with
 * the slot as it was stored, else nothing (a fresh game). Autosaves write only the backup and
 * leaving the page writes the quick copy, so after a bedtime main is usually the oldest.
 */
export function newestSlot(slots: unknown[]) {
  let best: { save: TownSave; raw: unknown } | null = null;
  for (const raw of slots) {
    const save = migrate(raw);
    if (save && (!best || Date.parse(save.savedAt) > Date.parse(best.save.savedAt))) best = { save, raw };
  }
  return best;
}

export function pickSave(...slots: unknown[]) { return newestSlot(slots)?.save ?? null; }

/** A slot written by a newer version of the game: this one mustn't load it or write over it. */
export function fromNewerVersion(...slots: unknown[]) {
  return slots.some((s) => !!s && typeof s === 'object' && Number((s as TownSave).schemaVersion) > SCHEMA_VERSION);
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

/** Write a slot; `undefined` removes it. */
async function put(db: IDBDatabase, key: string, value: unknown) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    if (value === undefined) tx.objectStore(STORE).delete(key); else tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}

/** A slot kept in localStorage (the quick copy, or the fallback when IndexedDB is unavailable). */
function stored(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(`shr:${key}`) ?? 'null'); } catch { return null; }
}

/** The save to play, or nothing for a new game; `newer` when the save is from a newer version of the game. */
export interface Loaded { save: TownSave | null; newer: boolean }

/** Before a save is first upgraded, its old form is kept until the next bedtime, in case the upgrade goes wrong. */
const PRE_UPGRADE = 'pre-upgrade';

export async function loadTown(): Promise<Loaded> {
  let slots: unknown[];
  let db: IDBDatabase | null = null;
  try {
    db = await open();
    slots = [...await Promise.all([get(db, 'main'), get(db, 'backup')]), stored('quick')];
  } catch {
    slots = [stored('main'), stored('backup'), stored('quick')];
  }
  if (fromNewerVersion(...slots)) { frozen = true; db?.close(); return { save: null, newer: true }; }
  const best = newestSlot(slots);
  if (best && Number((best.raw as TownSave).schemaVersion) < SCHEMA_VERSION) await keepPreUpgrade(db, best.raw);
  db?.close();
  return { save: best?.save ?? null, newer: false };
}

async function keepPreUpgrade(db: IDBDatabase | null, raw: unknown) {
  try {
    if (db) { if (!await get(db, PRE_UPGRADE)) await put(db, PRE_UPGRADE, raw); }
    else if (!stored(PRE_UPGRADE)) localStorage.setItem(`shr:${PRE_UPGRADE}`, JSON.stringify(raw));
  } catch { /* no room for the extra copy: the save itself is untouched */ }
}

/**
 * Leaving the page: IndexedDB writes can be cut off as the page closes, so keep a quick copy in
 * localStorage, which is written at once. Loading takes whichever copy is newest.
 */
export function writeQuick(save: TownSave) {
  if (frozen) return;
  try { localStorage.setItem('shr:quick', JSON.stringify(save)); } catch { /* storage full or blocked: the autosave still stands */ }
}

/**
 * Bedtime writes both slots (and lets the pre-upgrade copy go: the upgraded save has now made it
 * through a whole day); autosaves write only the backup. Backup always goes first.
 */
export async function writeTown(save: TownSave, bedtime: boolean) {
  if (frozen) return;
  const plain = JSON.parse(JSON.stringify(save));
  try {
    const db = await open();
    await put(db, 'backup', plain);
    if (bedtime) { await put(db, 'main', plain); await put(db, PRE_UPGRADE, undefined); }
    db.close();
  } catch {
    try {
      localStorage.setItem('shr:backup', JSON.stringify(plain));
      if (bedtime) { localStorage.setItem('shr:main', JSON.stringify(plain)); localStorage.removeItem(`shr:${PRE_UPGRADE}`); }
    } catch { /* keep playing */ }
  }
}

/**
 * Nothing is written: the save was erased (until the page reloads into a new game), or it's from
 * a newer version of the game and must stay as it is.
 */
let frozen = false;

export async function eraseTown() {
  frozen = true;
  try { indexedDB.deleteDatabase(DB); } catch { /* ignore */ }
  try { for (const k of ['main', 'backup', 'quick', PRE_UPGRADE]) localStorage.removeItem(`shr:${k}`); } catch { /* ignore */ }
}
