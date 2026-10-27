// Room packs are data, not code (GAME-DESIGN "Room-pack content pipeline"). This is the client
// shape of a pack plus a hand-rolled validator so a broken pack can never crash the game.
import { PROPS } from '../art/props';

export const ROOM_W = 180;
export const ROOM_H = 390;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Point { x: number; y: number }

export interface LayerDef { id?: string; prop: string; x: number; y: number; w?: number; h?: number; colour?: string; variant?: string }

export type StageEffect =
  | { effect: 'swap'; layer: string; variant: string }
  | { effect: 'sunbeam'; x: number; y: number; w: number; h: number }
  | { effect: 'glow'; x: number; y: number; r: number }
  | { effect: 'steam'; x: number; y: number }
  | { effect: 'twinkle'; points: Point[] };

export type TaskDef =
  | { type: 'scrub'; id: string; label: string; areas: Rect[]; coverage: number; seed: number }
  | { type: 'wipe'; id: string; label: string; areas: Rect[]; surface: 'glass' | 'dust' }
  | { type: 'pop'; id: string; label: string; bunnies: Point[] }
  | { type: 'vacuum'; id: string; label: string; areas: Rect[]; count: number; seed: number }
  | { type: 'sort'; id: string; label: string; bins: (Rect & { id: string; label: string; accepts: string[] })[]; items: (Point & { kind: string })[] };

export interface DecorDef { itemId: string; name: string; prop: string; x: number; y: number; price: number; colour?: string }
export interface ChoreDef { choreKey: string; label: string; size: 'tiny' | 'quick' }

export interface Theme {
  wall: string; wallAccent: string; wallPattern: 'stripes' | 'dots' | 'plain'; wallHeight: number;
  floor: 'tiles' | 'planks'; floorA: string; floorB: string;
}

export interface RoomDef {
  id: string; title: string; blurb: string; theme: Theme;
  layers: LayerDef[];
  stageArt: Partial<Record<'25' | '50' | '75' | '100', StageEffect[]>>;
  decor: DecorDef[];
  tasks: TaskDef[];
  chores: ChoreDef[];
  puffLines: string[];
  puff: Point;
  walk: Rect;
  unlock?: { afterRoom: string; chores: number };
}

export interface OutfitDef { itemId: 'apron' | 'scarf' | 'beanie'; name: string; price: number }

export interface Pack { schemaVersion: 1; id: string; version: number; title: string; tier: 'free' | 'plus'; rooms: RoomDef[]; outfits: OutfitDef[] }

// Untrusted pack JSON, checked field by field below before it's treated as a Pack.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 200;
const isRect = (v: Raw) => v && isNum(v.x) && isNum(v.y) && isNum(v.w) && isNum(v.h) && v.w > 0 && v.h > 0;
const isPoint = (v: Raw) => v && isNum(v.x) && isNum(v.y);
const inRoom = (v: Raw) => v.x >= -20 && v.y >= -20 && v.x <= ROOM_W + 20 && v.y <= ROOM_H + 20;

function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}

function validateTask(t: Raw, where: string) {
  check(t && isStr(t.id) && isStr(t.label), `${where}: task needs id and label`);
  if (t.type === 'scrub' || t.type === 'wipe') {
    check(Array.isArray(t.areas) && t.areas.length > 0 && t.areas.length <= 12 && t.areas.every(isRect), `${where}: bad areas`);
    if (t.type === 'scrub') check(isNum(t.coverage) && t.coverage > 0 && t.coverage <= 1 && isNum(t.seed), `${where}: bad coverage`);
    else check(t.surface === 'glass' || t.surface === 'dust', `${where}: bad surface`);
  } else if (t.type === 'vacuum') {
    check(Array.isArray(t.areas) && t.areas.length > 0 && t.areas.length <= 6 && t.areas.every(isRect), `${where}: bad crumb areas`);
    check(isNum(t.count) && t.count >= 4 && t.count <= 60 && isNum(t.seed), `${where}: bad crumb count`);
  } else if (t.type === 'pop') {
    check(Array.isArray(t.bunnies) && t.bunnies.length >= 1 && t.bunnies.length <= 12 && t.bunnies.every(isPoint), `${where}: bad bunnies`);
  } else if (t.type === 'sort') {
    check(Array.isArray(t.bins) && t.bins.length >= 1 && t.bins.length <= 4, `${where}: bad bins`);
    t.bins.forEach((b: Raw) => check(isRect(b) && isStr(b.id) && isStr(b.label) && Array.isArray(b.accepts) && b.accepts.every(isStr), `${where}: bad bin`));
    check(Array.isArray(t.items) && t.items.length >= 1 && t.items.length <= 10, `${where}: bad items`);
    t.items.forEach((i: Raw) => {
      check(isPoint(i) && isStr(i.kind), `${where}: bad item`);
      check(t.bins.some((b: Raw) => b.accepts.includes(i.kind)), `${where}: item ${i.kind} has no bin`);
    });
  } else {
    throw new Error(`${where}: unknown task type`);
  }
}

/** Throws on anything malformed; callers catch and fall back (FRONTEND-PLAN §6). */
export function validatePack(input: unknown): Pack {
  const p = input as Raw;
  check(p && p.schemaVersion === 1 && isStr(p.id) && isNum(p.version) && isStr(p.title), 'pack header');
  check(p.tier === 'free' || p.tier === 'plus', 'pack tier');
  check(Array.isArray(p.rooms) && p.rooms.length >= 1 && p.rooms.length <= 6, 'pack rooms');
  check(Array.isArray(p.outfits ?? []), 'pack outfits');
  for (const r of p.rooms) {
    const where = `room ${r?.id}`;
    check(r && isStr(r.id) && isStr(r.title) && isStr(r.blurb) && r.theme && isNum(r.theme.wallHeight), `${where}: header`);
    check(Array.isArray(r.layers) && r.layers.length <= 40, `${where}: layers`);
    r.layers.forEach((l: Raw) => check(l && l.prop in PROPS && isPoint(l) && inRoom(l), `${where}: bad layer ${l?.prop}`));
    check(Array.isArray(r.tasks) && r.tasks.length >= 1 && r.tasks.length <= 5, `${where}: tasks`);
    r.tasks.forEach((t: Raw) => validateTask(t, where));
    check(Array.isArray(r.chores) && r.chores.every((c: Raw) => isStr(c.choreKey) && isStr(c.label) && (c.size === 'tiny' || c.size === 'quick')), `${where}: chores`);
    check(Array.isArray(r.decor) && r.decor.every((d: Raw) => isStr(d.itemId) && isStr(d.name) && d.prop in PROPS && isPoint(d) && isNum(d.price) && d.price > 0), `${where}: decor`);
    check(Array.isArray(r.puffLines) && r.puffLines.every(isStr), `${where}: lines`);
    check(isPoint(r.puff) && isRect(r.walk), `${where}: puff`);
  }
  return p as Pack;
}
