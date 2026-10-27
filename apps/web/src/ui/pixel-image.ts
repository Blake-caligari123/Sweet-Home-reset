import { drawPuff, PUFF_CLIPS, type Outfit } from '../art/puff';
import type { PixelCanvas } from '../art/pixel-canvas';
import { h } from './dom';

/** A crisp pixel-art image in the DOM, scaled by a whole number with CSS. */
export function pixelImage(pc: PixelCanvas, scale: number, label?: string) {
  const canvas = h('canvas', { class: 'pixel', width: pc.width, height: pc.height, role: label ? 'img' : undefined, 'aria-label': label, 'aria-hidden': label ? undefined : 'true' });
  canvas.style.width = `${pc.width * scale}px`;
  canvas.style.height = `${pc.height * scale}px`;
  canvas.getContext('2d')!.putImageData(new ImageData(pc.data, pc.width, pc.height), 0, 0);
  return canvas;
}

/** Animated Puff for menus and the restored screen. */
export function puffPortrait(scale: number, outfit: Outfit, reducedMotion: boolean) {
  const canvas = h('canvas', { class: 'pixel puff-portrait', width: 48, height: 48, role: 'img', 'aria-label': 'Puff the dust bunny' });
  canvas.style.width = `${48 * scale}px`;
  canvas.style.height = `${48 * scale}px`;
  const ctx = canvas.getContext('2d')!;
  const cache = new Map<string, ImageData>();
  const frame = (clip: string, i: number) => {
    const key = `${clip}:${i}`;
    let img = cache.get(key);
    if (!img) { const pc = drawPuff(PUFF_CLIPS[clip][i], outfit); img = new ImageData(pc.data, 48, 48); cache.set(key, img); }
    ctx.clearRect(0, 0, 48, 48);
    ctx.putImageData(img, 0, 0);
  };
  let clip = 'idle'; let i = 0; let repeats = 0; let tick = 0;
  frame('idle', 0);
  const timer = window.setInterval(() => {
    if (!canvas.isConnected) { window.clearInterval(timer); return; }
    tick += 1;
    const list = PUFF_CLIPS[clip];
    if (clip === 'idle') {
      if (reducedMotion) { frame('idle', 0); return; }
      if (tick % 2) return;
      if (Math.random() < 0.06) { frame('blink', 1); return; }
    }
    i += 1;
    if (i >= list.length) { i = 0; repeats -= 1; if (repeats <= 0) clip = 'idle'; }
    frame(clip, Math.min(i, PUFF_CLIPS[clip].length - 1));
  }, 90);
  return {
    el: canvas,
    play(name: 'hop' | 'spin' | 'sleepy', times = 2) { clip = name; i = 0; repeats = reducedMotion ? 1 : times; }
  };
}
