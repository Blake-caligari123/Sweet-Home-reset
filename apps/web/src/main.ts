import { Application } from 'pixi.js';
import { hapticForStage, loadNativeBridge } from './native';
import { createPauseController } from './pause';
import { createRoomScene } from './room-scene';
import './style.css';

const host = document.querySelector<HTMLElement>('#app');
if (!host) throw new Error('Missing #app host');

const native = await loadNativeBridge();
void native.setup();

if (!native.isNative && import.meta.env.PROD) {
  // Native builds load files from the app bundle, so only the web build needs a service worker.
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}

const app = new Application();
await app.init({
  background: '#f5e7c6',
  resizeTo: window,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2)
});

app.canvas.setAttribute('aria-label', 'Sweet Home Reset game. Drag across the dusty counter to clean it.');
app.canvas.setAttribute('role', 'application');
app.canvas.tabIndex = 0;
host.append(app.canvas);

const status = document.createElement('p');
status.className = 'sr-only';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
host.append(status);

const room = createRoomScene(
  app,
  (announcement) => { status.textContent = announcement; },
  (stage) => { void native.haptic(hapticForStage(stage)); }
);
app.stage.addChild(room.container);

const pauseOverlay = document.createElement('div');
pauseOverlay.className = 'pause';
pauseOverlay.hidden = true;
pauseOverlay.setAttribute('role', 'dialog');
pauseOverlay.setAttribute('aria-modal', 'true');
pauseOverlay.setAttribute('aria-labelledby', 'pause-title');
pauseOverlay.innerHTML = '<div class="pause__card"><h2 id="pause-title">Taking a breather</h2><p>Your room will be right here.</p><button type="button">Keep cleaning</button></div>';
host.append(pauseOverlay);
const resumeButton = pauseOverlay.querySelector('button')!;

const pause = createPauseController({
  onChange(paused) {
    pauseOverlay.hidden = !paused;
    if (paused) {
      app.ticker.stop();
      resumeButton.focus();
    } else {
      app.ticker.start();
      app.canvas.focus();
    }
  },
  minimize: () => { void native.minimize(); }
});

resumeButton.addEventListener('click', () => pause.resume());
window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (pause.paused) pause.resume();
  else pause.open();
});
void native.onBack(() => pause.back());
void native.onActiveChange((isActive) => { if (!isActive) pause.open(); });

function fitScene() {
  const { width, height } = app.screen;
  const scale = Math.min(width / room.width, height / room.height);
  room.container.scale.set(scale);
  room.container.position.set((width - room.width * scale) / 2, (height - room.height * scale) / 2);
}

fitScene();
window.addEventListener('resize', fitScene);
app.ticker.add((ticker) => room.update(ticker.lastTime));
