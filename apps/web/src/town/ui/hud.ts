import { P } from '../../shared/art/palette';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { clear, h } from '../../shared/ui/dom';
import { pixelImage, puffPortrait } from '../../shared/ui/pixel-image';
import { drawItemIcon, drawPuff24, drawToolMini } from '../world/art';
import { spriteIcon } from '../world/sprites';
import type { ToolId } from '../play/mess';

// The DOM HUD (GDD v3 A5 / A11.3): live text, real buttons, 44 pt targets, safe-area aware.
export const TOOL_SLOTS: ToolId[] = ['hands', 'duster', 'sponge', 'rake', 'can'];
export const TOOL_NAMES: Record<ToolId, string> = { hands: 'Hands', duster: 'Duster', sponge: 'Sponge', rake: 'Rake', can: 'Watering can', seeds: 'Seeds' };

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
  private dayText: HTMLElement;
  private timeText: HTMLElement;
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
    this.sparkleText = h('span', { class: 'chip sparkles', 'aria-label': 'Sparkles' }, '✨ 0');
    this.tracker = h('button', { class: 'tracker', type: 'button', 'aria-label': 'Current goal. Tap to fold.' }, '');
    this.tracker.addEventListener('click', () => { this.tracker.classList.toggle('folded'); handlers.tracker(); });
    this.prompt = h('div', { class: 'context', 'aria-live': 'polite' });
    this.note = h('div', { class: 'late-note', hidden: true }, 'Getting late. Puff could head home to bed.');
    this.bubble = h('div', { class: 'bubble', 'aria-hidden': 'true' });
    this.live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
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
    const fluffMeter = h('div', { class: 'fluff', role: 'meter', 'aria-label': 'Fluff', 'aria-valuemin': 0 }, this.fluffIcon, h('div', { class: 'fluff-bar' }, this.fluffBar), this.fluffNum);
    this.root = h('div', { class: 'town-hud' },
      h('header', { class: 'town-top' },
        h('div', { class: 'top-left' }, pause, fluffMeter),
        this.tracker,
        h('div', { class: 'clock-box' }, h('div', { class: 'clock-line' }, this.dayText, this.timeText), this.sparkleText)
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

  setFluff(value: number, cap: number, tired: boolean) {
    this.fluffBar.style.width = `${Math.max(0, Math.min(100, (value / cap) * 100))}%`;
    this.fluffNum.textContent = String(Math.round(value));
    this.fluffBar.parentElement!.parentElement!.setAttribute('aria-valuenow', String(Math.round(value)));
    this.fluffBar.parentElement!.parentElement!.setAttribute('aria-valuemax', String(cap));
    this.fluffBar.parentElement!.parentElement!.classList.toggle('tired', tired);
    if (tired !== this.tired) { this.tired = tired; this.setFluffIcon(tired); }
  }

  pulseFluff() {
    const el = this.fluffBar.parentElement!.parentElement!;
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  }

  setClock(day: string, time: string, night: boolean) {
    this.dayText.textContent = day;
    this.timeText.textContent = `${night ? '☾' : '☀'} ${time}`;
  }

  setSparkles(n: number) { this.sparkleText.textContent = `✨ ${n}`; }

  setTracker(text: string) {
    this.tracker.textContent = text;
    this.tracker.hidden = !text;
  }

  setPrompt(text: string) { this.prompt.textContent = text; this.prompt.hidden = !text; }

  setTools(owned: ToolId[], selected: ToolId) {
    for (const [t, b] of this.toolButtons) {
      b.hidden = !owned.includes(t);
      b.classList.toggle('selected', t === selected);
      b.setAttribute('aria-pressed', String(t === selected));
    }
  }

  setLate(on: boolean) { this.note.hidden = !on; }

  announce(text: string) { this.live.textContent = text; }

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
