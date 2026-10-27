import { Texture } from 'pixi.js';
import { dullen } from '../../shared/art/dull';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { T } from './art';
import type { TownPack } from '../data/area';

// Painted area backgrounds (Blake's Grok art, claude/SPRITE-SHEETS.md). Each painting comes with a
// grey twin for the colour reveal, made once here, and world-size pixel copies for the share clip.
// Loaded before the game starts; an area whose painting fails to load falls back to code-drawn tiles.
export interface Painted {
  colour: Texture;
  drained: Texture;
  /** Painting pixels per world pixel. */
  scale: number;
  world: { colour: PixelCanvas; drained: PixelCanvas };
}

const painted = new Map<string, Painted>();
export const paintedArea = (id: string) => painted.get(id);

function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

function toPixels(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  const pc = new PixelCanvas(w, h);
  pc.data.set(g.getImageData(0, 0, w, h).data);
  return pc;
}

function toCanvasTexture(pc: PixelCanvas) {
  const c = document.createElement('canvas'); c.width = pc.width; c.height = pc.height;
  c.getContext('2d')!.putImageData(new ImageData(pc.data, pc.width, pc.height), 0, 0);
  const t = Texture.from(c);
  t.source.scaleMode = 'linear';
  return t;
}

export async function loadBackgrounds(pack: TownPack, base: string) {
  await Promise.all(pack.areas.filter((a) => a.background).map(async (a) => {
    const bg = a.background!;
    try {
      const img = await loadImage(`${base}${bg.src}`);
      const w = a.map[0].length * T; const h = a.map.length * T;
      const full = toPixels(img, w * bg.scale, h * bg.scale);
      const small = toPixels(img, w, h);
      painted.set(a.id, {
        colour: toCanvasTexture(full), drained: toCanvasTexture(dullen(full)), scale: bg.scale,
        world: { colour: small, drained: dullen(small) }
      });
    } catch (e) { console.warn(`Painted background for ${a.id} skipped`, e); }
  }));
}
