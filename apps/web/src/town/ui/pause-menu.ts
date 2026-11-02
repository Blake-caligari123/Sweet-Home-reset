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
  openJournal(): void;
  /** 🌿 Things to do (chill/ideas.ts). */
  openIdeas(): void;
  /** 📷 Photo mode (ui/photo-mode.ts). */
  openPhoto(): void;
  openSkills(): void;
  openNeeds(): void;
  /** The town's completion (bloom/completion.ts): its percentage, and the sheet. */
  completion: number;
  /** Puff's Keeper rank (bloom/completion.ts). */
  rank: string;
  openCompletion(): void;
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

/** The pause menu: the journal, the town, friends and collections up top; settings one tap away. */
export function openPause(d: PauseHost) {
  const { view } = d;
  if (view.root.querySelector('[data-sheet]')) return;
  const button = (label: string, open: () => void, extra: Record<string, unknown> = {}) => {
    const b = h('button', { class: 'btn', type: 'button', ...extra }, label);
    b.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); open(); });
    return b;
  };
  const body: Node[] = [];
  if (d.openTour) body.push(button('🧪 Feature tour', d.openTour, { class: 'btn primary', style: { width: '100%' } }));
  body.push(
    button('📔 Keeper\'s journal', d.openJournal, { class: 'btn primary', style: { width: '100%' } }),
    button('🌿 Things to do', d.openIdeas, { class: 'btn warm', style: { width: '100%' } }),
    h('p', { class: 'town-line' }, d.townLine),
    h('div', { class: 'btn-row', style: { width: '100%' } },
      button('♥ Friends', d.openFriends), button('📖 Collection', d.openCollection), button('✨ Skills', d.openSkills),
      button('🏘 Town', d.openNeeds), button('👒 Outfits', d.openOutfits), button('✎ Names', d.openNames), button('📷 Photo', d.openPhoto),
      button(`🎖 ${d.rank} · 🏆 ${d.completion}%`, d.openCompletion, { 'aria-label': `${d.rank}, completion ${d.completion}%` }))
  );
  // Settings open on top of Pause: closing them comes back here.
  const settings = h('button', { class: 'btn small', type: 'button' }, '⚙ Settings');
  settings.addEventListener('click', () => { view.uiTap(); openSettings(d); });
  body.push(settings);
  if (d.skipTips) {
    const skipTips = d.skipTips;
    const skip = h('button', { class: 'btn small', type: 'button' }, 'Skip the tips');
    skip.addEventListener('click', () => { skipTips(); skip.remove(); });
    body.push(skip);
  }
  view.sheet('Paused', body, undefined, 'Back to town');
}

/** Sound, controls, comfort and text; the account, purchases, about, and starting over. */
function openSettings(d: PauseHost) {
  const { view, settings: s } = d;
  const toggle = (key: SwitchKey, label: string) => {
    const b = h('button', { class: 'switch', role: 'switch', type: 'button', 'aria-checked': String(!!s[key]), 'aria-label': label });
    b.addEventListener('click', () => {
      s[key] = !s[key];
      b.setAttribute('aria-checked', String(!!s[key]));
      d.settingsChanged();
    });
    return h('div', { class: 'row' }, h('span', { class: 'label' }, label), b);
  };
  // A volume slider: 0 to 100%, saved as 0 to 1.
  const slider = (key: 'musicVolume' | 'soundVolume', label: string) => {
    const input = h('input', { class: 'volume', type: 'range', min: '0', max: '100', step: '5', value: String(Math.round((s[key] ?? 1) * 100)), 'aria-label': `${label} volume` }) as HTMLInputElement;
    input.addEventListener('input', () => { s[key] = Number(input.value) / 100; d.settingsChanged(); });
    return h('div', { class: 'row' }, h('span', { class: 'label' }, `${label} volume`), input);
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
  const small = (label: string, onClick: () => void) => {
    const b = h('button', { class: 'btn small', type: 'button' }, label);
    b.addEventListener('click', onClick);
    return b;
  };
  const leave = (open: () => void) => () => { view.uiTap(); view.closeTopSheet(); view.closeTopSheet(); open(); };
  const body: Node[] = [
    h('p', { class: 'friend-name' }, 'Sound'),
    h('div', { class: 'list' }, toggle('sound', 'Sound'), slider('soundVolume', 'Sound'), toggle('music', 'Music'), slider('musicVolume', 'Music'), toggle('haptics', 'Haptics')),
    h('p', { class: 'friend-name' }, 'Play'),
    h('div', { class: 'list' }, toggle('relaxed', 'Relaxed mode (half Fluff costs, no dozing off)'), toggle('autoTool', 'Pick the right tool for me'),
      toggle('tapOnly', 'Tap-only (one tap tidies a whole spot)'), toggle('joystick', 'Joystick (drag to walk)')),
    h('p', { class: 'friend-name' }, 'Comfort'),
    h('div', { class: 'list' }, textSize(), toggle('easyFont', 'Easy-read font'), toggle('highContrast', 'High contrast'), toggle('reducedMotion', 'Reduce motion'),
      // Builds with a server can send anonymous play counts, so only they show the switch.
      ...(d.openAccount ? [toggle('shareCounts', 'Share anonymous play counts')] : []))
  ];
  const more: Node[] = [];
  if (d.openAccount) more.push(small('Account', leave(d.openAccount)));
  if (d.restore) more.push(small('Restore purchases', leave(d.restore)));
  more.push(small('About', leave(() => openAbout(view))));
  body.push(h('div', { class: 'btn-row' }, ...more));
  // Only on a computer: phones and tablets have no keyboard to point at.
  if (window.matchMedia?.('(pointer: fine)').matches) body.push(h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, KEYS_HELP));
  const restart = small('Start over on this device', async () => { if (!window.confirm('Start a new game? This clears the town save on this device.')) return; await eraseTown(); location.reload(); });
  body.push(h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'Test build'), restart);
  view.sheet('⚙ Settings', body, undefined, 'Done');
}
