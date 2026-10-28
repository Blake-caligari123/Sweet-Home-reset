import type { Container, FederatedPointerEvent } from 'pixi.js';
import { h } from '../../shared/ui/dom';
import { recognise, type Sample } from '../play/gestures';
import { itemIcon } from './hud';

type Pt = { x: number; y: number };

export interface PointerHost {
  /** Screen point to world point. */
  toWorld(x: number, y: number): Pt;
  /** The first touch unlocks sound. */
  unlock(): void;
  tap(at: Pt): void;
  /** Back and forth over a spot: scrub it, once per pass. */
  rub(at: Pt, passes: number): void;
  /** A finger held still: keep scrubbing. */
  hold(at: Pt, ms: number): void;
  /** Round and round a spot: suds, once per loop. */
  circle(at: Pt, passes: number): void;
  drag(from: Pt, to: Pt): void;
  /** The item that can be carried from this world point (clutter), if any. */
  carryable(at: Pt): string | null;
}

/**
 * Fingers on the world: taps, holds, rubs, circles and drags (play/gestures.ts reads them). While clutter is being
 * dragged, its icon follows the finger. Tapping alone still does everything.
 */
export class PointerInput {
  private samples: Sample[] = [];
  private ghost: HTMLElement | null = null;
  private carrying: string | null = null;

  constructor(root: Container, private overlay: HTMLElement, private host: PointerHost) {
    root.eventMode = 'static';
    root.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    root.on('pointermove', (e: FederatedPointerEvent) => this.move(e));
    // A drag ends over a different sprite from where it began, so Pixi sends "upoutside" too: both are the release.
    root.on('pointerup', (e: FederatedPointerEvent) => this.up(e));
    root.on('pointerupoutside', (e: FederatedPointerEvent) => this.up(e));
  }

  private down(e: FederatedPointerEvent) {
    this.samples = [{ x: e.global.x, y: e.global.y, t: performance.now() }];
    this.carrying = this.host.carryable(this.host.toWorld(e.global.x, e.global.y));
  }

  private move(e: FederatedPointerEvent) {
    if (!this.samples.length) return;
    this.samples.push({ x: e.global.x, y: e.global.y, t: performance.now() });
    if (!this.carrying) return;
    this.ghost ??= this.overlay.appendChild(h('div', { class: 'carry-ghost', 'aria-hidden': 'true' }, itemIcon(this.carrying)));
    this.ghost.style.left = `${e.global.x}px`; this.ghost.style.top = `${e.global.y}px`;
  }

  private up(e: FederatedPointerEvent) {
    if (!this.samples.length) return;
    this.samples.push({ x: e.global.x, y: e.global.y, t: performance.now() });
    const g = recognise(this.samples);
    this.cancel();
    this.host.unlock();
    const world = (p: Pt) => this.host.toWorld(p.x, p.y);
    if (g.kind === 'tap') this.host.tap(world(g));
    else if (g.kind === 'rub') this.host.rub(world(g), g.passes);
    else if (g.kind === 'hold') this.host.hold(world(g), g.ms);
    else if (g.kind === 'circle') this.host.circle(world(g), g.passes);
    else this.host.drag(world(g.from), world(g.to));
  }

  private cancel() {
    this.samples = []; this.carrying = null;
    this.ghost?.remove(); this.ghost = null;
  }
}
