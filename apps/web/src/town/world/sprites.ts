import { Assets, Rectangle, Texture } from 'pixi.js';
import type { Dir } from './art/characters';

// Character sprite sheets from claude/SPRITE-SHEETS.md, made by tools/process_asset.py --sheet and
// listed in public/sprites/manifest.json. Each is one row of frames with the feet on one baseline.
// Anything not in the manifest yet falls back to the code-drawn placeholder.
/** `scale`: texture pixels per world pixel for hi-res art (drawn at 1/scale); 1 or absent for pixel art. */
export interface SheetInfo { frames: number; w: number; h: number; scale?: number }
export interface SpriteManifest { version: 1; sheets: Record<string, SheetInfo> }

export type PuffPose = 'walk' | 'idle' | 'swing' | 'sleep' | 'hop';

/** Frames per second for each clip (animation timing, not gameplay tuning). */
export const CLIP_FPS: Record<PuffPose | 'blink', number> = { walk: 10, idle: 6, swing: 14, hop: 14, sleep: 2, blink: 12 };
/** The hop sheet is drawn on the ground; the game lifts Puff by these pixels per frame. */
export const HOP_LIFT = [0, 2, 4, 4, 2, 0];

/** One idle breath: how long a rise and fall takes, and how far Puff rises (fraction of height). */
export const BREATH_MS = 2200;
export const BREATH_RISE = 0.035;

/**
 * Idle breathing done in code (the drawn idle frames differ by less than a pixel at world size):
 * Puff stretches up a little and narrows a touch, feet planted. Returns [scaleX, scaleY].
 */
export function breathScale(ms: number): [number, number] {
  const k = (1 - Math.cos((ms / BREATH_MS) * Math.PI * 2)) / 2; // 0 → 1 → 0, eased
  return [1 - BREATH_RISE * 0.4 * k, 1 + BREATH_RISE * k];
}

/** `withTool`: the tool is drawn in the sheet, so the game doesn't draw its own on top. */
export interface Clip { name: string; mirror: boolean; hold?: number; lift?: number[]; withTool?: boolean }

const sideOf = (dir: Dir) => (dir === 'left' ? 'right' : dir);

/**
 * Which sheet plays for Puff in this direction and pose, or null for the code-drawn Puff.
 * Left is the right sheet mirrored. Idle without its own sheet holds walk frame 1; swing and hop
 * without theirs fall back to idle; dozing needs its own sheet (eyes closed). A per-tool swing
 * (puff_swing_sponge_right) wins over the generic one (puff_swing_right, tool drawn by the game).
 */
export function puffClip(dir: Dir, pose: PuffPose, has: (name: string) => boolean, tool?: string | null): Clip | null {
  const side = sideOf(dir); const mirror = dir === 'left';
  const own = (name: string): Clip | null => (has(name) ? { name, mirror } : null);
  switch (pose) {
    case 'walk': return own(`puff_walk_${side}`);
    case 'idle': return own(`puff_idle_${side}`) ?? (has(`puff_walk_${side}`) ? { name: `puff_walk_${side}`, mirror, hold: 0 } : null);
    case 'swing': {
      const toolSheet = tool && tool !== 'hands' ? own(`puff_swing_${tool}_${side}`) : null;
      return toolSheet ? { ...toolSheet, withTool: true } : own(`puff_swing_${side}`) ?? puffClip(dir, 'idle', has);
    }
    case 'hop': return has('puff_hop') ? { name: 'puff_hop', mirror: false, lift: HOP_LIFT } : puffClip(dir, 'idle', has);
    case 'sleep': return own('puff_doze');
  }
}

/** A neighbour's sheet (`hazel_walk_right` …), with Puff's fallbacks; null keeps them code-drawn. */
export function neighbourClip(id: string, dir: Dir, pose: 'walk' | 'idle' | 'sleep', has: (name: string) => boolean): Clip | null {
  const side = sideOf(dir); const mirror = dir === 'left';
  if (pose === 'sleep' && has(`${id}_sleep`)) return { name: `${id}_sleep`, mirror: false };
  if (pose === 'walk') return has(`${id}_walk_${side}`) ? { name: `${id}_walk_${side}`, mirror } : null;
  if (has(`${id}_idle_${side}`)) return { name: `${id}_idle_${side}`, mirror };
  return has(`${id}_walk_${side}`) ? { name: `${id}_walk_${side}`, mirror, hold: 0 } : null;
}

/** Which sheet and frame draws a mess tile: the item's own art for clutter, else a variant of the mess type. */
export function messSprite(type: string, tile: number, item: string | undefined, has: (name: string) => boolean, frames: (name: string) => number): { name: string; frame: number } | null {
  if (type === 'clutter' && item && has(`item_${item}`)) return { name: `item_${item}`, frame: 0 };
  const name = `mess_${type}`;
  if (!has(name)) return null;
  // Spread the variants so neighbouring tiles rarely match.
  return { name, frame: ((tile * 7) ^ (tile >> 3)) % frames(name) };
}

let iconBank: SpriteBank | null = null;
/** Sheets loaded for the game also draw the DOM icons (the bag). */
export function setIconBank(bank: SpriteBank) { iconBank = bank; }

/** A sprite frame as a canvas for the DOM, sized cssPx square; null until the sheet has loaded. */
export function spriteIcon(name: string, cssPx: number, label?: string): HTMLCanvasElement | null {
  const tex = iconBank?.frames(name)?.[0];
  const src = tex?.source.resource as CanvasImageSource | undefined;
  if (!tex || !src) return null;
  const c = document.createElement('canvas');
  c.width = tex.frame.width; c.height = tex.frame.height;
  c.getContext('2d')!.drawImage(src, tex.frame.x, tex.frame.y, tex.frame.width, tex.frame.height, 0, 0, tex.frame.width, tex.frame.height);
  c.style.width = `${cssPx}px`; c.style.height = `${cssPx}px`;
  if (label) { c.setAttribute('role', 'img'); c.setAttribute('aria-label', label); } else c.setAttribute('aria-hidden', 'true');
  return c;
}

/** The blink sheet for this facing, if there is one (blinks play over idle). */
export function blinkClip(dir: Dir, has: (name: string) => boolean): Clip | null {
  const name = `puff_blink_${sideOf(dir)}`;
  return has(name) ? { name, mirror: dir === 'left' } : null;
}

export class SpriteBank {
  private sheets = new Map<string, Texture[]>();
  private scales = new Map<string, number>();
  has = (name: string) => this.sheets.has(name);
  frames(name: string) { return this.sheets.get(name); }
  /** Texture pixels per world pixel for this sheet. */
  scale(name: string) { return this.scales.get(name) ?? 1; }

  /** Load every sheet in the manifest. A missing manifest or a bad sheet is skipped calmly. */
  static async load(base: string): Promise<SpriteBank> {
    const bank = new SpriteBank();
    let manifest: SpriteManifest;
    try {
      const res = await fetch(`${base}sprites/manifest.json`);
      if (!res.ok) return bank;
      manifest = await res.json() as SpriteManifest;
    } catch { return bank; }
    await Promise.all(Object.entries(manifest.sheets ?? {}).map(async ([name, info]) => {
      try {
        const sheet = await Assets.load<Texture>(`${base}sprites/${name}.png`);
        const scale = info.scale && info.scale > 1 ? info.scale : 1;
        // Hi-res art is shrunk on screen, so it filters smoothly; pixel art stays nearest-neighbour.
        sheet.source.scaleMode = scale > 1 ? 'linear' : 'nearest';
        if (sheet.width < info.w * info.frames || sheet.height < info.h) throw new Error('sheet smaller than its manifest entry');
        bank.scales.set(name, scale);
        bank.sheets.set(name, Array.from({ length: info.frames }, (_, i) => new Texture({ source: sheet.source, frame: new Rectangle(i * info.w, 0, info.w, info.h) })));
      } catch (e) { console.warn(`Sprite sheet ${name} skipped`, e); }
    }));
    return bank;
  }
}
