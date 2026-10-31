import { Container, Sprite, type Texture } from 'pixi.js';
import { toTexture } from '../../shared/render/textures';
import type { Content } from '../data/content';
import type { Clock } from '../play/clock';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { drawCritter } from '../world/art/critters';
import { T } from '../world/art/texture';
import type { TownAreas } from '../world/town-areas';
import { crittersHere, placeCritters, type CritterDef } from './critters';

export interface CritterHost {
  state: TownState; view: View; content: Content; clock: Clock; places: TownAreas;
  /** Where critters stand among the actors. */
  actors: Container;
  onboard(e: OnboardEvent): void;
}

/** How many critters a place has about at once. */
const PER_AREA = 2;

const textures = new Map<string, Texture>();
function critterTexture(def: CritterDef, frame: number) {
  const key = `${def.id}:${frame}`;
  let t = textures.get(key);
  if (!t) { t = toTexture(drawCritter(def.kind, def.colour, frame)); textures.set(key, t); }
  return t;
}

interface Shown { def: CritterDef; sprite: Sprite; x: number; y: number }

/** Critters in the place Puff is in: placed on arrival, gently moving, spotted with a tap. */
export class CritterLife {
  private shown: Shown[] = [];
  /** Spotted today (they flutter off for the rest of the day): `day:area:id`. */
  private gone = new Set<string>();
  private clock = 0;
  private area = '';
  reducedMotion = false;

  constructor(private host: CritterHost) {}

  entered(area: string) {
    for (const s of this.shown) s.sprite.destroy();
    this.shown = [];
    this.area = area;
    const { content, clock, places } = this.host;
    const a = places.get(area);
    if (!a || a.pack.kind !== 'outdoor') return;
    const day = clock.state.day;
    const here = crittersHere(content.pack.critters ?? [], area, clock.season, clock.state.minutes, clock.weather === 'rainy')
      .filter((c) => !this.gone.has(`${day}:${area}:${c.id}`));
    const spots: { x: number; y: number }[] = [];
    for (let y = 1; y < a.h - 1; y += 2) for (let x = 1; x < a.w - 1; x += 3) if (a.walkable(x, y)) spots.push({ x, y });
    for (const { def, at } of placeCritters(here, day, area, spots, PER_AREA)) {
      const sprite = new Sprite(critterTexture(def, 0));
      sprite.anchor.set(0.5, 1); sprite.eventMode = 'none';
      const x = at.x * T + T / 2; const y = at.y * T + T - 2;
      sprite.position.set(x, y); sprite.zIndex = y;
      this.host.actors.addChild(sprite);
      this.shown.push({ def, sprite, x, y });
    }
  }

  /** The critter under a tap, if any. */
  at(px: number, py: number) { return this.shown.find((s) => Math.abs(px - s.x) <= 10 && py <= s.y + 3 && py >= s.y - 16) ?? null; }

  /** Puff spots it: into the journal (the first time), and off it goes for today. */
  spot(s: Shown) {
    const { state, view, clock } = this.host;
    const first = !state.critters.includes(s.def.id);
    if (first) state.critters.push(s.def.id);
    this.gone.add(`${clock.state.day}:${this.area}:${s.def.id}`);
    s.sprite.destroy(); this.shown = this.shown.filter((x) => x !== s);
    view.feedback('chime', first ? 'success' : 'light');
    if (first) view.banner(`🐞 New critter: ${s.def.name}! 📖 Added to your Critter journal`);
    else view.say(`A ${s.def.name.toLowerCase()}! Hello again.`);
    this.host.onboard({ type: 'spotted', critter: s.def.id });
  }

  tick(dt: number) {
    this.clock += dt;
    const frame = this.reducedMotion ? 0 : Math.floor(this.clock / 300) % 2;
    for (const s of this.shown) {
      s.sprite.texture = critterTexture(s.def, frame);
      const fly = s.def.kind === 'butterfly' || s.def.kind === 'bee' || s.def.kind === 'firefly' || s.def.kind === 'dragonfly';
      s.sprite.y = s.y - (fly && !this.reducedMotion ? 4 + Math.sin(this.clock / 400 + s.x) * 3 : 0);
    }
  }
}
