import { Application, Rectangle } from 'pixi.js';
import { createHomeScene } from './home-scene';
import { createRoomScene } from './room-scene';
import type { GameScene } from './scene';
import './style.css';

const host = document.querySelector<HTMLElement>('#app');
if (!host) throw new Error('Missing #app host');

const app = new Application();
await app.init({
  background: '#f5e7c6',
  resizeTo: window,
  antialias: true,
  autoDensity: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2)
});

app.canvas.setAttribute('role', 'application');
app.canvas.tabIndex = 0;
host.append(app.canvas);

const status = document.createElement('p');
status.className = 'sr-only';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
host.append(status);

app.stage.eventMode = 'static';
app.stage.hitArea = new Rectangle(-10000, -10000, 20000, 20000);

let current: GameScene | undefined;

function fitScene() {
  if (!current) return;
  const { width, height } = app.screen;
  const scale = Math.min(width / current.width, height / current.height);
  current.container.scale.set(scale);
  current.container.position.set((width - current.width * scale) / 2, (height - current.height * scale) / 2);
}

function announce(message: string) {
  status.textContent = message;
}

function mount(next: GameScene) {
  const previous = current;
  current = next;
  if (previous) {
    app.stage.removeChild(previous.container);
    previous.destroy();
  }
  app.stage.addChild(next.container);
  app.canvas.setAttribute('aria-label', next.label);
  status.textContent = next.label;
  fitScene();
}

function showHome() {
  mount(createHomeScene(app, announce, (roomId) => {
    if (roomId === 'kitchen-nook') showKitchen();
  }));
}

function showKitchen() {
  mount(createRoomScene(app, announce, showHome));
}

showHome();
window.addEventListener('resize', fitScene);
app.ticker.add((ticker) => current?.update(ticker.lastTime));
