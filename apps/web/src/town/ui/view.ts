import type { Sound, SoundId } from '../../shared/audio/sound';
import type { HapticKind, NativeBridge } from '../../shared/native';
import { h } from '../../shared/ui/dom';
import type { TownSave } from '../data/save';
import { dialogue, type Hud } from './hud';

export type Settings = TownSave['settings'];
export interface Button { label: string; primary?: boolean; onClick: () => void }
export type Speaker = { name: string; portrait: HTMLElement };

// Everything on screen over the world that features share: speech boxes, sheets, banners, Puff's
// bubble, sounds and haptics. While any box or sheet is open the game is held (`busy`): the clock,
// Puff and the neighbours wait.
export class View {
  private modal = 0;
  private bubbleMs = 0;

  constructor(
    readonly root: HTMLElement,
    readonly hud: Hud,
    private sound: Sound,
    private native: NativeBridge,
    /** The live settings object (the pause menu changes it in place). */
    private settings: Settings,
    /** How tidy the current area is, for the sound's brightness. */
    private progress: () => number
  ) {}

  get busy() { return this.modal > 0; }
  hold() { this.modal += 1; }
  release() { this.modal = Math.max(0, this.modal - 1); }

  /** Puff says something in the bubble over their head. */
  say(text: string) {
    if (!text) return;
    this.hud.bubble.textContent = text;
    this.hud.bubble.classList.add('show');
    this.hud.announce(`Puff: ${text}`);
    this.bubbleMs = 2600;
  }

  tick(dt: number) {
    if (this.bubbleMs > 0) { this.bubbleMs -= dt; if (this.bubbleMs <= 0) this.hud.bubble.classList.remove('show'); }
  }

  banner(text: string) {
    const el = h('div', { class: 'banner', 'aria-hidden': 'true' }, text);
    this.root.append(el);
    this.hud.announce(text);
    window.setTimeout(() => el.remove(), 1900);
  }

  feedback(soundId: SoundId, haptic: HapticKind | null) {
    if (this.settings.sound) this.sound.play(soundId, this.progress());
    if (haptic && this.settings.haptics) {
      if (!this.native.isNative && 'vibrate' in navigator) { try { navigator.vibrate(haptic === 'success' ? [30, 60, 30] : haptic === 'medium' ? [16] : [8]); } catch { /* ignore */ } }
      else void this.native.haptic(haptic);
    }
  }

  /** The soft tap every UI button makes. */
  uiTap() { this.sound.unlock(); if (this.settings.sound) this.sound.play('tap'); }

  /** A speech box that holds the game until one of its buttons is pressed. */
  ask(text: string, buttons: Button[], speaker?: Speaker) {
    this.hold();
    dialogue(this.root, text, { reducedMotion: this.settings.reducedMotion, speaker, buttons: buttons.map((b) => ({ ...b, onClick: () => { this.release(); b.onClick(); } })) });
  }

  /** One box of a longer sequence (a heart event): the caller holds and releases the game. */
  box(text: string, buttons: Button[], speaker?: Speaker) {
    return dialogue(this.root, text, { reducedMotion: this.settings.reducedMotion, speaker, buttons });
  }

  showDialogue(text: string) { this.ask(text, [{ label: 'OK', primary: true, onClick: () => {} }]); }

  confirm(text: string, yes: string, onYes: () => void) {
    this.ask(text, [{ label: yes, primary: true, onClick: onYes }, { label: 'Not yet', onClick: () => {} }]);
  }

  /** A sheet with a title and a Close button; returns a function that closes it. */
  sheet(title: string, body: Node[], onClose?: () => void) {
    this.hold();
    const closeBtn = h('button', { class: 'btn', type: 'button', 'data-close': '' }, 'Close');
    const el = h('div', { class: 'scrim center', 'data-sheet': '', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'panel sheet' }, h('h2', {}, title), ...body, closeBtn));
    const close = () => { el.remove(); this.release(); };
    closeBtn.addEventListener('click', () => { this.uiTap(); close(); onClose?.(); });
    this.root.append(el);
    window.setTimeout(() => closeBtn.focus(), 30);
    return close;
  }

  /** Close whatever sheet is on top (Android back, Escape); false when none is open. */
  closeTopSheet() {
    const sheets = this.root.querySelectorAll('[data-sheet]');
    const top = sheets[sheets.length - 1];
    if (!top) return false;
    (top.querySelector('[data-close]') as HTMLElement | null)?.click();
    return true;
  }
}
