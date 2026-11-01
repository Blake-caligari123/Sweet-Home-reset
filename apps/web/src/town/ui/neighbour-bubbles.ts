import { h } from '../../shared/ui/dom';
import { BUBBLE_MS, GREET, IDLE_GAP_MS, idleBubble, NEAR_TILES, PLEASED } from '../life/bubbles';
import { T } from '../world/art/texture';

export interface BubbleHost {
  root: HTMLElement;
  /** Who's in view: id, where they stand (world px) and their pose. */
  visible(): { id: string; fx: number; fy: number; pose: string }[];
  area(): string;
  mood(id: string): string;
  met(id: string): boolean;
  /** Puff's feet in world px. */
  puff(): { x: number; y: number };
  toScreen(x: number, y: number): { x: number; y: number };
}

/** Draws the town's little bubbles over neighbours (life/bubbles.ts): idle ones now and then, a wave as Puff comes near, a smile for tidying nearby. */
export class NeighbourBubbles {
  private layer = h('div', { class: 'npc-bubbles', 'aria-hidden': 'true' });
  private shown = new Map<string, { el: HTMLElement; left: number }>();
  private waits = new Map<string, number>();
  private waved = new Map<string, number>();
  private clock = 0;

  constructor(private host: BubbleHost) { host.root.append(this.layer); }

  /** A new place: start quiet, with everyone's first bubble a little way off. */
  clear() { this.layer.replaceChildren(); this.shown.clear(); this.waits.clear(); }

  /** Puff tidied a spot: anyone close by is pleased. */
  tidied(tx: number, ty: number) {
    for (const n of this.host.visible()) {
      if (n.pose === 'sleep' || Math.hypot(n.fx / T - tx - 0.5, n.fy / T - ty - 0.5) > 3) continue;
      this.show(n.id, PLEASED[Math.floor(Math.random() * PLEASED.length)]);
    }
  }

  tick(dt: number) {
    this.clock += dt;
    const puff = this.host.puff();
    const here = this.host.visible();
    for (const n of here) {
      const s = this.shown.get(n.id);
      if (s) { s.left -= dt; if (s.left <= 0) { s.el.remove(); this.shown.delete(n.id); } }
      // A wave as Puff comes near (someone Puff has met, awake, not more than once a minute).
      const near = Math.hypot(n.fx - puff.x, n.fy - puff.y) / T < NEAR_TILES;
      if (near && n.pose !== 'sleep' && this.host.met(n.id) && this.clock - (this.waved.get(n.id) ?? -Infinity) > 60000) {
        this.waved.set(n.id, this.clock); this.show(n.id, GREET); continue;
      }
      const wait = (this.waits.get(n.id) ?? this.gap() / 2) - dt;
      this.waits.set(n.id, wait);
      if (wait <= 0 && !this.shown.has(n.id)) {
        this.waits.set(n.id, this.gap());
        this.show(n.id, idleBubble({ id: n.id, area: this.host.area(), pose: n.pose, mood: this.host.mood(n.id) }, Math.random()));
      }
    }
    // Keep each bubble over its owner's head; drop any whose owner walked off.
    for (const [id, s] of this.shown) {
      const n = here.find((x) => x.id === id);
      if (!n) { s.el.remove(); this.shown.delete(id); continue; }
      const p = this.host.toScreen(n.fx, n.fy - 19);
      s.el.style.left = `${p.x}px`; s.el.style.top = `${p.y}px`;
    }
  }

  private gap() { const [a, b] = IDLE_GAP_MS; return a + Math.random() * (b - a); }

  private show(id: string, icon: string) {
    this.shown.get(id)?.el.remove();
    const el = h('span', { class: 'npc-bubble' }, icon);
    this.layer.append(el);
    this.shown.set(id, { el, left: BUBBLE_MS });
  }
}
