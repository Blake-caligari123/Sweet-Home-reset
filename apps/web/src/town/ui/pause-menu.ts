import type { Sound } from '../../shared/audio/sound';
import { h } from '../../shared/ui/dom';
import { eraseTown } from '../data/save';
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
  /** "Town Bloom: Waking · 3 of 8 finds". */
  townLine: string;
  /** Offered while onboarding can be skipped; skips the remaining tips. */
  skipTips: (() => void) | null;
}

/** The pause menu: Friends, names, settings, skip the tips, start over. */
export function openPause(d: PauseHost) {
  const { view, settings: s } = d;
  if (view.root.querySelector('[data-sheet]')) return;
  const toggle = (key: keyof Settings, label: string) => {
    const b = h('button', { class: 'switch', role: 'switch', type: 'button', 'aria-checked': String(!!s[key]), 'aria-label': label });
    b.addEventListener('click', () => {
      (s as Record<string, boolean>)[key] = !s[key];
      b.setAttribute('aria-checked', String(!!s[key]));
      d.settingsChanged();
    });
    return h('div', { class: 'row' }, h('span', { class: 'label' }, label), b);
  };
  const friends = h('button', { class: 'btn', type: 'button' }, '♥ Friends');
  friends.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openFriends(); });
  const names = h('button', { class: 'btn', type: 'button' }, '✎ Names');
  names.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openNames(); });
  const outfits = h('button', { class: 'btn', type: 'button' }, '👒 Outfits');
  outfits.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); d.openOutfits(); });
  const body: Node[] = [
    h('div', { class: 'btn-row', style: { width: '100%' } }, friends, names, outfits),
    h('div', { class: 'list' },
      toggle('sound', 'Sound'), toggle('music', 'Music'), toggle('haptics', 'Haptics'),
      toggle('reducedMotion', 'Reduce motion'), toggle('relaxed', 'Relaxed mode (half Fluff costs, no dozing off)'), toggle('autoTool', 'Pick the right tool for me'),
      toggle('tapOnly', 'Tap-only (one tap tidies a whole spot)'), toggle('bigText', 'Bigger text'), toggle('highContrast', 'High contrast'))
  ];
  if (d.skipTips) {
    const skipTips = d.skipTips;
    const skip = h('button', { class: 'btn small', type: 'button' }, 'Skip the tips');
    skip.addEventListener('click', () => { skipTips(); skip.remove(); });
    body.push(skip);
  }
  const restart = h('button', { class: 'btn small', type: 'button' }, 'Start over on this device');
  restart.addEventListener('click', async () => { if (!window.confirm('Start a new game? This clears the town save on this device.')) return; await eraseTown(); location.reload(); });
  body.unshift(h('p', { class: 'town-line' }, d.townLine));
  body.push(h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'Test build'), restart);
  view.sheet('Paused', body);
}
