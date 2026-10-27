import { Application, TextureStyle } from 'pixi.js';
import { Sound } from './fx/sound';
import { GameApp } from './game-app';
import { validatePack, type Pack } from './game/pack';
import { migrate } from './game/profile';
import { loadSave } from './game/storage';
import { loadNativeBridge } from './native';
import './style.css';

const host = document.querySelector<HTMLElement>('#app')!;
const ui = document.querySelector<HTMLElement>('#ui')!;

const native = await loadNativeBridge();
void native.setup();

if (!native.isNative && import.meta.env.PROD) {
  // Native builds load files from the app bundle, so only the web build needs a service worker.
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

// Pixel art: nearest-neighbour everywhere, whole-pixel positions.
TextureStyle.defaultOptions.scaleMode = 'nearest';

async function loadPack(): Promise<Pack | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}packs-bundled/starter-home/2/pack.json`);
    return validatePack(await response.json());
  } catch {
    return null;
  }
}

const [pack, saved] = await Promise.all([loadPack(), loadSave()]);
if (!pack) {
  ui.innerHTML = '<main class="screen title-screen"><div class="panel title-card"><h1 class="logo">Sweet Home Reset</h1><p>This room is tidying itself. Try again in a moment.</p><button class="btn primary" onclick="location.reload()">Try again</button></div></main>';
  throw new Error('Starter pack could not be loaded');
}

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const profile = migrate(saved, reducedMotion);

const app = new Application();
await app.init({
  resizeTo: window,
  background: '#F9EDC2',
  antialias: false,
  autoDensity: true,
  roundPixels: true,
  resolution: Math.min(window.devicePixelRatio || 1, 3)
});
app.canvas.setAttribute('aria-label', 'Room. Drag to scrub, tap dust bunnies, drag clutter to where it belongs. Arrow keys move the brush and Space scrubs.');
app.canvas.setAttribute('role', 'application');
app.canvas.tabIndex = 0;
host.append(app.canvas);

const sound = new Sound();
sound.enabled = profile.settings.sound;
sound.musicOn = profile.settings.music;
document.addEventListener('pointerdown', () => sound.unlock(), { capture: true });
document.addEventListener('keydown', () => sound.unlock(), { capture: true });

const game = new GameApp(app, ui, pack, profile, native, sound);
void native.onBack(() => game.back());
void native.onActiveChange((active) => { if (!active) game.background(); else sound.startMusic(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) sound.startMusic(); });
window.addEventListener('pagehide', () => game.saveNow());
game.start();
