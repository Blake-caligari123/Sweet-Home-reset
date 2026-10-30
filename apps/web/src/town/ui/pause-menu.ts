import type { Sound } from '../../shared/audio/sound';
import { h } from '../../shared/ui/dom';
import { eraseTown } from '../data/save';
import { openAbout } from './about-sheet';
import { nextTextSize, textSizeOf } from './a11y';
import { KEYS_HELP } from './keyboard';
import type { Settings, View } from './view';

export interface PauseHost {
  view: View;
  settings: Settings;
  sound: Sound;
  /** Settings changed: apply what needs applying and save. */
  settingsChanged(): void;
  openFriends(): void;
  openNames(): void;
  openOutfits(): void;
  openCollection(): void;
  openSkills(): void;
  openNeeds(): void;
  /** The feature tour, on the test link only. */
  openTour: (() => void) | null;
  /** "Town Bloom: Waking · 3 of 8 finds". */
  townLine: string;
  /** Offered while onboarding can be skipped; skips the remaining tips. */
  skipTips: (() => void) | null;
  /** Restore purchases, in builds that sell the unlock. */
  restore: (() => void) | null;
  /** The optional account, in builds with a server. */
  openAccount: (() => void) | null;
}

/** The settings that are plain on/off switches. */
type SwitchKey = { [K in keyof Settings]-?: NonNullable<Settings[K]> extends boolean ? K : never }[keyof Settings];

/** The pause menu: Friends, names, settings, skip the tips, start over. */
export function openPause(d: PauseHost) {
  const { view, settings: s } = d;
  if (view.root.querySelector('[data-sheet]')) return;
  const toggle = (key: SwitchKey, label: string) => {
    const b = h('button', { class: 'switch', role: 'switch', type: 'button', 'aria-checked': String(!!s[key]), 'aria-label': label });
    b.addEventListener('click', () => {
      s[key] = !s[key];
      b.setAttribute('aria-checked', String(!!s[key]));
      d.settingsChanged();
    });
    return h('div', { class: 'row' }, h('span', { class: 'label' }, label), b);
  };
  // Text size steps through 100, 125 and 150%, so one button covers all three.
  const textSize = () => {
    const b = h('button', { class: 'btn small', type: 'button', 'aria-label': `Text size, ${textSizeOf(s)}%` }, `${textSizeOf(s)}%`);
    b.addEventListener('click', () => {
      s.textSize = nextTextSize(textSizeOf(s)); s.bigText = s.textSize > 100;
      b.textContent = `${s.textSize}%`; b.setAttribute('aria-label', `Text size, ${s.textSize}%`);
      d.settingsChanged();
    });
    return h('div', { class: 'row' }, h('span', { class: 'label' }, 'Text size'), b);
  };
  const friends = h('button', { class: 'btn', type: 'button' }, '♥ Friends');
  friends.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openFriends(); });
  const names = h('button', { class: 'btn', type: 'button' }, '✎ Names');
  names.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openNames(); });
  const outfits = h('button', { class: 'btn', type: 'button' }, '👒 Outfits');
  const collection = h('button', { class: 'btn', type: 'button' }, '📖 Collection');
  collection.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openCollection(); });
  const skills = h('button', { class: 'btn', type: 'button' }, '✨ Skills');
  skills.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openSkills(); });
  const town = h('button', { class: 'btn', type: 'button' }, '🏘 Town');
  town.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openNeeds(); });
  outfits.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openOutfits(); });
  const body: Node[] = [
    h('div', { class: 'btn-row', style: { width: '100%' } }, friends, names, outfits, collection, skills, town),
    h('div', { class: 'list' },
      toggle('sound', 'Sound'), toggle('music', 'Music'), toggle('haptics', 'Haptics'),
      toggle('reducedMotion', 'Reduce motion'), toggle('relaxed', 'Relaxed mode (half Fluff costs, no dozing off)'), toggle('autoTool', 'Pick the right tool for me'),
      toggle('tapOnly', 'Tap-only (one tap tidies a whole spot)'), toggle('joystick', 'Joystick (drag to walk)'), textSize(), toggle('highContrast', 'High contrast'))
  ];
  if (d.skipTips) {
    const skipTips = d.skipTips;
    const skip = h('button', { class: 'btn small', type: 'button' }, 'Skip the tips');
    skip.addEventListener('click', () => { skipTips(); skip.remove(); });
    body.push(skip);
  }
  // Builds with a server can send anonymous play counts, so only they show the switch.
  if (d.openAccount) body.push(h('div', { class: 'list' }, toggle('shareCounts', 'Share anonymous play counts')));
  if (d.openAccount) {
    const openAccount = d.openAccount;
    const b = h('button', { class: 'btn small', type: 'button' }, 'Account');
    b.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); openAccount(); });
    body.push(b);
  }
  if (d.restore) {
    const restore = d.restore;
    const b = h('button', { class: 'btn small', type: 'button' }, 'Restore purchases');
    b.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); restore(); });
    body.push(b);
  }
  const about = h('button', { class: 'btn small', type: 'button' }, 'About');
  about.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); openAbout(view); });
  body.push(about);
  const restart = h('button', { class: 'btn small', type: 'button' }, 'Start over on this device');
  restart.addEventListener('click', async () => { if (!window.confirm('Start a new game? This clears the town save on this device.')) return; await eraseTown(); location.reload(); });
  body.unshift(h('p', { class: 'town-line' }, d.townLine));
  if (d.openTour) {
    const openTour = d.openTour;
    const tour = h('button', { class: 'btn primary', type: 'button', style: { width: '100%' } }, '🧪 Feature tour');
    tour.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); openTour(); });
    body.unshift(tour);
  }
  // Only on a computer: phones and tablets have no keyboard to point at.
  if (window.matchMedia?.('(pointer: fine)').matches) body.push(h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, KEYS_HELP));
  body.push(h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'Test build'), restart);
  view.sheet('Paused', body);
}
