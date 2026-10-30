import { h } from '../../shared/ui/dom';
import { stickPull } from '../play/stick';
import type { Dir } from '../world/art/characters';

/** The stick's reach, in CSS px. */
const RADIUS = 44;

/**
 * The on-screen stick (Pause → Joystick): bottom-left, above the toolbar. Hold and drag to walk;
 * taps on the world still tidy and use things. `pull` is null when it's let go.
 */
export class Joystick {
  pull: { x: number; y: number; dir: Dir } | null = null;
  private el: HTMLElement;
  private knob: HTMLElement;

  constructor(host: HTMLElement) {
    this.knob = h('div', { class: 'stick-knob' });
    this.el = h('div', { class: 'stick', role: 'presentation', hidden: true }, this.knob);
    host.append(this.el);
    let centre: { x: number; y: number } | null = null;
    const move = (e: PointerEvent) => {
      if (!centre) return;
      const dx = e.clientX - centre.x; const dy = e.clientY - centre.y;
      this.pull = stickPull(dx, dy, RADIUS);
      const k = Math.min(1, RADIUS / (Math.hypot(dx, dy) || 1));
      this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    };
    const end = () => { centre = null; this.pull = null; this.knob.style.transform = ''; };
    this.el.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); this.el.setPointerCapture(e.pointerId);
      const r = this.el.getBoundingClientRect(); centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      move(e);
    });
    this.el.addEventListener('pointermove', move);
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', end);
  }

  set shown(on: boolean) { this.el.hidden = !on; if (!on) this.pull = null; }
}
