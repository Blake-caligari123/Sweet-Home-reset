import type { Puff } from '../play/puff';
import type { Dir } from '../world/art/characters';
import { T } from '../world/art/texture';
import type { NavGrid } from '../world/nav';

export interface KeyboardHost {
  puff: Puff;
  nav(): NavGrid;
  /** A box or sheet is open: only Escape works. */
  busy(): boolean;
  /** Escape / Android back: close the top sheet, else pause. */
  back(): void;
  /** A tap at a world point. */
  tap(px: number, py: number): void;
  /** Keys 1–5: the tool in that slot, if Puff has it. */
  selectSlot(n: number): void;
  openBag(): void;
}

const MOVES: Record<string, [number, number, Dir]> = { ArrowUp: [0, -1, 'up'], w: [0, -1, 'up'], ArrowDown: [0, 1, 'down'], s: [0, 1, 'down'], ArrowLeft: [-1, 0, 'left'], a: [-1, 0, 'left'], ArrowRight: [1, 0, 'right'], d: [1, 0, 'right'] };

/** Play with a keyboard: arrows or WASD step a tile, Space or Enter uses what Puff faces, 1–5 pick a tool, B opens the bag. */
export function bindKeyboard(host: KeyboardHost) {
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
    if (e.key === 'Escape') { e.preventDefault(); host.back(); return; }
    if (host.busy()) return;
    const p = host.puff;
    const m = MOVES[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (m) {
      e.preventDefault();
      if (p.path.length || p.swingMs > 0) return;
      const to = { x: p.fx + m[0] * T, y: p.fy + m[1] * T };
      p.dir = m[2];
      if (host.nav().clear({ x: p.fx, y: p.fy }, to)) p.path = [to];
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      host.tap((p.facing.x + 0.5) * T, (p.facing.y + 0.5) * T);
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 5) host.selectSlot(n);
    if (e.key.toLowerCase() === 'b') host.openBag();
  });
}
