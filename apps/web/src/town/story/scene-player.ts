import { Graphics } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import { FEET_TO_BASE } from '../play/targets';
import { T } from '../world/art/texture';
import { FEET } from '../world/nav';
import type { NeighbourView, World } from '../world/world';
import { along, colourAt, hidesMess, type SceneBeat, type SceneDef } from './scenes';

export interface ScenePlayerHost {
  world: World; ui: HTMLElement; content: Content;
  reducedMotion(): boolean;
  /** Show a place as it stands, without moving Puff or touching the save. */
  show(area: string): void;
  /** Back to play, where Puff was. */
  resume(): void;
}

/** A tile's foot point in world px (where a character stands). */
const foot = (x: number, y: number) => ({ x: x * T + T / 2, y: y * T + FEET + FEET_TO_BASE });

/**
 * Plays a cutscene in the town itself: each beat shows its place and time, glides the camera,
 * walks the characters, sweeps the colour and holds a caption. Tap for the next caption; Skip ends
 * it. While it plays, the game's own loop stands still (game.ts asks `playing`).
 */
export class ScenePlayer {
  private run: { scene: SceneDef; beat: number; ms: number; done: () => void; caption: HTMLElement; overlay: HTMLElement; area: string } | null = null;
  private sparkle = new Graphics();

  constructor(private host: ScenePlayerHost) {
    this.sparkle.circle(0, 0, 9).fill({ color: P.butterLight, alpha: 0.25 }).circle(0, 0, 5).fill({ color: P.butterLight, alpha: 0.6 }).circle(0, 0, 2.5).fill(P.white);
    this.sparkle.blendMode = 'add'; this.sparkle.visible = false;
    host.world.glows.addChild(this.sparkle);
  }

  get playing() { return !!this.run; }

  /** Play a scene from the pack; `done` runs when it ends or is skipped. Unknown scenes end at once. */
  play(id: string, done: () => void) {
    const scene = this.host.content.pack.scenes?.find((s) => s.id === id);
    if (!scene) { done(); return; }
    const caption = h('p', { class: 'scene-caption', 'aria-live': 'polite' });
    const skip = h('button', { class: 'btn small scene-skip', type: 'button' }, 'Skip');
    const overlay = h('div', { class: 'scene', role: 'dialog', 'aria-label': 'Story' }, skip, caption);
    overlay.addEventListener('click', (e) => { if (e.target === skip) this.finish(); else this.next(); });
    this.host.ui.append(overlay);
    this.host.ui.classList.add('scene-playing');
    this.run = { scene, beat: -1, ms: 0, done, caption, overlay, area: '' };
    this.next();
  }

  tick(dt: number) {
    const r = this.run;
    if (!r) return;
    r.ms += dt;
    const b = r.scene.beats[r.beat];
    if (r.ms >= b.ms) { this.next(); return; }
    this.draw(b, r.ms / b.ms, dt);
  }

  private next() {
    const r = this.run;
    if (!r) return;
    r.beat += 1; r.ms = 0;
    const b = r.scene.beats[r.beat];
    if (!b) { this.finish(); return; }
    const { world, content } = this.host;
    if (b.area !== r.area) { this.host.show(b.area); r.area = b.area; }
    world.showMess(!hidesMess(b));
    world.setTint(b.minutes);
    r.caption.textContent = content.line(b.caption) ?? '';
    this.draw(b, 0, 0);
  }

  private draw(b: SceneBeat, t: number, dt: number) {
    const { world, content } = this.host;
    const still = this.host.reducedMotion();
    // With reduced motion the camera and characters cut to where they're going instead of gliding.
    const k = still ? (b.to ? 1 : 0) : t;
    const [cx, cy] = along(b.at, b.to, k);
    world.follow(cx * T + T / 2, cy * T + T / 2, true);
    const width = content.pack.areas.find((a) => a.id === b.area)?.map[0].length ?? 1;
    world.setSceneColour((x) => colourAt(b.colour, x, width, t));
    const views: NeighbourView[] = [];
    let puff = false;
    for (const a of b.actors ?? []) {
      const [x, y] = along([a.x, a.y], a.to, still ? (a.to ? 1 : 0) : t);
      const at = foot(x, y);
      const walking = !!a.to && t < 1 && !still;
      const dir = a.dir ?? 'down';
      if (a.who === 'puff') { puff = true; world.drawPuff({ ...at, dir, pose: 'idle', tool: null }, dt); continue; }
      const def = content.neighbour(a.who);
      const look = a.species && a.colours ? { species: a.species, colours: a.colours } : def ? { species: def.species, colours: def.colours } : null;
      if (look) views.push({ id: `scene_${a.who}`, ...look, ...at, dir, pose: a.sleep ? 'sleep' : walking ? 'walk' : 'idle' });
    }
    world.showPuff(puff);
    world.drawNeighbours(views);
    this.sparkle.visible = !!b.sparkle;
    if (b.sparkle) {
      const [sx, sy] = along(b.sparkle, b.sparkleTo, t);
      const rise = Math.sin(Math.min(1, t * 1.6) * Math.PI) * 18; // up out of the water, then drifting down
      this.sparkle.position.set(sx * T + T / 2, sy * T + T / 2 - rise);
      this.sparkle.alpha = still ? 1 : 0.6 + 0.4 * Math.sin(t * 40);
    }
  }

  private finish() {
    const r = this.run;
    if (!r) return;
    this.run = null;
    r.overlay.remove();
    this.host.ui.classList.remove('scene-playing');
    this.sparkle.visible = false;
    const { world } = this.host;
    world.drawNeighbours([]);
    world.showMess(true); world.showPuff(true);
    this.host.resume();
    world.setSceneColour(null);
    r.done();
  }
}
