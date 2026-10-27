import { Application, TextureStyle } from 'pixi.js';
import { Sound } from '../fx/sound';
import { loadNativeBridge } from '../native';
import { h } from '../ui/dom';
import { puffPortrait } from '../ui/pixel-image';
import { validateTownPack, type TownPack } from './area';
import { TownGame } from './game';
import { loadTown } from './save';
import { TUNING } from './tuning';
import '../style.css';
import './town.css';

// Milestone 1 test build of the GDD v3 town game, served at /test/ while the room game
// keeps the main link (GDD v3 A1).
const host = document.querySelector<HTMLElement>('#app')!;
const ui = document.querySelector<HTMLElement>('#ui')!;

const native = await loadNativeBridge();
void native.setup();
TextureStyle.defaultOptions.scaleMode = 'nearest';

async function loadPack(): Promise<TownPack | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}packs-bundled/hollowfern/1/pack.json`);
    return validateTownPack(await res.json());
  } catch (e) {
    console.warn('Town pack could not load', e);
    return null;
  }
}

const [pack, saved] = await Promise.all([loadPack(), loadTown()]);
if (!pack) {
  ui.append(h('main', { class: 'screen title-screen' }, h('div', { class: 'panel title-card' }, h('h1', { class: 'logo' }, 'Sweet Home Reset'), h('p', {}, 'The town is tidying itself. Try again in a moment.'))));
  throw new Error('pack');
}

const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const settings = saved?.settings ?? { sound: true, music: true, haptics: true, reducedMotion: reduced, relaxed: false, autoTool: true };
document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);

const sound = new Sound();
sound.enabled = settings.sound;
sound.musicOn = settings.music;
document.addEventListener('pointerdown', () => sound.unlock(), { capture: true });
document.addEventListener('keydown', () => sound.unlock(), { capture: true });

const app = new Application();
await app.init({ resizeTo: window, background: '#534239', antialias: false, autoDensity: true, roundPixels: true, resolution: Math.min(window.devicePixelRatio || 1, 3) });
app.canvas.setAttribute('aria-label', `${TUNING.townName}. Tap the ground to walk, tap mess to clean it.`);
app.canvas.tabIndex = 0;
host.append(app.canvas);

function start() {
  const game = new TownGame(app, ui, pack!, native, sound, settings, saved);
  void native.onBack(() => game.back());
  const flush = () => void game.save(false);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { flush(); sound.stopMusic(); } else sound.startMusic(); });
  window.addEventListener('pagehide', flush);
}

if (saved) start();
else {
  // Title (A6 0:00): "Let's tidy!" and nothing else in the way.
  const puff = puffPortrait(4, null, settings.reducedMotion);
  const go = h('button', { class: 'btn primary big', type: 'button' }, 'Let\'s tidy!');
  const title = h('main', { class: 'screen title-screen' }, h('div', { class: 'panel title-card' }, puff.el,
    h('h1', { class: 'logo' }, h('small', {}, TUNING.townName), 'Sweet Home Reset'),
    h('p', { class: 'muted' }, 'Help a sleepy little town get its sparkle back, one messy home at a time.'),
    go,
    h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'Spring is free. Milestone 1 test build.')));
  go.addEventListener('click', () => { sound.unlock(); title.remove(); start(); });
  ui.append(title);
}
