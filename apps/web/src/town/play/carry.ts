import type { Area } from '../data/area';
import { T } from '../world/art/texture';
import type { Pt } from '../world/nav';
import type { Tile } from '../world/pathfind';
import type { AreaMess } from './mess';
import type { Puff } from './puff';

export interface CarryHost { puff: Puff; area(): Area; mess(): AreaMess; tap(px: number, py: number): void }

/** Dragging clutter to where it lives (ALIVE-PLAN §2): Puff picks it up, then carries it straight there. */
export class Carry {
  /** Clutter being carried home: its tile, and where it goes once Puff has it. */
  private carrying: { from: Tile; to: Pt } | null = null;

  constructor(private host: CarryHost) {}

  /** The clutter item on a tile, if any (what a drag can pick up). */
  clutterAt(x: number, y: number) { const m = this.host.mess(); return m.typeAt(x, y) === 'clutter' ? m.item[y * this.host.area().w + x] : undefined; }

  /** A drag: clutter dropped on where it lives is picked up, then carried there. False if it wasn't a carry. */
  drag(from: Pt, to: Pt) {
    const tile = { x: Math.floor(from.x / T), y: Math.floor(from.y / T) };
    const item = this.clutterAt(tile.x, tile.y);
    const home = item ? this.host.area().tapPropAt(Math.floor(to.x / T), Math.floor(to.y / T)) : null;
    if (!item || !home?.accepts?.includes(item)) return false;
    this.carrying = { from: tile, to: { x: (home.x + 0.5) * T, y: (home.y + 0.5) * T } };
    this.host.tap(from.x, from.y);
    return true;
  }

  /** Each frame: once Puff has picked up the carried clutter, off it goes to where it lives (or the carry is dropped). */
  tick() {
    const c = this.carrying; const p = this.host.puff;
    if (!c || p.path.length || p.swingMs > 0) return;
    this.carrying = null;
    if (!this.clutterAt(c.from.x, c.from.y)) this.host.tap(c.to.x, c.to.y);
  }
}
