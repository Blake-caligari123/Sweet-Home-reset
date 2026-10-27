import { P } from './palette';
import { PixelCanvas } from './pixel-canvas';
import { PROPS } from './props';
import { ROOM_H, ROOM_W, type DecorDef, type LayerDef, type RoomDef, type StageEffect } from '../game/pack';

function drawWall(pc: PixelCanvas, room: RoomDef) {
  const { wall, wallAccent, wallPattern, wallHeight } = room.theme;
  pc.rect(0, 0, ROOM_W, wallHeight, wall);
  if (wallPattern === 'stripes') {
    for (let x = 6; x < ROOM_W; x += 14) pc.rect(x, 0, 4, wallHeight, wallAccent);
  } else if (wallPattern === 'dots') {
    for (let y = 6; y < wallHeight - 8; y += 12) for (let x = (y / 12) % 2 ? 4 : 10; x < ROOM_W; x += 12) pc.rect(x, y, 2, 2, wallAccent);
  }
  // Skirting board where the wall meets the floor.
  pc.rect(0, wallHeight - 6, ROOM_W, 6, P.cream);
  pc.hline(0, wallHeight - 7, ROOM_W, P.outline);
  pc.hline(0, wallHeight - 1, ROOM_W, P.outline);
}

function drawFloor(pc: PixelCanvas, room: RoomDef) {
  const { floor, floorA, floorB, wallHeight } = room.theme;
  if (floor === 'tiles') {
    const size = 15;
    for (let y = wallHeight; y < ROOM_H; y += 1) {
      for (let x = 0; x < ROOM_W; x += 1) {
        const tile = (Math.floor(x / size) + Math.floor((y - wallHeight) / size)) % 2;
        pc.set(x, y, tile ? floorB : floorA);
      }
    }
  } else {
    pc.rect(0, wallHeight, ROOM_W, ROOM_H - wallHeight, floorA);
    for (let y = wallHeight, row = 0; y < ROOM_H; y += 11, row += 1) {
      pc.hline(0, y, ROOM_W, floorB);
      for (let x = (row % 3) * 23; x < ROOM_W; x += 60) pc.vline(x, y, 11, floorB);
    }
  }
}

export function drawLayer(pc: PixelCanvas, layer: LayerDef | DecorDef, variant?: string) {
  const draw = PROPS[layer.prop];
  if (!draw) return;
  draw(pc, { ...layer, variant: variant ?? (layer as LayerDef).variant });
}

/** The clean room: wall, floor and furniture. Stage swaps and decor are separate overlays. */
export function drawRoom(room: RoomDef) {
  const pc = new PixelCanvas(ROOM_W, ROOM_H);
  drawFloor(pc, room);
  drawWall(pc, room);
  room.layers.forEach((layer) => drawLayer(pc, layer));
  return pc;
}

/** A transparent overlay for one stage effect that is a still image (swap or sunbeam). */
export function drawStageOverlay(room: RoomDef, effect: StageEffect) {
  const pc = new PixelCanvas(ROOM_W, ROOM_H);
  if (effect.effect === 'swap') {
    const layer = room.layers.find((l) => l.id === effect.layer);
    if (layer) drawLayer(pc, layer, effect.variant);
  } else if (effect.effect === 'sunbeam') {
    // A slanted shaft of light from the window down across the floor.
    for (let j = 0; j < effect.h; j += 1) {
      const shift = Math.round(j * 0.45);
      const fade = j > effect.h * 0.75 ? 70 : 110;
      for (let i = 0; i < effect.w; i += 1) pc.set(effect.x + i + shift, effect.y + j, i < 4 || i > effect.w - 5 ? P.butterLight : P.butter, fade);
    }
  } else if (effect.effect === 'glow') {
    pc.ellipse(effect.x, effect.y, effect.r, Math.round(effect.r * 0.7), P.butter, 70);
    pc.ellipse(effect.x, effect.y, Math.round(effect.r * 0.66), Math.round(effect.r * 0.46), P.butterLight, 120);
    pc.ellipse(effect.x, effect.y, Math.round(effect.r * 0.33), Math.round(effect.r * 0.23), P.white, 120);
  }
  return pc;
}

export function drawDecor(decor: DecorDef[]) {
  const pc = new PixelCanvas(ROOM_W, ROOM_H);
  decor.forEach((d) => drawLayer(pc, d));
  return pc;
}
