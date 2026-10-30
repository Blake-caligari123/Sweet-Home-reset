import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { clear, h } from '../../shared/ui/dom';
import { pixelImage, puffPortrait } from '../../shared/ui/pixel-image';
import { drawPuff24, drawToolMini } from '../world/art/characters';
import { drawItemIcon } from '../world/art/items';
import { spriteIcon } from '../world/sprites';
import type { ToolId } from '../play/mess';
import { clockLabel, sparklesLabel } from './a11y';

// The DOM HUD (GDD v3 A5 / A11.3): live text, real buttons, 44 pt targets, safe-area aware.
export const TOOL_SLOTS: ToolId[] = ['hands', 'duster', 'sponge', 'rake', 'can'];
export const TOOL_NAMES: Record<ToolId, string> = { hands: 'Hands', duster: 'Duster', sponge: 'Sponge', rake: 'Rake', can: 'Watering can', seeds: 'Seeds' };
/** How many recent lines the screen-reader live region keeps. */
const LIVE_LINES = 3;

function toolIcon(tool: ToolId) {
  const pc = new PixelCanvas(12, 12);
  if (tool === 'hands') {
    pc.ellipseBox(6, 7, 4, 4, P.greyLight, P.outline); pc.set(4, 3, P.outline); pc.set(8, 3, P.outline);
  } else pc.draw(drawToolMini(tool), 1, 1);
  return pixelImage(pc, 2);
}

export function itemIcon(id: string, scale = 2) {
  const art = spriteIcon(`item_${id}`, 14 * scale, id);
  if (art) return art;
  const pc = new PixelCanvas(14, 14);
  drawItemIcon(pc, id);
  return pixelImage(pc, scale, id);
}

export class Hud {
  readonly root: HTMLElement;
  private bagButton!: HTMLElement;
  private fluffBar: HTMLElement;
  private fluffNum: HTMLElement;
  private fluffIcon: HTMLElement;
  private fluffMeter: HTMLElement;
  private dayText: HTMLElement;
  private timeText: HTMLElement;
  private clockLine: HTMLElement;
  private sparkleText: HTMLElement;
  private tracker: HTMLButtonElement;
  private prompt: HTMLElement;
  private toolButtons = new Map<ToolId, HTMLButtonElement>();
  private note: HTMLElement;
  private live: HTMLElement;
  bubble: HTMLElement;

  constructor(host: HTMLElement, handlers: { tool(t: ToolId): void; bag(): void; pause(): void; tracker(): void }) {
    this.fluffBar = h('i');
    this.fluffNum = h('span', { class: 'fluff-num' }, '100');
    this.fluffIcon = h('span', { class: 'fluff-icon', 'aria-hidden': 'true' });
    this.dayText = h('span', { class: 'day' }, 'Spring 1');
    this.timeText = h('span', { class: 'time' }, '6:00 am');
    this.sparkleText = h('span', { class: 'chip sparkles', role: 'img', 'aria-label': sparklesLabel(0) }, '✨ 0');
    this.tracker = h('button', { class: 'tracker', type: 'button', 'aria-label': 'Current goal. Tap to fold.' }, '');
    this.tracker.addEventListener('click', () => { this.tracker.classList.toggle('folded'); handlers.tracker(); });
    this.prompt = h('div', { class: 'context', 'aria-live': 'polite' });
    this.note = h('div', { class: 'late-note', hidden: true }, 'Getting late. Time to head home to bed.');
    this.bubble = h('div', { class: 'bubble', 'aria-hidden': 'true' });
    this.live = h('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    const tools = TOOL_SLOTS.map((t) => {
      const b = h('button', { class: 'tool', type: 'button', 'aria-label': TOOL_NAMES[t], hidden: true }, toolIcon(t), h('span', {}, TOOL_NAMES[t].split(' ')[0]));
      b.addEventListener('click', () => handlers.tool(t));
      this.toolButtons.set(t, b);
      return b;
    });
    const bag = h('button', { class: 'tool bag', type: 'button', 'aria-label': 'Bag' }, itemIcon('sock'), h('span', {}, 'Bag'));
    this.bagButton = bag;
    bag.addEventListener('click', handlers.bag);
    const pause = h('button', { class: 'icon-btn pause-btn', type: 'button', 'aria-label': 'Pause and settings' }, '❚❚');
    pause.addEventListener('click', handlers.pause);
    const fluffMeter = this.fluffMeter = h('div', { class: 'fluff', role: 'meter', 'aria-label': 'Fluff', 'aria-valuemin': 0 }, this.fluffIcon, h('div', { class: 'fluff-bar' }, this.fluffBar), this.fluffNum);
    this.root = h('div', { class: 'town-hud' },
      h('header', { class: 'town-top' },
        h('div', { class: 'top-left' }, pause, fluffMeter),
        this.tracker,
        h('div', { class: 'clock-box' }, this.clockLine = h('div', { class: 'clock-line', role: 'img', 'aria-label': clockLabel('Spring 1', '6:00 am', false, false) }, this.dayText, this.timeText), this.sparkleText)
      ),
      this.bubble, this.note, this.live,
      h('footer', { class: 'town-bottom' }, this.prompt, h('nav', { class: 'toolbar', 'aria-label': 'Tools' }, ...tools, bag))
    );
    host.append(this.root);
    this.setFluffIcon(false);
  }

  private setFluffIcon(tired: boolean) {
    clear(this.fluffIcon);
    this.fluffIcon.append(pixelImage(drawPuff24('down', 0, tired ? 'sleep' : 'idle'), 1));
  }

  private tired = false;

  /** Item art arrived: swap the bag button's icon for it. */
  refreshIcons() { this.bagButton.firstElementChild?.replaceWith(itemIcon('sock')); }

  /** Low Fluff turns the bar peach and it breathes gently (never red, never an alarm). True just as Puff gets sleepy. */
  setFluff(value: number, cap: number, tired: boolean) {
    const el = this.fluffMeter;
    this.fluffBar.style.width = `${Math.max(0, Math.min(100, (value / cap) * 100))}%`;
    this.fluffNum.textContent = String(Math.round(value));
    el.setAttribute('aria-valuenow', String(Math.round(value)));
    el.setAttribute('aria-valuemax', String(cap));
    if (tired) el.setAttribute('aria-valuetext', `${Math.round(value)}, feeling sleepy`); else el.removeAttribute('aria-valuetext');
    if (tired === this.tired) return false;
    this.tired = tired;
    el.classList.toggle('tired', tired);
    this.setFluffIcon(tired);
    return tired;
  }

  pulseFluff() {
    const el = this.fluffMeter;
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  }

  setClock(day: string, time: string, night: boolean, rainy = false) {
    this.dayText.textContent = day;
    this.timeText.textContent = `${rainy ? '☂' : night ? '☾' : '☀'} ${time}`;
    this.clockLine.setAttribute('aria-label', clockLabel(day, time, night, rainy));
  }

  setSparkles(n: number) { this.sparkleText.textContent = `✨ ${n}`; this.sparkleText.setAttribute('aria-label', sparklesLabel(n)); }

  setTracker(text: string) {
    this.tracker.textContent = text;
    this.tracker.hidden = !text;
  }

  setPrompt(text: string) { this.prompt.textContent = text; this.prompt.hidden = !text; }

  /** `tiers`: each tool's tier; Copper (2) and Silver (3) get a rim and say so to screen readers. */
  setTools(owned: ToolId[], selected: ToolId, tiers: Record<string, number>) {
    for (const [t, b] of this.toolButtons) {
      b.hidden = !owned.includes(t);
      const tier = tiers[t] ?? 1;
      const metal = tier >= 3 ? 'Silver' : tier >= 2 ? 'Copper' : '';
      b.classList.toggle('copper', tier === 2);
      b.classList.toggle('silver', tier >= 3);
      b.setAttribute('aria-label', metal ? `${metal} ${TOOL_NAMES[t].toLowerCase()}` : TOOL_NAMES[t]);
      b.classList.toggle('selected', t === selected);
      b.setAttribute('aria-pressed', String(t === selected));
    }
  }

  setLate(on: boolean) { this.note.hidden = !on; }

  /** Speak a line. Lines are added, not swapped, so a busy morning is read in full; the last few stay. */
  announce(text: string) {
    if (!text) return;
    this.live.append(h('p', {}, text));
    while (this.live.childElementCount > LIVE_LINES) this.live.firstElementChild?.remove();
  }

  /** Fade HUD parts Puff walks under (A11.3). */
  fadeNear(screenY: number) {
    const top = this.root.querySelector('.town-top') as HTMLElement;
    const bottom = this.root.querySelector('.town-bottom') as HTMLElement;
    top.classList.toggle('faded', screenY < top.getBoundingClientRect().bottom + 10);
    bottom.classList.toggle('faded', screenY > bottom.getBoundingClientRect().top - 4);
  }
}

/** A bottom dialogue box: 48 px portrait, two lines, tap to close (A11.3 Dialogue). */
/** `speaker`: someone other than Puff talking, with their name and portrait. */
export function dialogue(host: HTMLElement, text: string, opts: { reducedMotion: boolean; buttons?: { label: string; primary?: boolean; onClick: () => void }[]; speaker?: { name: string; portrait: HTMLElement } } ) {
  const close = () => box.remove();
  const portrait = opts.speaker ? { el: opts.speaker.portrait } : puffPortrait(1, null, opts.reducedMotion);
  const buttons = (opts.buttons ?? [{ label: 'OK', primary: true, onClick: () => {} }]).map((b) => {
    const el = h('button', { class: `btn small ${b.primary ? 'primary' : ''}`, type: 'button' }, b.label);
    el.addEventListener('click', () => { close(); b.onClick(); });
    return el;
  });
  const box = h('div', { class: 'dialogue panel', role: 'dialog', 'aria-live': 'polite' },
    h('div', { class: 'portrait' }, portrait.el),
    h('div', { class: 'dialogue-body' }, opts.speaker ? h('p', { class: 'speaker' }, opts.speaker.name) : '', h('p', {}, text), h('div', { class: 'btn-row' }, ...buttons))
  );
  host.append(box);
  window.setTimeout(() => buttons[0]?.focus(), 30);
  return close;
}
