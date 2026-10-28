import { h } from '../../shared/ui/dom';
import './rewards.css';

const PIPS = [0.25, 0.5, 0.75];

/**
 * The rewards' bits of HUD: the home progress bar, the sparkle-chain badge, "+N ✨" pop-ups and
 * the sparkles that fly into the counter. It adds itself to the town HUD's own containers.
 */
export class RewardHud {
  private bar: HTMLElement;
  private barFill: HTMLElement;
  private barLabel: HTMLElement;
  private chainBadge: HTMLElement;
  private shown = '';

  constructor(private root: HTMLElement, private reducedMotion: () => boolean) {
    this.barFill = h('i');
    this.barLabel = h('span', { class: 'home-bar-label' });
    const pips = PIPS.map((p) => h('b', { class: 'pip', style: { left: `${p * 100}%` } }));
    this.bar = h('div', { class: 'home-bar', hidden: true, role: 'meter', 'aria-label': 'How tidy this place is', 'aria-valuemin': 0, 'aria-valuemax': 100 },
      this.barLabel, h('div', { class: 'home-bar-track' }, this.barFill, ...pips));
    this.chainBadge = h('div', { class: 'chain-badge', hidden: true, 'aria-hidden': 'true' });
    root.querySelector('.town-top')!.append(this.bar);
    root.append(this.chainBadge);
  }

  private get counter() { return this.root.querySelector('.sparkles') as HTMLElement; }

  /** The area's tidiness, hidden once it's restored (or has no mess to restore). */
  setProgress(name: string, progress: number, show: boolean) {
    const key = show ? `${name}:${Math.floor(progress * 100)}` : '';
    if (key === this.shown) return;
    this.shown = key;
    this.bar.hidden = !show;
    if (!show) return;
    const pct = Math.floor(progress * 100);
    this.barFill.style.width = `${pct}%`;
    this.barLabel.textContent = `${name} ${pct}%`;
    this.bar.setAttribute('aria-valuenow', String(pct));
    this.bar.querySelectorAll('.pip').forEach((el, i) => el.classList.toggle('lit', progress >= PIPS[i]));
  }

  /** The chain badge: shown from ×2, gone when the chain fades. */
  setChain(count: number) {
    this.chainBadge.hidden = count < 2;
    if (count < 2) return;
    const text = `Sparkle chain ×${count}`;
    if (this.chainBadge.textContent === text) return;
    this.chainBadge.textContent = text;
    this.chainBadge.classList.remove('bump'); void this.chainBadge.offsetWidth; this.chainBadge.classList.add('bump');
  }

  /** "+N ✨" rising from a screen point. */
  popup(x: number, y: number, text: string) {
    const el = h('div', { class: 'reward-pop', 'aria-hidden': 'true', style: { left: `${x}px`, top: `${y}px` } }, text);
    this.root.append(el);
    window.setTimeout(() => el.remove(), 900);
  }

  /** A few sparkles fly from a screen point into the Sparkle counter, which pulses as they land. */
  fly(x: number, y: number, count: number) {
    const target = this.counter.getBoundingClientRect();
    const tx = target.left + target.width / 2; const ty = target.top + target.height / 2;
    const land = () => { this.counter.classList.remove('pulse'); void this.counter.offsetWidth; this.counter.classList.add('pulse'); };
    if (this.reducedMotion()) { land(); return; }
    for (let i = 0; i < Math.min(count, 5); i += 1) {
      const el = h('span', { class: 'fly-spark', 'aria-hidden': 'true', style: { left: `${x}px`, top: `${y}px` } }, '✨');
      this.root.append(el);
      window.setTimeout(() => { el.style.transform = `translate(${tx - x}px, ${ty - y}px) scale(0.6)`; el.style.opacity = '0.4'; }, 30 + i * 60);
      window.setTimeout(() => { el.remove(); if (i === 0) land(); }, 650 + i * 60);
    }
  }
}
