import { Application, TextureStyle } from 'pixi.js';
import { Sound } from '../fx/sound';
import { loadNativeBridge } from '../native';
import { FrameStats } from './frame-stats';
import { keepUpdated } from '../pwa-update';
import { h } from '../ui/dom';
import { puffPortrait } from '../ui/pixel-image';
import { validateTownPack, type TownPack } from './area';
import { loadBackgrounds } from './backgrounds';
import { TownGame } from './game';
import { loadTown } from './save';
import { SpriteBank } from './sprites';
import { TUNING } from './tuning';
import '../style.css';
import './town.css';

// Milestone 1 test build of the GDD v3 town game, served at /test/ while the room game
// keeps the main link (GDD v3 A1).
const host = document.querySelector<HTMLElement>('#app')!;
const ui = document.querySelector<HTMLElement>('#ui')!;

const native = await loadNativeBridge();
// Start fetching character sprite sheets now; the game swaps them in when they land.
const sprites = SpriteBank.load(import.meta.env.BASE_URL);
void native.setup();
// Native builds load files from the app bundle, so only the web build needs a service worker.
if (!native.isNative && import.meta.env.PROD) keepUpdated();
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
// Painted areas load (and make their grey twins) while the title shows; the game waits for them.
const backgrounds = pack ? loadBackgrounds(pack, import.meta.env.BASE_URL) : Promise.resolve();
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
// Chunky pixel art gains nothing above 2x density, and 3x phones would push 2.25x the pixels every
// frame (the main cause of stutter on mid-range phones); the world scale stays a whole number.
await app.init({ resizeTo: window, background: '#534239', antialias: false, autoDensity: true, roundPixels: true, resolution: Math.min(window.devicePixelRatio || 1, 2) });
app.canvas.setAttribute('aria-label', `${TUNING.townName}. Tap the ground to walk, tap mess to clean it.`);
app.canvas.tabIndex = 0;
host.append(app.canvas);

async function start() {
  await backgrounds;
  const game = new TownGame(app, ui, pack!, native, sound, settings, saved);
  void sprites.then((bank) => game.setSprites(bank));
  if (new URLSearchParams(location.search).has('fps')) showFrameStats();
  void native.onBack(() => game.back());
  const flush = () => void game.save(false);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { flush(); sound.stopMusic(); } else sound.startMusic(); });
  window.addEventListener('pagehide', flush);
}

/** ?fps: a small corner readout of frame rate and the worst stall each second, for testers. */
function showFrameStats() {
  const stats = new FrameStats();
  const el = h('div', { style: { position: 'fixed', left: '6px', top: '50%', zIndex: '99', font: '12px/1.3 monospace', background: 'rgba(0,0,0,.6)', color: '#fff', padding: '3px 6px', borderRadius: '4px', pointerEvents: 'none' } });
  document.body.append(el);
  app.ticker.add((t) => stats.push(t.deltaMS));
  window.setInterval(() => { const s = stats.take(); el.textContent = `${s.fps} fps · worst ${s.worstMs} ms · stalls ${s.stalls} · ${app.renderer.resolution}x`; }, 1000);
}

if (saved) void start();
else {
  // Title (A6 0:00): "Let's tidy!" and nothing else in the way.
  const puff = puffPortrait(4, null, settings.reducedMotion);
  const go = h('button', { class: 'btn primary big', type: 'button' }, 'Let\'s tidy!');
  const title = h('main', { class: 'screen title-screen' }, h('div', { class: 'panel title-card' }, puff.el,
    h('h1', { class: 'logo' }, h('small', {}, TUNING.townName), 'Sweet Home Reset'),
    h('p', { class: 'muted' }, 'Help a sleepy little town get its sparkle back, one messy home at a time.'),
    go,
    h('p', { class: 'muted', style: { fontSize: '0.85rem' } }, 'Spring is free. Milestone 1 test build.')));
  go.addEventListener('click', () => { sound.unlock(); title.remove(); void start(); });
  ui.append(title);
}
