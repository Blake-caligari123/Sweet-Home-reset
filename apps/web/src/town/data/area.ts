import { seeded } from '../../shared/art/pixel-canvas';
import { isBlockedGround, type Ground, type Theme } from '../world/art/ground';
import type { PropDef } from '../world/art/props';
import type { MessSpot } from '../play/mess';
import type { NeighbourDef } from '../neighbours/neighbours';
import type { RequestTemplate } from '../requests/requests';
import type { ShopDef } from '../shops/shops';
import type { HeartEvent } from '../neighbours/heart-events';
import type { PickupDef } from '../play/pickups';
import type { Line } from '../neighbours/talk';

// Areas are data (FRONTEND-PLAN §7): a char map with a legend, props, doors and mess.
/** `closedText`: shown instead of going through; with `opensDay`, only before that day. */
export interface Door { x: number; y: number; to: string; toX: number; toY: number; closedText?: string; opensDay?: number }
export type MessDef = MessSpot | { type: MessSpot['type']; rect: [number, number, number, number]; density: number; seed: number };

export interface AreaPack {
  id: string; name: string; kind: 'home' | 'outdoor'; drained: boolean; edge: string; theme: Theme;
  legend: Record<string, Ground>; map: string[]; props: PropDef[]; doors: Door[]; mess: MessDef[];
  spawn: { x: number; y: number }; restoreReward?: number; signs?: { x: number; y: number; text: string }[];
  /** A painted background (Blake's art) instead of code-drawn tiles: `scale` painting px per world px. */
  background?: { src: string; scale: number };
  /** Free-movement outlines traced over a painting (world px polygons): where feet may go, and furniture. */
  nav?: { floor: number[][]; blockers: number[][] };
  /** Things Puff can take, back each morning (a snack on the counter). */
  pickups?: PickupDef[];
}

export interface TownPack { schemaVersion: 1; id: string; version: number; areas: AreaPack[]; items: Record<string, { name: string; snack?: number; home?: string; sell?: number }>; neighbours?: NeighbourDef[];
  /** Talk pools per neighbour id; the text is in `strings`, by language. */
  dialogue?: Record<string, Line[]>; strings?: Record<string, Record<string, string>>;
  heartEvents?: HeartEvent[]; requests?: RequestTemplate[]; shops?: ShopDef[] }

export class Area {
  readonly w: number;
  readonly h: number;
  readonly ground: Ground[];
  private blocked: Uint8Array;
  readonly spots: MessSpot[];

  constructor(readonly pack: AreaPack) {
    this.h = pack.map.length;
    this.w = Math.max(...pack.map.map((r) => r.length));
    this.ground = [];
    for (let y = 0; y < this.h; y += 1) for (let x = 0; x < this.w; x += 1) this.ground.push(pack.legend[pack.map[y][x] ?? ' '] ?? 'void');
    this.blocked = new Uint8Array(this.w * this.h);
    this.ground.forEach((g, i) => { if (isBlockedGround(g)) this.blocked[i] = 1; });
    for (const p of pack.props) {
      if (p.walkable) continue;
      for (let dy = 0; dy < (p.h ?? 1); dy += 1) for (let dx = 0; dx < (p.w ?? 1); dx += 1) this.setBlocked(p.x + dx, p.y + dy);
    }
    for (const d of pack.doors) if (this.inside(d.x, d.y)) this.blocked[d.y * this.w + d.x] = 0;
    // Scattered mess only lands where Puff can stand on it or beside it.
    this.spots = expandMess(pack.mess).filter((m) => this.walkable(m.x, m.y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => this.walkable(m.x + dx, m.y + dy)));
  }

  inside(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  private setBlocked(x: number, y: number) { if (this.inside(x, y)) this.blocked[y * this.w + x] = 1; }
  walkable = (x: number, y: number) => this.inside(x, y) && !this.blocked[y * this.w + x];
  groundAt(x: number, y: number): Ground { return this.inside(x, y) ? this.ground[y * this.w + x] : 'void'; }
  propAt(x: number, y: number) { return this.pack.props.find((p) => x >= p.x && y >= p.y && x < p.x + (p.w ?? 1) && y < p.y + (p.h ?? 1)); }
  /** The prop a tap on this tile means: one whose painted tap area covers it, else the one standing here. */
  tapPropAt(x: number, y: number) {
    return this.pack.props.find((p) => p.tap && p.action && x >= p.tap[0] && y >= p.tap[1] && x < p.tap[0] + p.tap[2] && y < p.tap[1] + p.tap[3]) ?? this.propAt(x, y);
  }
  doorAt(x: number, y: number) { return this.pack.doors.find((d) => d.x === x && d.y === y); }
  signAt(x: number, y: number) { return this.pack.signs?.find((s) => s.x === x && s.y === y); }
}

/** Placed spots first, then scattered ones on whatever tiles are left: a placed item is never lost. */
export function expandMess(defs: MessDef[]): MessSpot[] {
  const out: MessSpot[] = defs.filter((d): d is MessSpot => !('rect' in d));
  const taken = new Set(out.map((m) => `${m.x},${m.y}`));
  for (const d of defs) {
    if (!('rect' in d)) continue;
    const rand = seeded(d.seed);
    const [x0, y0, w, h] = d.rect;
    for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) {
      if (rand() < d.density && !taken.has(`${x},${y}`)) { out.push({ type: d.type, x, y }); taken.add(`${x},${y}`); }
    }
  }
  return out;
}

const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

/** Throws on a malformed pack; the caller falls back calmly (a bad pack never crashes the game). */
export function validateTownPack(input: unknown): TownPack {
  const p = input as TownPack;
  if (!p || p.schemaVersion !== 1 || !Array.isArray(p.areas) || !p.areas.length) throw new Error('pack header');
  const ids = new Set(p.areas.map((a) => a.id));
  for (const a of p.areas) {
    if (!a.id || !Array.isArray(a.map) || !a.map.length || !a.legend || !a.theme) throw new Error(`area ${a.id}: shape`);
    for (const row of a.map) for (const ch of row) if (!(ch in a.legend)) throw new Error(`area ${a.id}: unknown map char "${ch}"`);
    for (const d of a.doors) {
      if (!ids.has(d.to) && !d.closedText) throw new Error(`area ${a.id}: door to unknown area ${d.to}`);
      if (![d.x, d.y, d.toX, d.toY].every(isNum)) throw new Error(`area ${a.id}: door coords`);
    }
    for (const pk of a.pickups ?? []) if (!pk.id || !p.items?.[pk.item] || ![pk.x, pk.y].every(isNum)) throw new Error(`area ${a.id}: pickup ${pk.id}`);
    for (const pr of a.props) if (pr.tap && !(pr.tap.length === 4 && pr.tap.every(isNum))) throw new Error(`area ${a.id}: ${pr.type} tap area`);
    if (a.background && (typeof a.background.src !== 'string' || !isNum(a.background.scale) || a.background.scale <= 0)) throw new Error(`area ${a.id}: background`);
    const area = new Area(a);
    if (!area.walkable(a.spawn.x, a.spawn.y)) throw new Error(`area ${a.id}: spawn is blocked`);
    for (const d of a.doors) {
      const target = p.areas.find((t) => t.id === d.to);
      if (target && !new Area(target).walkable(d.toX, d.toY)) throw new Error(`area ${a.id}: door lands on a blocked tile in ${d.to}`);
    }
  }
  const places = new Set([...ids, ...p.areas.flatMap((a) => a.doors.map((d) => d.to))]);
  const who = new Set<string>();
  for (const n of p.neighbours ?? []) {
    if (!n.id || who.has(n.id) || !Array.isArray(n.schedule) || !n.schedule.length) throw new Error(`neighbour ${n.id}: shape`);
    who.add(n.id);
    n.schedule.forEach((s, i) => {
      if (![s.at, s.x, s.y].every(isNum) || (i && s.at < n.schedule[i - 1].at)) throw new Error(`neighbour ${n.id}: schedule`);
      if (!places.has(s.area)) throw new Error(`neighbour ${n.id}: unknown place ${s.area}`);
    });
  }
  const text = p.strings?.['en-AU'] ?? {};
  for (const [id, lines] of Object.entries(p.dialogue ?? {})) {
    if (!who.has(id)) throw new Error(`dialogue for unknown neighbour ${id}`);
    for (const l of lines) if (!l.id || typeof text[l.id] !== 'string') throw new Error(`dialogue ${id}: no text for ${l.id}`);
  }
  for (const sh of p.shops ?? []) {
    if (!sh.id || ![sh.opens, sh.closes].every(isNum) || !Array.isArray(sh.stock)) throw new Error(`shop ${sh.id}: shape`);
    if (sh.keeper && !who.has(sh.keeper)) throw new Error(`shop ${sh.id}: unknown keeper ${sh.keeper}`);
    for (const e of sh.stock) {
      if (!isNum(e.price) || e.price <= 0) throw new Error(`shop ${sh.id}: price for ${e.item}`);
      if ((e.kind ?? 'item') === 'item' && !p.items[e.item]) throw new Error(`shop ${sh.id}: unknown item ${e.item}`);
    }
  }
  for (const e of p.heartEvents ?? []) {
    if (!who.has(e.neighbourId) || !isNum(e.hearts) || !Array.isArray(e.scene) || !e.scene.length) throw new Error(`heart event ${e.id}: shape`);
    for (const s of e.scene) {
      const ids = 'line' in s ? [s.line] : [s.choice, ...s.options.map((o) => o.label)];
      for (const t of ids) if (typeof text[t] !== 'string') throw new Error(`heart event ${e.id}: no text for ${t}`);
    }
  }
  return p;
}
