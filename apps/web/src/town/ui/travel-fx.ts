import { h } from '../../shared/ui/dom';
import type { View } from './view';

export interface TravelFxHost {
  ui: HTMLElement; fade: HTMLElement; view: View;
  reducedMotion(): boolean;
  /** Where Puff is on screen now. */
  puffOnScreen(): { x: number; y: number };
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/**
 * A trip between places (polish): an iris closes on Puff, the new place loads, the iris opens on
 * Puff there, and the place's name shows as they arrive. Banners wait until it's done. A plain
 * fade with reduced motion.
 */
export class TravelFx {
  constructor(private host: TravelFxHost) {}

  async go(enter: () => void, placeName: () => string) {
    const { fade, view } = this.host;
    view.hold();
    const iris = !this.host.reducedMotion();
    fade.classList.toggle('iris', iris);
    if (iris) this.irisAt();
    fade.classList.add('on');
    await wait(this.host.reducedMotion() ? 0 : iris ? 320 : 250);
    enter();
    if (iris) this.irisAt();
    fade.classList.remove('on');
    this.placeCard(placeName());
    window.setTimeout(() => fade.classList.remove('iris'), 400);
    view.release();
  }

  private irisAt() {
    const p = this.host.puffOnScreen();
    this.host.fade.style.setProperty('--ix', `${p.x}px`); this.host.fade.style.setProperty('--iy', `${p.y}px`);
  }

  private placeCard(name: string) {
    const { ui } = this.host;
    ui.querySelector('.place-card')?.remove();
    const card = h('div', { class: 'place-card', 'aria-hidden': 'true' }, `📍 ${name}`);
    ui.append(card);
    window.setTimeout(() => card.remove(), 1900);
  }
}
