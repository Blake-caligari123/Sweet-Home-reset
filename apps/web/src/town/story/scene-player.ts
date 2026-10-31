import { Graphics } from 'pixi.js';
import { P } from '../../shared/art/palette';
import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import { FEET_TO_BASE } from '../play/targets';
import { T } from '../world/art/texture';
import { FEET } from '../world/nav';
import type { NeighbourView, World } from '../world/world';
import { asleep, captionAt, colourAt, emotesAt, facing, fadeAt, glowAt, minutesAt, nextCaption, pointAt, showsMess, type SceneDef, type Shot } from './scenes';

export interface ScenePlayerHost {
  world: World; ui: HTMLElement; content: Content;
  reducedMotion(): boolean;
  /** Show a place as it stands, without moving Puff or touching the save. */
  show(area: string): void;
  /** Back to play, where Puff was (and the real season's sky). */
  resume(): void;
}

/** A tile's foot point in world px (where a character stands). */
const foot = (x: number, y: number) => ({ x: x * T + T / 2, y: y * T + FEET + FEET_TO_BASE });

/**
 * Plays a cutscene as one continuous take (story/scenes.ts): the camera follows the subject,
 * characters walk their paths, the grey ripples out, the sparkle drifts on, and captions change
 * with the action. Tap jumps to the next caption; Skip ends it. The game's own loop stands still.
 */
export class ScenePlayer {
  private run: { scene: SceneDef; shot: number; ms: number; done: () => void; caption: HTMLElement; dim: HTMLElement; bubbles: HTMLElement; overlay: HTMLElement; shown: string; said: string | null; bursts: Set<string> } | null = null;
  private sparkle = new Graphics();
  private glow = new Graphics();

  constructor(private host: ScenePlayerHost) {
    this.sparkle.circle(0, 0, 9).fill({ color: P.butterLight, alpha: 0.25 }).circle(0, 0, 5).fill({ color: P.butterLight, alpha: 0.6 }).circle(0, 0, 2.5).fill(P.white);
    this.sparkle.blendMode = 'add'; this.sparkle.visible = false;
    this.glow.blendMode = 'add';
    host.world.glows.addChild(this.glow, this.sparkle);
  }

  get playing() { return !!this.run; }

  /** Play a scene from the pack; `done` runs when it ends or is skipped. Unknown scenes end at once. */
  play(id: string, done: () => void) {
    const scene = this.host.content.pack.scenes?.find((s) => s.id === id);
    if (!scene) { done(); return; }
    const caption = h('p', { class: 'scene-caption', 'aria-live': 'polite' });
    const skip = h('button', { class: 'btn small scene-skip', type: 'button' }, 'Skip');
    const dim = h('div', { class: 'scene-dim' });
    const bubbles = h('div', { class: 'scene-bubbles', 'aria-hidden': 'true' });
    const overlay = h('div', { class: 'scene', role: 'dialog', 'aria-label': 'Story' }, bubbles, dim, skip, caption);
    overlay.addEventListener('click', (e) => { if (e.target === skip) this.finish(); else this.tapOn(); });
    this.host.ui.append(overlay);
    this.host.ui.classList.add('scene-playing');
    this.run = { scene, shot: 0, ms: 0, done, caption, dim, bubbles, overlay, shown: '', said: null, bursts: new Set() };
    this.draw(0);
  }

  tick(dt: number) {
    const r = this.run;
    if (!r) return;
    r.ms += dt;
    while (r.ms >= r.scene.shots[r.shot].ms) {
      r.ms -= r.scene.shots[r.shot].ms; r.shot += 1;
      if (r.shot >= r.scene.shots.length) { this.finish(); return; }
    }
    this.draw(dt);
  }

  /** A tap: on to the next caption (or the end). */
  private tapOn() {
    const r = this.run;
    if (!r) return;
    const next = nextCaption(r.scene, r.shot, r.ms);
    if (!next) { this.finish(); return; }
    r.shot = next.shot; r.ms = next.ms;
    this.draw(0);
  }

  private draw(dt: number) {
    const r = this.run!;
    const shot = r.scene.shots[r.shot];
    const { world, content } = this.host;
    const ms = r.ms;
    if (shot.area !== r.shown) {
      this.host.show(shot.area); r.shown = shot.area;
      world.showMess(showsMess(shot));
    }
    world.setSky(shot.season ?? 'Spring', false);
    world.setTint(minutesAt(shot, ms));
    world.setSceneColour((x, y) => colourAt(shot.colour, x, y, ms));
    if (shot.colour.kind === 'ripple' && ms >= shot.colour.end) world.showMess(true);
    const text = captionAt(shot, ms);
    if (text !== r.said) { r.said = text; r.caption.textContent = text ? (content.line(text) ?? '') : ''; }
    r.dim.style.opacity = String(fadeAt(r.scene, r.shot, ms));
    this.drawActors(shot, ms, dt);
    this.drawSparkle(shot, ms);
    this.drawGlows(shot, ms);
    for (const [x, y, at] of shot.bursts ?? []) {
      const key = `${r.shot}:${at}`;
      if (ms >= at && !r.bursts.has(key)) { r.bursts.add(key); if (!this.host.reducedMotion()) world.sparkleBurst(x, y, 10); }
    }
    const cam = typeof shot.camera === 'string' ? this.subject(shot, shot.camera, ms) : pointAt(shot.camera, ms);
    if (cam) world.follow(cam.x * T + T / 2, cam.y * T + T / 2, this.host.reducedMotion() || ms < 1 || dt === 0);
    this.drawEmotes(shot, ms);
  }

  /** The warm glows (the fountain, the spring), pulsing gently. */
  private drawGlows(shot: Shot, ms: number) {
    this.glow.clear();
    const pulse = this.host.reducedMotion() ? 1 : 0.85 + 0.15 * Math.sin(ms / 400);
    for (const g of shot.glows ?? []) {
      const a = glowAt(g, ms, shot.ms) * pulse;
      if (a <= 0.01) continue;
      const cx = g.x * T + T / 2; const cy = g.y * T + T / 2;
      for (const [k, s] of [[1, 0.12], [0.7, 0.15], [0.4, 0.2]]) this.glow.ellipse(cx, cy, g.r * T * k, g.r * T * k * 0.7).fill({ color: P.peachLight, alpha: a * s });
    }
  }

  /** Little bubbles over heads (💤 sleepy, ♪ humming, ! waking), placed over the world each frame. */
  private drawEmotes(shot: Shot, ms: number) {
    const r = this.run!;
    const { world } = this.host;
    const now = emotesAt(shot, ms);
    r.bubbles.replaceChildren(...now.flatMap(([, who, icon]) => {
      const a = who === 'sparkle' ? null : shot.actors?.find((x) => x.who === who);
      const p = a ? pointAt(a.path, ms) : null;
      if (!p) return [];
      const s = world.toScreen(p.x * T + T / 2, p.y * T - 10);
      return [h('span', { class: 'scene-bubble', style: { left: `${s.x}px`, top: `${s.y}px` } }, icon)];
    }));
  }

  /** Where the camera's subject is: an actor, or the sparkle. */
  private subject(shot: Shot, who: string, ms: number) {
    if (who === 'sparkle') return shot.sparkle ? pointAt(shot.sparkle, ms) : null;
    const a = shot.actors?.find((x) => x.who === who);
    return a ? pointAt(a.path, ms) : null;
  }

  private drawActors(shot: Shot, ms: number, dt: number) {
    const { world, content } = this.host;
    const views: NeighbourView[] = [];
    let puff = false;
    for (const a of shot.actors ?? []) {
      if ((a.from !== undefined && ms < a.from) || (a.until !== undefined && ms >= a.until)) continue;
      const p = pointAt(a.path, ms);
      const at = foot(p.x, p.y);
      const dir = facing(a, ms);
      if (a.who === 'puff') { puff = true; world.drawPuff({ ...at, dir, pose: asleep(a, ms) ? 'sleep' : 'idle', tool: null }, dt); continue; }
      const def = content.neighbour(a.who);
      const look = a.species && a.colours ? { species: a.species, colours: a.colours } : def ? { species: def.species, colours: def.colours } : null;
      const pose = asleep(a, ms) ? 'sleep' : p.moving ? 'walk' : 'idle';
      if (look) views.push({ id: `scene_${a.who}`, ...look, ...at, dir, pose });
    }
    world.showPuff(puff);
    world.drawNeighbours(views);
  }

  private drawSparkle(shot: Shot, ms: number) {
    const path = shot.sparkle;
    const on = !!path && ms >= path[0][2] && ms <= path[path.length - 1][2] + 200;
    this.sparkle.visible = on;
    if (!on || !path) return;
    const p = pointAt(path, ms);
    const bob = this.host.reducedMotion() ? 0 : Math.sin(ms / 220) * 2;
    this.sparkle.position.set(p.x * T + T / 2, p.y * T + T / 2 + bob);
    this.sparkle.alpha = this.host.reducedMotion() ? 1 : 0.75 + 0.25 * Math.sin(ms / 90);
  }

  private finish() {
    const r = this.run;
    if (!r) return;
    this.run = null;
    r.overlay.remove();
    this.host.ui.classList.remove('scene-playing');
    this.sparkle.visible = false; this.glow.clear();
    const { world } = this.host;
    world.drawNeighbours([]);
    world.showMess(true); world.showPuff(true);
    this.host.resume();
    world.setSceneColour(null);
    r.done();
  }
}
