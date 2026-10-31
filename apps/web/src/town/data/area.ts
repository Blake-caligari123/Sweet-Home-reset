import type { CardDef } from '../craft/cards';
import type { CritterDef } from '../critters/critters';
import type { FishDef } from '../fishing/fishing';
import type { AnimalDef } from '../farm/animals';
import type { DramaDef } from '../life/dramas';
import type { NeedDef } from '../needs/needs';
import type { QuestDef } from '../quests/quests';
import type { FestivalDef } from '../festivals/festivals';
import { seeded } from '../../shared/art/pixel-canvas';
import { isBlockedGround, type Ground, type Theme } from '../world/art/ground';
import type { PropDef } from '../world/art/props';
import type { MessSpot } from '../play/mess';
import type { NeighbourDef } from '../neighbours/neighbours';
import type { RequestTemplate } from '../requests/requests';
import type { ShopDef } from '../shops/shops';
import type { HeartEvent } from '../neighbours/heart-events';
import type { AliveStage } from '../play/alive';
import type { PickupDef } from '../play/pickups';
import type { Line } from '../neighbours/talk';
import type { BuildingDef, PlotDef } from '../build/build';
import type { FamilyDef } from '../grumbles/grumbles';
import type { PetDef } from '../pets/pets';
import type { RecipeDef } from '../craft/recipes';
import type { CropDef } from '../play/crops';
import type { FindDef } from '../bloom/bloom';
import type { OutfitDef } from '../outfits/outfits';
import type { DecorKind } from '../decor/decor';
import type { LetterDef } from '../letters/letters';
import type { RockDef } from '../caves/caves';

// Areas are data (FRONTEND-PLAN §7): a char map with a legend, props, doors and mess.
/** `closedText`: shown instead of going through; with `opensDay`, only before that day. */
export interface Door { x: number; y: number; to: string; toX: number; toY: number; closedText?: string; opensDay?: number;
  /** A secret door: only there once this find has turned up (secrets/secrets.ts). */
  needsFind?: string }
export type MessDef = MessSpot | { type: MessSpot['type']; rect: [number, number, number, number]; density: number; seed: number };

export interface AreaPack {
  id: string; name: string; kind: 'home' | 'outdoor' | 'cave'; drained: boolean; edge: string; theme: Theme;
  legend: Record<string, Ground>; map: string[]; props: PropDef[]; doors: Door[]; mess: MessDef[];
  spawn: { x: number; y: number }; restoreReward?: number; signs?: { x: number; y: number; text: string }[];
  /** Puff can place decor here though it's indoors or painted (the burrow). */
  decorate?: boolean;
  /** A painted background (Blake's art) instead of code-drawn tiles: `scale` painting px per world px. */
  background?: { src: string; scale: number };
  /** Free-movement outlines traced over a painting (world px polygons): where feet may go, and furniture. */
  nav?: { floor: number[][]; blockers: number[][] };
  /** Things Puff can take, back each morning (a snack on the counter). */
  pickups?: PickupDef[];
  /** Things that switch on as the room gets tidier (homes coming alive). */
  alive?: AliveStage[];
  /** A cave floor's rocks to mine. */
  rocks?: RockDef[];
}

export interface TownPack { schemaVersion: 1; id: string; version: number; areas: AreaPack[]; items: Record<string, { name: string; snack?: number; home?: string; sell?: number; decor?: DecorKind }>; neighbours?: NeighbourDef[];
  /** Talk pools per neighbour id; the text is in `strings`, by language. */
  dialogue?: Record<string, Line[]>; strings?: Record<string, Record<string, string>>;
  heartEvents?: HeartEvent[]; requests?: RequestTemplate[]; shops?: ShopDef[];
  /** Where the town can build, and what (VISION §5). */
  plots?: PlotDef[]; buildings?: BuildingDef[];
  /** Grumble families: their tool, tidies needed, where they gather (VISION §7). */
  grumbleFamilies?: FamilyDef[];
  /** The pets Puff can choose from on day 4. */
  pets?: PetDef[];
  /** What Pip's workbench can make (VISION §7). */
  recipes?: RecipeDef[];
  /** Recipe cards hidden under mess (craft/cards.ts). */
  cards?: CardDef[];
  /** What grows in soil (VISION §7). */
  crops?: CropDef[];
  /** Little treasures that turn up while tidying, for Moss's collection. */
  finds?: FindDef[];
  /** Things Puff can wear, earned by playing (VISION §4). */
  outfits?: OutfitDef[];
  /** Bottle letters that wash up by the fountain (Mabel's, from day 10). */
  letters?: LetterDef[];
  /** A festival on the last day of each season (VISION §7). */
  festivals?: FestivalDef[];
  /** Small dramas between townsfolk (life/dramas.ts). */
  dramas?: DramaDef[];
  /** What the town needs (needs/needs.ts). */
  needs?: NeedDef[];
  /** Quest chains (quests/quests.ts). */
  quests?: QuestDef[];
  /** The café: who runs it and the day its orders start (cafe/cafe.ts). */
  cafe?: { keeper: string; fromDay: number };
  /** What can be caught, where and when (fishing/fishing.ts). */
  fish?: FishDef[];
  /** Critters about town (critters/critters.ts). */
  critters?: CritterDef[];
  /** Farm animals Puff can buy, and where they live (farm/animals.ts). */
  animals?: AnimalDef[] }

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
    // Scattered mess only lands where Puff can stand on it or beside it, and never hides something to use.
    const used = (x: number, y: number) => pack.props.some((p) => p.action && x >= p.x && x < p.x + (p.w ?? 1) && y >= p.y && y < p.y + (p.h ?? 1));
    this.spots = expandMess(pack.mess, used).filter((m) => this.walkable(m.x, m.y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => this.walkable(m.x + dx, m.y + dy)));
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
/** Every mess spot: placed ones as given, scattered ones from their rect (never on a `skip` tile; the dice still roll there, so the rest stay put). */
export function expandMess(defs: MessDef[], skip: (x: number, y: number) => boolean = () => false): MessSpot[] {
  const out: MessSpot[] = defs.filter((d): d is MessSpot => !('rect' in d));
  const taken = new Set(out.map((m) => `${m.x},${m.y}`));
  for (const d of defs) {
    if (!('rect' in d)) continue;
    const rand = seeded(d.seed);
    const [x0, y0, w, h] = d.rect;
    for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) {
      if (rand() < d.density && !taken.has(`${x},${y}`) && !skip(x, y)) { out.push({ type: d.type, x, y }); taken.add(`${x},${y}`); }
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
    (a.alive ?? []).forEach((st, i, all) => { if (!isNum(st.at) || st.at <= 0 || st.at > 1 || (i && st.at <= all[i - 1].at) || !Array.isArray(st.effects)) throw new Error(`area ${a.id}: alive stage ${i}`); });
    for (const pk of a.pickups ?? []) if (!pk.id || !p.items?.[pk.item] || ![pk.x, pk.y].every(isNum)) throw new Error(`area ${a.id}: pickup ${pk.id}`);
    for (const pr of a.props) if (pr.tap && !(pr.tap.length === 4 && pr.tap.every(isNum))) throw new Error(`area ${a.id}: ${pr.type} tap area`);
    if (a.background && (typeof a.background.src !== 'string' || !isNum(a.background.scale) || a.background.scale <= 0)) throw new Error(`area ${a.id}: background`);
    const area = new Area(a);
    if (!area.walkable(a.spawn.x, a.spawn.y)) throw new Error(`area ${a.id}: spawn is blocked`);
    // A way back over a repair (the far bank's, onto the footbridge) lands on ground the repair paves.
    const paved = (t: string, x: number, y: number) => (p.plots ?? []).some((pl) => pl.area === t && x >= pl.x && x < pl.x + pl.w && y >= pl.y && y < pl.y + pl.h && pl.allow.some((id) => p.buildings?.find((b) => b.id === id)?.paves));
    for (const d of a.doors) {
      const target = p.areas.find((t) => t.id === d.to);
      if (target && !paved(target.id, d.toX, d.toY) && !new Area(target).walkable(d.toX, d.toY)) throw new Error(`area ${a.id}: door lands on a blocked tile in ${d.to}`);
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
    for (const c of n.changes ?? []) {
      if (!['rain', 'happy'].includes(c.when) || ![c.at, c.until, c.x, c.y].every(isNum) || c.until <= c.at) throw new Error(`neighbour ${n.id}: change`);
      if (!places.has(c.area)) throw new Error(`neighbour ${n.id}: unknown place ${c.area}`);
    }
  }
  const buildingIds = new Set((p.buildings ?? []).map((b) => b.id));
  for (const n of p.needs ?? []) if (!n.id || !n.name || !n.hint || !isNum(n.fund) || !n.metBy?.length || n.metBy.some((b) => !buildingIds.has(b))) throw new Error(`need ${n.id}: shape`);
  const text = p.strings?.['en-AU'] ?? {};
  for (const [id, lines] of Object.entries(p.dialogue ?? {})) {
    if (!who.has(id)) throw new Error(`dialogue for unknown neighbour ${id}`);
    for (const l of lines) {
      if (!l.id || typeof text[l.id] !== 'string') throw new Error(`dialogue ${id}: no text for ${l.id}`);
      if (l.about && (l.about === id || !who.has(l.about))) throw new Error(`dialogue ${l.id}: about an unknown neighbour`);
    }
  }
  const built = new Set((p.buildings ?? []).map((b) => b.id));
  for (const b of p.buildings ?? []) if (!b.id || !b.name || !isNum(b.nights) || b.nights < 1 || !isNum(b.cost?.sparkles) || !b.prop?.type) throw new Error(`building ${b.id}: shape`);
  for (const b of p.buildings ?? []) if (b.upgradeOf && !built.has(b.upgradeOf)) throw new Error(`building ${b.id}: upgrades unknown ${b.upgradeOf}`);
  for (const pl of p.plots ?? []) {
    if (!pl.id || !pl.name || !ids.has(pl.area) || ![pl.x, pl.y, pl.w, pl.h].every(isNum)) throw new Error(`plot ${pl.id}: shape`);
    for (const b of pl.allow ?? []) if (!built.has(b)) throw new Error(`plot ${pl.id}: unknown building ${b}`);
  }
  for (const r of p.recipes ?? []) {
    const makes = r.makes ?? {};
    const ok = 'tool' in makes ? isNum(makes.tier) : 'item' in makes && !!p.items[makes.item] && isNum(makes.qty);
    if (!r.id || !r.name || !ok) throw new Error(`recipe ${r.id}: shape`);
    for (const id of Object.keys(r.cost?.items ?? {})) if (!p.items[id]) throw new Error(`recipe ${r.id}: unknown item ${id}`);
  }
  for (const c of p.crops ?? []) if (!p.items[c.id] || !p.items[c.seed]) throw new Error(`crop ${c.id}: unknown item`);
  for (const c of p.critters ?? []) if (!c.id || !c.name || !c.hint || !c.areas?.length || c.areas.some((a) => !ids.has(a))) throw new Error(`critter ${c.id}: shape`);
  for (const a of p.animals ?? []) if (!a.id || !p.items[a.gives] || !ids.has(a.area)) throw new Error(`animal ${a.id}: shape`);
  for (const f of p.fish ?? []) if (!f.id || !p.items[f.id] || !f.areas?.length || f.areas.some((a) => !ids.has(a))) throw new Error(`fish ${f.id}: shape`);
  for (const q of p.quests ?? []) {
    if (!q.id || !who.has(q.giver) || !q.steps?.length || !isNum(q.reward?.sparkles) || !q.reward.flag) throw new Error(`quest ${q.id}: shape`);
    for (const st of q.steps) if (st.goal.type === 'talk' && (!who.has(st.goal.who) || typeof text[st.goal.line] !== 'string')) throw new Error(`quest ${q.id}: talk step`);
    if (typeof text[q.intro] !== 'string') throw new Error(`quest ${q.id}: no intro text`);
  }
  for (const l of p.letters ?? []) for (const id of [...l.lines, ...l.replies.map((r) => r.label)]) if (typeof text[id] !== 'string') throw new Error(`letter ${l.id}: no text for ${id}`);
  for (const pet of p.pets ?? []) if (!pet.id || !pet.name || !pet.defaultName || typeof text[pet.line] !== 'string') throw new Error(`pet ${pet.id}: shape`);
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
    if (e.banner && typeof text[e.banner] !== 'string') throw new Error(`heart event ${e.id}: no text for ${e.banner}`);
    for (const s of e.scene) {
      const ids = 'line' in s ? [s.line] : [s.choice, ...s.options.map((o) => o.label)];
      for (const t of ids) if (typeof text[t] !== 'string') throw new Error(`heart event ${e.id}: no text for ${t}`);
    }
  }
  return p;
}
