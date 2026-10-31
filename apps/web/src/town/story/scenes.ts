import type { Dir } from '../world/art/characters';

// Cutscenes (claude/MAIN-PATH.md, Blake: "cutscenes at the start to introduce it"). A scene is pack
// data: beats played out in the town itself. Each beat shows one place at one time of day, glides
// the camera, walks characters about, drains or floods the colour, and holds a caption. This file
// is the timeline maths, kept pure so it's easy to test; scene-player.ts puts it on screen.

type Tile = [number, number];

/** Someone in a beat: a neighbour (by id), Puff, or a scene-only character with their own look. */
export interface SceneActor {
  who: string; x: number; y: number; dir?: Dir;
  /** Walks here over the beat. */
  to?: Tile;
  sleep?: boolean;
  /** For a scene-only character (Thimble long ago). */
  species?: string; colours?: { fur: string; belly: string; accent: string };
}

/**
 * `colour`: how coloured the place looks. `full` and `grey` hold; `drain` sweeps from full colour
 * to grey across the place over the beat (west to east), `fill` the other way.
 */
export type SceneColour = 'full' | 'grey' | 'drain' | 'fill';

export interface SceneBeat {
  area: string;
  /** Camera centre (tiles), gliding to `to` over the beat. */
  at: Tile; to?: Tile;
  /** Time of day shown (minutes from midnight). */
  minutes: number;
  colour: SceneColour;
  actors?: SceneActor[];
  /** A sparkle rising from here and drifting down to `sparkleTo` (Puff being born). */
  sparkle?: Tile; sparkleTo?: Tile;
  /** Text id of the caption. */
  caption: string;
  /** How long it plays before moving on by itself. */
  ms: number;
}

export interface SceneDef { id: string; beats: SceneBeat[] }

/** 0 → 1 with a gentle start and end. */
export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where something is `t` (0–1) of the way through a beat that moves it from `from` to `to`. */
export function along(from: Tile, to: Tile | undefined, t: number): Tile {
  if (!to) return from;
  const k = ease(t);
  return [lerp(from[0], to[0], k), lerp(from[1], to[1], k)];
}

/**
 * How coloured tile column `x` (of `width`) is, 0 grey to 1 full colour, `t` through the beat.
 * A drain is a soft front sweeping across: the west side greys first.
 */
export function colourAt(mode: SceneColour, x: number, width: number, t: number) {
  if (mode === 'full') return 1;
  if (mode === 'grey') return 0;
  const front = ease(t) * (width + 6) - 3; // the front starts just off the west edge and ends just past the east one
  const greyed = Math.max(0, Math.min(1, (front - x + 3) / 6));
  return mode === 'drain' ? 1 - greyed : greyed;
}

/** Whether a beat shows its place tidy (the long-ago town has no mess, nor does a colour sweep). */
export const hidesMess = (b: SceneBeat) => b.colour !== 'grey';
