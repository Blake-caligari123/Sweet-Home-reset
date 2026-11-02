import { Rectangle, type Application } from 'pixi.js';
import { shareFile } from '../../shared/share/clip';
import { h } from '../../shared/ui/dom';
import type { View } from './view';

export interface PhotoHost { app: Application; view: View; ui: HTMLElement;
  /** The caption under the picture: the place and the day. */
  caption(): string;
  /** The town's name, for the file and the share text. */
  town(): string }

const CREAM = '#fff8ec'; const INK = '#534239'; const BUTTER = '#f6e3a1';

/** Photo mode (a chill extra, 2 Nov): the HUD steps away, a parchment frame and caption go round the view, and Puff can still walk about to pose. Snap saves or shares it. */
export function openPhoto(p: PhotoHost) {
  const { view, ui } = p;
  let framed = true;
  const frame = h('div', { class: 'photo-frame', 'aria-hidden': 'true' }, h('p', { class: 'photo-caption' }, p.caption()));
  const flash = h('div', { class: 'photo-flash', 'aria-hidden': 'true' });
  const snap = h('button', { class: 'btn primary', type: 'button' }, '📷 Snap');
  const toggle = h('button', { class: 'btn small', type: 'button' }, 'Frame: on');
  const done = h('button', { class: 'btn small', type: 'button' }, 'Done');
  const bar = h('div', { class: 'photo-bar' }, toggle, snap, done);
  const box = h('div', { class: 'photo-ui' }, frame, flash, bar);
  ui.classList.add('photo-mode');
  ui.append(box);
  toggle.addEventListener('click', () => { view.uiTap(); framed = !framed; frame.hidden = !framed; toggle.textContent = `Frame: ${framed ? 'on' : 'off'}`; });
  done.addEventListener('click', () => { view.uiTap(); box.remove(); ui.classList.remove('photo-mode'); });
  snap.addEventListener('click', async () => {
    view.feedback('pop', 'light');
    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    const file = await picture(p, framed);
    if (file) await shareFile(file, `${p.caption()} ✨ #SweetHomeReset`);
  });
}

/** The world as it is now, with the frame and caption drawn round it. */
async function picture(p: PhotoHost, framed: boolean): Promise<File | null> {
  // Exactly what's on screen: the stage cropped to the view, at the screen's own sharpness.
  const world = p.app.renderer.extract.canvas({ target: p.app.stage, frame: new Rectangle(0, 0, p.app.screen.width, p.app.screen.height), resolution: p.app.renderer.resolution }) as HTMLCanvasElement;
  const pad = framed ? 24 : 0; const foot = framed ? 56 : 0;
  const c = document.createElement('canvas');
  c.width = world.width + pad * 2; c.height = world.height + pad * 2 + foot;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (framed) {
    ctx.fillStyle = INK; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = CREAM; ctx.fillRect(6, 6, c.width - 12, c.height - 12);
    // A running stitch round the edge, like the game's parchment.
    ctx.fillStyle = '#c5a691';
    for (let x = 14; x < c.width - 14; x += 12) { ctx.fillRect(x, 13, 6, 3); ctx.fillRect(x, c.height - 16, 6, 3); }
    for (let y = 14; y < c.height - 14; y += 12) { ctx.fillRect(13, y, 3, 6); ctx.fillRect(c.width - 16, y, 3, 6); }
  }
  ctx.drawImage(world, pad, pad);
  if (framed) {
    ctx.fillStyle = BUTTER; ctx.fillRect(pad, pad + world.height + 10, c.width - pad * 2, foot - 20);
    ctx.fillStyle = INK; ctx.font = '600 22px "Pixelify Sans", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText(p.caption(), c.width / 2, pad + world.height + foot / 2);
  }
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  return blob ? new File([blob], `${p.town().toLowerCase().replace(/\W+/g, '-')}-photo.png`, { type: 'image/png' }) : null;
}
