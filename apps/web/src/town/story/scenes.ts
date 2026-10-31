import type { Dir } from '../world/art/characters';

// Cutscenes (claude/MAIN-PATH.md). Blake: "fluid and make sense, not just random shots". A scene
// is one continuous take made of shots. A shot stays in one place while the camera follows whoever
// the story is about. Characters walk paths, the grey ripples out from where it starts, and a
// sparkle can drift from place to place. Shots in the same place run straight on; moving to the next
// place is a soft fade as the subject crosses over. Everything is keyed to time, so tapping can
// jump to the next caption and reduced motion can still show the same story. Pure maths here;
// scene-player.ts puts it on screen.

/** A waypoint: tile x, tile y, and the ms into the shot it's reached. */
export type Key = [number, number, number];

/** Someone in a shot: a neighbour (by id), Puff, or a scene-only character with their own look. */
export interface ShotActor {
  who: string;
  /** Where they are over the shot (one key to stand still). */
  path: Key[];
  /** Always face this way (Thimble only ever shows their back); otherwise they face where they walk. */
  dir?: Dir;
  /** Nodding off from this ms, and waking again at `wakeAt` (Puff waking up). */
  sleepFrom?: number; wakeAt?: number;
  /** Only there from this ms (Puff appearing), or until this ms (Thimble leaving). */
  from?: number; until?: number;
  species?: string; colours?: { fur: string; belly: string; accent: string };
}

/** A soft light on something (the fountain's warm water), easing from one strength to another over the shot. */
export interface ShotGlow { x: number; y: number; r: number; from: number; to: number }

/** A little bubble over someone's head, so you can see what they feel: [ms, who, icon]. */
export type Emote = [number, string, string];

/** How long an emote stays up. */
export const EMOTE_MS = 1800;

/** `full` and `grey` hold; `ripple` greys the place outward from a point between `start` and `end` ms. */
export type ShotColour = { kind: 'full' } | { kind: 'grey' } | { kind: 'ripple'; from: [number, number]; start: number; end: number };

export interface Shot {
  area: string;
  ms: number;
  /** Time of day: held, or eased from one to the other (minutes; past midnight wraps). */
  minutes: number | [number, number];
  /** The season's sky (Winter snows outdoors). */
  season?: string;
  /** The camera follows this actor ('sparkle' for the sparkle), or glides along a path. */
  camera: string | Key[];
  colour: ShotColour;
  actors?: ShotActor[];
  /** The glowing sparkle's path, and when it shows. */
  sparkle?: Key[];
  /** Little bursts of sparkle (the fountain glowing, Puff appearing): [x, y, ms]. */
  bursts?: Key[];
  glows?: ShotGlow[];
  emotes?: Emote[];
  /** Captions: [ms, text id]. Each stays up until the next. */
  captions: [number, string][];
}

export interface SceneDef { id: string; shots: Shot[] }

/** How strong a glow is `ms` into a shot of `length`. */
export const glowAt = (g: ShotGlow, ms: number, length: number) => g.from + (g.to - g.from) * ease(ms / length);

/** The emotes showing at `ms`. */
export const emotesAt = (shot: Shot, ms: number) => (shot.emotes ?? []).filter(([at]) => ms >= at && ms < at + EMOTE_MS);

/** Whether someone is asleep at `ms`. */
export const asleep = (a: ShotActor, ms: number) => a.sleepFrom !== undefined && ms >= a.sleepFrom && (a.wakeAt === undefined || ms < a.wakeAt);

/** How long a scene runs. */
export const sceneLength = (s: SceneDef) => s.shots.reduce((n, x) => n + x.ms, 0);

/** Fades between places last this long on each side of the cut. */
const FADE_MS = 500;

/** 0 → 1 with a gentle start and end. */
export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Where a path is at `ms` (steady walking between keys), and which way it's heading. */
export function pointAt(path: Key[], ms: number): { x: number; y: number; moving: boolean; dx: number; dy: number } {
  if (ms <= path[0][2] || path.length === 1) return { x: path[0][0], y: path[0][1], moving: false, dx: 0, dy: 0 };
  for (let i = 1; i < path.length; i += 1) {
    const [ax, ay, at] = path[i - 1]; const [bx, by, bt] = path[i];
    if (ms <= bt) {
      const k = bt === at ? 1 : (ms - at) / (bt - at);
      const moving = ax !== bx || ay !== by;
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, moving, dx: bx - ax, dy: by - ay };
    }
  }
  const last = path[path.length - 1];
  return { x: last[0], y: last[1], moving: false, dx: 0, dy: 0 };
}

/** Which way someone faces: their set way, else the way they're walking, else down. */
export function facing(a: ShotActor, ms: number): Dir {
  if (a.dir) return a.dir;
  const p = pointAt(a.path, ms);
  if (!p.moving) return 'down';
  return Math.abs(p.dx) > Math.abs(p.dy) ? (p.dx > 0 ? 'right' : 'left') : p.dy > 0 ? 'down' : 'up';
}

/** How coloured a tile looks, 0 grey to 1 full colour, `ms` into the shot. */
export function colourAt(c: ShotColour, x: number, y: number, ms: number) {
  if (c.kind === 'full') return 1;
  if (c.kind === 'grey') return 0;
  const reach = 40; // tiles: past the far corner of any place
  const r = ease((ms - c.start) / (c.end - c.start)) * reach;
  const d = Math.hypot(x - c.from[0], y - c.from[1]);
  return Math.max(0, Math.min(1, (d - r + 3) / 3)); // a soft edge three tiles wide
}

/** The caption up at `ms`, if any. */
export function captionAt(shot: Shot, ms: number) {
  let id: string | null = null;
  for (const [at, text] of shot.captions) if (at <= ms) id = text;
  return id;
}

/** Tapping: the next moment a caption changes after `ms` into shot `i` (shot index and ms), or null at the end. */
export function nextCaption(scene: SceneDef, i: number, ms: number): { shot: number; ms: number } | null {
  for (const [at] of scene.shots[i].captions) if (at > ms) return { shot: i, ms: at };
  for (let j = i + 1; j < scene.shots.length; j += 1) if (scene.shots[j].captions.length) return { shot: j, ms: scene.shots[j].captions[0][0] };
  return null;
}

/** The time of day `ms` into a shot. */
export function minutesAt(shot: Shot, ms: number) {
  if (typeof shot.minutes === 'number') return shot.minutes;
  const [a, b] = shot.minutes;
  return Math.round(a + (b - a) * ease(ms / shot.ms)) % 1440;
}

/** How dark the fade is (0 clear, 1 black): only where the next or last shot is somewhere else. */
export function fadeAt(scene: SceneDef, i: number, ms: number) {
  const shot = scene.shots[i];
  const prev = scene.shots[i - 1]; const next = scene.shots[i + 1];
  const into = prev && prev.area !== shot.area ? 1 - Math.min(1, ms / FADE_MS) : 0;
  const out = next && next.area !== shot.area ? Math.max(0, 1 - (shot.ms - ms) / FADE_MS) : 0;
  return Math.max(into, out);
}

/** Whether a shot shows the mess: only once the place is grey (the town long ago had none). */
export const showsMess = (s: Shot) => s.colour.kind === 'grey';
