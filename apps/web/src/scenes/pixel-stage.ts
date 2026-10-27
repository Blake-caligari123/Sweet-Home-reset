import { ROOM_H, ROOM_W } from '../game/pack';

/**
 * Room rows that may sit off-screen on short screens. Kept at 0: the HUD already covers the top
 * of the wall and the bottom of the floor, so cropping as well hides too much of the room.
 */
export const CROP_TOP = 0;
export const CROP_BOTTOM = 0;

/**
 * Fit the 180×390 room by the largest whole number of *device* pixels per room pixel, so every
 * art pixel is the same size and stays crisp (FRONTEND-PLAN §15). Returns CSS pixels.
 */
export function fitStage(cssW: number, cssH: number, dpr: number) {
  const W = cssW * dpr; const H = cssH * dpr;
  const visible = ROOM_H - CROP_TOP - CROP_BOTTOM;
  const k = Math.max(1, Math.floor(Math.min(W / ROOM_W, H / visible)));
  const overflow = ROOM_H * k - H;
  const top = overflow <= 0 ? Math.round(-overflow / 2) : -Math.min(overflow, CROP_TOP * k);
  return { k, scale: k / dpr, x: Math.round((W - ROOM_W * k) / 2) / dpr, y: top / dpr };
}
