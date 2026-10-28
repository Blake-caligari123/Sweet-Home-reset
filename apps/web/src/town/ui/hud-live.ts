import type { Content } from '../data/content';
import { DAY_START, formatTime, type Clock } from '../play/clock';
import type { Puff } from '../play/puff';
import { FEET_TO_BASE, targetAt, type Here } from '../play/targets';
import type { TownState } from '../state';
import type { World } from '../world/world';
import type { Hud } from './hud';
import { promptFor } from './prompt';
import type { View } from './view';

export interface HudLiveHost { clock: Clock; hud: Hud; view: View; state: TownState; puff: Puff; world: World; content: Content; here(): Here }

/** The HUD parts that follow play every frame: the clock, the Fluff bar, the prompt line and Puff's bubble. */
export class HudLive {
  private lastPrompt = '';
  private lastClock = '';

  constructor(private host: HudLiveHost) {}

  /** Each frame; only what changed is redrawn. */
  tick() {
    const { clock: c, hud, state } = this.host;
    const clockText = `${c.season} ${c.dayOfSeason}|${formatTime(c.shown)}`;
    if (clockText !== this.lastClock) {
      this.lastClock = clockText;
      const night = c.state.minutes >= 19 * 60 || c.state.minutes < DAY_START;
      hud.setClock(`${c.season} ${c.dayOfSeason}`, formatTime(c.shown), night, c.weather === 'rainy');
    }
    if (hud.setFluff(state.fluff.value, state.fluff.cap, state.fluff.tired)) this.host.view.say('Feeling sleepy... a snack would help.');
    const prompt = this.promptText();
    if (prompt !== this.lastPrompt) { this.lastPrompt = prompt; hud.setPrompt(prompt); }
    const p = this.host.puff;
    this.placeBubble(p.fx, p.fy);
  }

  /** The context line above the tool bar: what Puff is facing or about to do. */
  private promptText() {
    const p = this.host.puff;
    const here = this.host.here();
    const ahead = targetAt(here, p.facing.x, p.facing.y);
    return promptFor(p.action ?? p.swing ?? (ahead.kind === 'walk' ? null : ahead), here, this.host.state.crops, this.host.content);
  }

  /** Puff's speech bubble, just above their ears (whatever art Puff is drawn with), kept on screen. */
  private placeBubble(fx: number, fy: number) {
    const { world, hud } = this.host;
    const s = world.toScreen(fx, fy + FEET_TO_BASE - world.puffHeight - 2);
    hud.fadeNear(s.y + 20);
    if (!hud.bubble.classList.contains('show')) return;
    const half = Math.min(120, hud.bubble.offsetWidth / 2 + 8);
    hud.bubble.style.left = `${Math.min(window.innerWidth - half, Math.max(half, s.x))}px`;
    hud.bubble.style.top = `${Math.max(120, s.y)}px`;
  }
}
