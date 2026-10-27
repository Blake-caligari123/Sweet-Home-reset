import { Rectangle, Texture } from 'pixi.js';
import type { PixelCanvas } from '../art/pixel-canvas';

export function toCanvas(pc: PixelCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = pc.width; canvas.height = pc.height;
  canvas.getContext('2d')!.putImageData(new ImageData(pc.data, pc.width, pc.height), 0, 0);
  return canvas;
}

export function toTexture(pc: PixelCanvas) {
  return Texture.from(toCanvas(pc));
}

export function subTextures(sheet: Texture, frames: { x: number; y: number }[], size: number) {
  return frames.map((f) => new Texture({ source: sheet.source, frame: new Rectangle(f.x, f.y, size, size) }));
}
