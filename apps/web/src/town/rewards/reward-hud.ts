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
  private levelChip: HTMLElement;
  private levelFill: HTMLElement;
  private goalsChip: HTMLButtonElement;
  private shown = '';

  /** `openToday`: the level and goals chips open the Today page. */
  constructor(private root: HTMLElement, private reducedMotion: () => boolean, openToday: () => void) {
    this.barFill = h('i');
    this.barLabel = h('span', { class: 'home-bar-label' });
    const pips = PIPS.map((p) => h('b', { class: 'pip', style: { left: `${p * 100}%` } }));
    this.bar = h('div', { class: 'home-bar', hidden: true, role: 'meter', 'aria-label': 'How tidy this place is', 'aria-valuemin': 0, 'aria-valuemax': 100 },
      this.barLabel, h('div', { class: 'home-bar-track' }, this.barFill, ...pips));
    this.chainBadge = h('div', { class: 'chain-badge', hidden: true, 'aria-hidden': 'true' });
    this.levelFill = h('i');
    this.levelChip = h('button', { class: 'chip level-chip', type: 'button' }, h('span', {}, 'Lv 1'), h('span', { class: 'level-track' }, this.levelFill));
    this.goalsChip = h('button', { class: 'chip goals-chip', type: 'button', hidden: true }, '★ 0/3');
    for (const b of [this.levelChip, this.goalsChip]) b.addEventListener('click', openToday);
    root.querySelector('.town-top')!.append(this.bar);
    root.querySelector('.clock-box')!.append(h('div', { class: 'reward-chips' }, this.levelChip, this.goalsChip));
    root.append(this.chainBadge);
  }

  /** Puff's level (with XP toward the next) and today's goals done, if there are goals today. */
  setStatus(s: { level: number; xp: number; need: number; goals: { done: number; of: number } | null }) {
    (this.levelChip.firstChild as HTMLElement).textContent = `Lv ${s.level}`;
    this.levelFill.style.width = `${Math.min(100, (s.xp / s.need) * 100)}%`;
    this.levelChip.setAttribute('aria-label', `Level ${s.level}, ${s.xp} of ${s.need} to the next. Open today's page.`);
    this.goalsChip.hidden = !s.goals;
    if (!s.goals) return;
    this.goalsChip.textContent = `${s.goals.done === s.goals.of ? '★' : '☆'} ${s.goals.done}/${s.goals.of}`;
    this.goalsChip.setAttribute('aria-label', `Today's goals: ${s.goals.done} of ${s.goals.of} done. Open today's page.`);
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
