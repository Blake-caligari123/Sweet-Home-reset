import { TUNING } from '../data/tuning';

// Mess and colour live on the CPU, one byte per tile each (FRONTEND-PLAN §3): type, hit points
// and colour level 0 (drained) to 4 (full colour). No GPU readback anywhere.
export const MESS_TYPES = ['none', 'dust', 'stain', 'grime', 'cobweb', 'crumbs', 'fog', 'clutter', 'weeds', 'mud'] as const;
export type MessType = (typeof MESS_TYPES)[number];
export type ToolId = 'duster' | 'sponge' | 'rake' | 'hands' | 'can' | 'seeds';
export const FULL_COLOUR = 4;

/** Which tool cleans which mess, and the lowest tier that can (grime needs Copper). */
export const TOOL_FOR: Record<Exclude<MessType, 'none'>, { tool: ToolId; minTier: number }> = {
  dust: { tool: 'duster', minTier: 1 }, cobweb: { tool: 'duster', minTier: 1 },
  stain: { tool: 'sponge', minTier: 1 }, grime: { tool: 'sponge', minTier: 2 },
  crumbs: { tool: 'duster', minTier: 1 }, fog: { tool: 'sponge', minTier: 1 },
  clutter: { tool: 'hands', minTier: 1 }, weeds: { tool: 'rake', minTier: 1 }, mud: { tool: 'rake', minTier: 1 }
};

export interface MessSpot { type: Exclude<MessType, 'none'>; x: number; y: number; item?: string }

export function hitsFor(type: MessType, tier: number) {
  const base = TUNING.messHitsTier1[type] ?? 1;
  return Math.max(1, base - (tier - 1));
}

export interface HitResult { ok: boolean; reason?: 'nothing' | 'wrong-tool' | 'tier'; cleared: boolean; changed: number[]; item?: string }

export class AreaMess {
  readonly type: Uint8Array;
  readonly hp: Uint8Array;
  readonly colour: Uint8Array;
  readonly item: (string | undefined)[];
  /** Mess that turned up later (a request): cleaned like any other, never part of restore progress. */
  readonly fresh: Uint8Array;
  total = 0;
  restored = false;

  constructor(readonly w: number, readonly h: number, spots: MessSpot[], drained: boolean) {
    const n = w * h;
    this.type = new Uint8Array(n); this.hp = new Uint8Array(n);
    this.colour = new Uint8Array(n).fill(drained ? 0 : FULL_COLOUR);
    this.item = new Array(n);
    this.fresh = new Uint8Array(n);
    for (const s of spots) {
      if (s.x < 0 || s.y < 0 || s.x >= w || s.y >= h) continue;
      const i = s.y * w + s.x;
      if (this.type[i]) continue;
      this.type[i] = MESS_TYPES.indexOf(s.type);
      this.hp[i] = TUNING.messHitsTier1[s.type] ?? 1;
      if (s.item) this.item[i] = s.item;
      this.total += 1;
    }
  }

  typeAt(x: number, y: number): MessType {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 'none';
    return MESS_TYPES[this.type[y * this.w + x]];
  }

  get remaining() { let r = 0; for (let i = 0; i < this.type.length; i += 1) if (this.type[i] && !this.fresh[i]) r += 1; return r; }

  /** New mess after the area was set up (a request), outside restore progress. Returns the tiles. */
  scatter(spots: MessSpot[]) {
    const tiles: number[] = [];
    for (const s of spots) {
      if (s.x < 0 || s.y < 0 || s.x >= this.w || s.y >= this.h) continue;
      const i = s.y * this.w + s.x;
      if (this.type[i]) continue;
      this.type[i] = MESS_TYPES.indexOf(s.type); this.hp[i] = TUNING.messHitsTier1[s.type] ?? 1; this.fresh[i] = 1;
      tiles.push(i);
    }
    return tiles;
  }
  get progress() { return this.total === 0 ? 1 : (this.total - this.remaining) / this.total; }

  /** One tool use on a tile. Hits per tier come from tuning; clearing ripples colour outward. */
  hit(x: number, y: number, tool: ToolId, tier: number): HitResult {
    const type = this.typeAt(x, y);
    if (type === 'none') return { ok: false, reason: 'nothing', cleared: false, changed: [] };
    const need = TOOL_FOR[type];
    if (need.tool !== tool) return { ok: false, reason: 'wrong-tool', cleared: false, changed: [] };
    if (tier < need.minTier) return { ok: false, reason: 'tier', cleared: false, changed: [] };
    const i = y * this.w + x;
    const damage = Math.max(1, tier);
    this.hp[i] = Math.max(0, this.hp[i] - damage);
    if (this.hp[i] > 0) return { ok: true, cleared: false, changed: [i] };
    const item = this.item[i];
    this.type[i] = 0; this.item[i] = undefined; this.fresh[i] = 0;
    const changed = this.ripple(x, y);
    if (!this.restored && this.progress >= TUNING.restoreThreshold) changed.push(...this.restore());
    return { ok: true, cleared: true, changed, item };
  }

  /** Colour floods back into the tile and steps into its neighbours. */
  ripple(x: number, y: number) {
    const changed: number[] = [];
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const nx = x + dx; const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
        const level = FULL_COLOUR - Math.max(Math.abs(dx), Math.abs(dy)) * 1.5;
        const i = ny * this.w + nx;
        const next = Math.max(this.colour[i], Math.round(level));
        if (next !== this.colour[i]) { this.colour[i] = next; changed.push(i); }
      }
    }
    return changed;
  }

  /** At the restore threshold the last bits sparkle away and the whole area regains colour. */
  restore() {
    this.restored = true;
    const changed: number[] = [];
    for (let i = 0; i < this.type.length; i += 1) {
      if (this.type[i] && MESS_TYPES[this.type[i]] !== 'clutter') { this.type[i] = 0; this.fresh[i] = 0; changed.push(i); }
      if (this.colour[i] !== FULL_COLOUR) { this.colour[i] = FULL_COLOUR; changed.push(i); }
    }
    return changed;
  }

  snapshot() {
    return { type: rle(this.type), hp: rle(this.hp), colour: rle(this.colour), items: this.item.map((v, i) => (v ? [i, v] : null)).filter(Boolean) as [number, string][], total: this.total, restored: this.restored, fresh: rle(this.fresh) as number[] | undefined };
  }

  load(s: ReturnType<AreaMess['snapshot']>) {
    const n = this.w * this.h;
    const runs = (r: number[]) => r.reduce((sum, v, i) => (i % 2 ? sum + v : sum), 0);
    if (runs(s.type) !== n || runs(s.colour) !== n) {
      // The area was redrawn with a different grid since this save. Tiles can't be matched up, so
      // keep what matters: a restored area stays restored; anything else starts fresh.
      if (!s.restored) throw new Error('area size changed');
      this.type.fill(0); this.hp.fill(0); this.colour.fill(FULL_COLOUR); this.item.fill(undefined); this.fresh.fill(0);
      this.total = s.total; this.restored = true;
      return;
    }
    this.type.set(unrle(s.type, n)); this.hp.set(unrle(s.hp, n)); this.colour.set(unrle(s.colour, n));
    this.fresh.set(s.fresh && runs(s.fresh) === n ? unrle(s.fresh, n) : new Uint8Array(n));
    this.item.fill(undefined);
    for (const [i, v] of s.items) this.item[i] = v;
    this.total = s.total; this.restored = s.restored;
  }
}

export function rle(a: Uint8Array) {
  const out: number[] = [];
  for (let i = 0; i < a.length;) { let j = i + 1; while (j < a.length && a[j] === a[i]) j += 1; out.push(a[i], j - i); i = j; }
  return out;
}

export function unrle(runs: number[], n: number) {
  const out = new Uint8Array(n); let k = 0;
  for (let i = 0; i + 1 < runs.length && k < n; i += 2) { const end = Math.min(n, k + runs[i + 1]); out.fill(runs[i], k, end); k = end; }
  return out;
}
