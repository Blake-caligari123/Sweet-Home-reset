import { Application } from 'pixi.js';
import { createRoomScene } from './room-scene';
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

app.canvas.setAttribute('aria-label', 'Sweet Home Reset game. Drag across the dusty counter to clean it.');
app.canvas.setAttribute('role', 'application');
app.canvas.tabIndex = 0;
host.append(app.canvas);

const status = document.createElement('p');
status.className = 'sr-only';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
host.append(status);

const room = createRoomScene(app, (announcement) => { status.textContent = announcement; });
app.stage.addChild(room.container);

function fitScene() {
  const { width, height } = app.screen;
  const scale = Math.min(width / room.width, height / room.height);
  room.container.scale.set(scale);
  room.container.position.set((width - room.width * scale) / 2, (height - room.height * scale) / 2);
}

fitScene();
window.addEventListener('resize', fitScene);
app.ticker.add((ticker) => room.update(ticker.lastTime));
