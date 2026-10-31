import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { dullen } from '../../shared/art/dull';
import { PixelCanvas } from '../../shared/art/pixel-canvas';
import { toTexture } from '../../shared/render/textures';
import type { Area } from '../data/area';
import { FULL_COLOUR } from '../play/mess';
import { drawProp, propShadow } from './art/props';
import { seasonal } from './art/seasons';
import { T } from './art/texture';
import { paintedArea } from './backgrounds';

// Height and layers (NEXT-PHASE §5.12: things passing in front and behind). Tall things are
// baked into the ground like everything else, so on their own Puff would always walk over them.
// Each also gets a copy standing among the actors, sorted by its foot: walk behind a tree and its
// leaves are in front of Puff; walk in front and Puff is. The copy greys with the ground under it.
// A painting is one picture, so there it's the decor Puff placed that stands among the actors (it's
// the only place it's drawn).

const TALL = new Set(['tree', 'fruit_tree', 'lamppost']);
/** How far a tall prop's art reaches past its tiles: sideways, and up. */
const SPILL_X = 6; const SPILL_UP = 16;

interface Front { colour: Sprite; dull: Sprite; tile: number }

export class Fronts {
  private items: Front[] = [];
  private owned: Texture[] = [];

  constructor(private actors: Container) {}

  /** Stand up copies of this area's tall things, or in a painted area its placed decor. */
  load(area: Area, season: string) {
    for (const f of this.items) { f.colour.destroy(); f.dull.destroy(); }
    for (const t of this.owned) t.destroy(true);
    this.items = []; this.owned = [];
    const painted = !!paintedArea(area.pack.id);
    const tall = area.pack.props.filter((p) => (painted ? p.action === 'decor' : TALL.has(p.type)));
    if (!tall.length) return;
    // Drawn on one area-sized canvas, exactly as baked (same places, same leaves), then cut out.
    const pc = new PixelCanvas(area.w * T, area.h * T);
    [...tall].sort((a, b) => (a.y + (a.h ?? 1)) - (b.y + (b.h ?? 1))).forEach((p) => { if (painted) propShadow(pc, p); drawProp(pc, p); });
    const colour = toTexture(area.pack.kind === 'outdoor' ? seasonal(pc, season) : pc);
    const dull = toTexture(dullen(pc));
    this.owned.push(colour, dull);
    for (const p of tall) {
      const w = p.w ?? 1; const h = p.h ?? 1;
      const x0 = Math.max(0, p.x * T - SPILL_X); const y0 = Math.max(0, p.y * T - SPILL_UP);
      const frame = new Rectangle(x0, y0, Math.min(area.w * T, (p.x + w) * T + SPILL_X) - x0, (p.y + h) * T - y0);
      const make = (src: Texture) => {
        const s = new Sprite(new Texture({ source: src.source, frame }));
        s.position.set(x0, y0); s.zIndex = (p.y + h) * T - 2; s.eventMode = 'none';
        this.actors.addChild(s);
        return s;
      };
      this.items.push({ colour: make(colour), dull: make(dull), tile: (p.y + h - 1) * area.w + p.x });
    }
  }

  /** Grey each copy as much as the ground at its foot (`level` is that tile's colour now). */
  shade(level: (tile: number) => number) {
    for (const f of this.items) {
      f.dull.alpha = Math.max(0, Math.min(1, (FULL_COLOUR - level(f.tile)) / FULL_COLOUR));
      f.dull.visible = f.dull.alpha > 0;
    }
  }
}
