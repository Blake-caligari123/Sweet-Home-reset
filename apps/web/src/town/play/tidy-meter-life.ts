import type { Content } from '../data/content';
import type { TownState } from '../state';
import type { Hud } from '../ui/hud';
import type { View } from '../ui/view';
import { T } from '../world/art/texture';
import type { World } from '../world/world';
import type { OnboardEvent } from './onboarding';
import { TUNING } from '../data/tuning';
import { markSpotless, meterOf, quarterPassed, spotlessSparkles, wholeTownSpotless, type Meter, type MessLike } from './tidy-meter';

export interface TidyMeterHost {
  state: TownState; view: View; hud: Hud; world: World; content: Content;
  /** The place Puff is in, and its mess. */
  area(): { id: string; name: string; mess: MessLike };
  day(): number; feet(): { x: number; y: number }; refreshHud(): void;
  /** Every place restored so far, and how many spots each has left (for the whole-town cheer). */
  restored(): string[];
  left(id: string): number;
  /** Puff's happy hop. */
  hop(): void;
}

/** Keeps the tidy meter in step with play: a ping at each quarter, a countdown of the last spots, and a cheer when a place is spotless. */
export class TidyMeterLife {
  private last: Meter = { kind: 'none' };

  constructor(private host: TidyMeterHost) {}

  /** Entering a place: show where it's up to, quietly. */
  show() { this.last = meterOf(this.host.area().mess); this.host.hud.setTidy(this.last); }

  hear(e: OnboardEvent) {
    if (e.type !== 'cleared' && e.type !== 'putaway' && e.type !== 'restored') return;
    const { hud, view } = this.host;
    const here = this.host.area();
    const before = this.last;
    const now = this.last = meterOf(here.mess);
    hud.setTidy(now);
    if (now.kind === 'progress' && before.kind === 'progress') {
      const q = quarterPassed(before.pct, now.pct);
      if (q) { hud.pulseTidy(); view.feedback('chime', 'light'); view.toast(q === 75 ? '🧹 Nearly there!' : q === 50 ? '🧹 Halfway tidy!' : '🧹 A quarter tidy!'); }
    }
    if (now.kind === 'left' && (before.kind !== 'left' || now.left < before.left)) { hud.pulseTidy(); if (now.left <= 3) view.toast(`🧹 ${now.left} left!`); }
    if (now.kind === 'spotless' && before.kind !== 'spotless') this.spotless(here.id, here.name, before.kind === 'progress');
  }

  /** Every last spot: once per place per day, a cheer and a few Sparkles (just restored? the restore had its cheer). */
  private spotless(id: string, name: string, justRestored: boolean) {
    const { state, view, hud, world } = this.host;
    const r = markSpotless(state.spotless, id, this.host.day());
    state.spotless = r.state;
    hud.pulseTidy();
    if (!r.first || justRestored) return;
    const gift = spotlessSparkles();
    state.sparkles += gift;
    const f = this.host.feet();
    world.sparkleBurst(Math.floor(f.x / T), Math.floor(f.y / T) - 1, 24);
    world.cleanRing(Math.floor(f.x / T), Math.floor(f.y / T), true);
    view.feedback('combo', 'success');
    view.banner(`✨ ${this.host.content.named(name)} is spotless! +${gift} ✨`);
    this.host.hop();
    this.wholeTown();
    this.host.refreshHud();
  }

  /** Every restored place spotless today: the whole town shines, once a day. */
  private wholeTown() {
    const { state, view } = this.host;
    const day = this.host.day();
    if (state.has(`town_spotless_${day}`) || !wholeTownSpotless(this.host.restored(), (id) => this.host.left(id))) return;
    state.flag(`town_spotless_${day}`);
    state.sparkles += TUNING.townSpotlessSparkles;
    view.feedback('fanfare', 'success');
    view.banner(`🌟 The whole town is spotless! +${TUNING.townSpotlessSparkles} ✨`);
  }
}
