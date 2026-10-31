import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { captionAt, colourAt, ease, facing, fadeAt, minutesAt, nextCaption, pointAt, sceneLength, type Key, type SceneDef, type ShotColour } from './scenes';

const walk: Key[] = [[2, 4, 0], [6, 4, 2000], [6, 8, 4000]];

describe('scene timeline', () => {
  it('eases gently from start to end', () => {
    expect(ease(0)).toBe(0); expect(ease(1)).toBe(1); expect(ease(0.5)).toBe(0.5);
  });

  it('walks a path steadily, facing the way it goes', () => {
    expect(pointAt(walk, 0)).toMatchObject({ x: 2, y: 4, moving: false });
    expect(pointAt(walk, 1000)).toMatchObject({ x: 4, y: 4, moving: true });
    expect(pointAt(walk, 3000)).toMatchObject({ x: 6, y: 6 });
    expect(pointAt(walk, 9000)).toMatchObject({ x: 6, y: 8, moving: false });
    expect(facing({ who: 'pip', path: walk }, 1000)).toBe('right');
    expect(facing({ who: 'pip', path: walk }, 3000)).toBe('down');
    expect(facing({ who: 'thimble', path: walk, dir: 'up' }, 3000)).toBe('up');
  });

  it('ripples the grey out from a point: near first, far last', () => {
    const c: ShotColour = { kind: 'ripple', from: [15, 10], start: 0, end: 4000 };
    expect(colourAt(c, 15, 10, 0)).toBe(1);
    expect(colourAt(c, 15, 10, 1000)).toBeLessThan(colourAt(c, 0, 0, 1000));
    expect(colourAt(c, 0, 0, 4000)).toBe(0);
    expect(colourAt({ kind: 'full' }, 3, 3, 0)).toBe(1);
  });

  it('changes captions with the action, and a tap jumps to the next one', () => {
    const scene: SceneDef = { id: 't', shots: [
      { area: 'square', ms: 5000, minutes: [600, 700], camera: walk, colour: { kind: 'full' }, captions: [[0, 'a'], [3000, 'b']] },
      { area: 'square', ms: 4000, minutes: 700, camera: walk, colour: { kind: 'full' }, captions: [[500, 'c']] },
      { area: 'yard', ms: 4000, minutes: 700, camera: walk, colour: { kind: 'grey' }, captions: [] }] };
    expect(sceneLength(scene)).toBe(13000);
    expect(captionAt(scene.shots[0], 2999)).toBe('a');
    expect(captionAt(scene.shots[0], 3000)).toBe('b');
    expect(nextCaption(scene, 0, 100)).toEqual({ shot: 0, ms: 3000 });
    expect(nextCaption(scene, 0, 3000)).toEqual({ shot: 1, ms: 500 });
    expect(nextCaption(scene, 1, 600)).toBeNull();
    expect(minutesAt(scene.shots[0], 2500)).toBe(650);
    // A fade only where the place changes: none between the two square shots, one into the yard.
    expect(fadeAt(scene, 0, 4900)).toBe(0);
    expect(fadeAt(scene, 1, 0)).toBe(0);
    expect(fadeAt(scene, 1, 3900)).toBeGreaterThan(0.5);
    expect(fadeAt(scene, 2, 0)).toBe(1);
  });
});

describe('Hollowfern opening', () => {
  const scene = (pack.scenes ?? []).find((s) => s.id === 'opening')!;
  const text = pack.strings!['en-AU'];
  const open = (area: string) => new Area(pack.areas.find((a) => a.id === area)!);

  it('runs as one story in about a minute: the bright town, Thimble leaving, the grey, the sparkle home', () => {
    expect(sceneLength(scene)).toBeGreaterThan(40_000); expect(sceneLength(scene)).toBeLessThanOrEqual(70_000);
    expect(scene.shots[0].colour.kind).toBe('full');
    expect(scene.shots.some((s) => s.colour.kind === 'ripple')).toBe(true);
    expect(scene.shots.map((s) => s.area)).toEqual(['square', 'square', 'cave_4', 'square', 'square', 'yard', 'burrow']);
    // Thimble goes down into the fountain (the way to the caves) and sleeps by the Old Spring.
    expect(pack.areas.find((a) => a.id === 'square')!.props.find((p) => p.type === 'fountain')?.to).toBe('cave_1');
    expect(scene.shots[2].actors?.find((a) => a.who === 'thimble')?.sleepFrom).toBeDefined();
    expect(scene.shots.at(-1)!.actors?.some((a) => a.who === 'puff')).toBe(true);
  });

  it('carries the sparkle through real doors: out of the square, across the yard, into the burrow', () => {
    const doorTo = (from: string, to: string) => pack.areas.find((a) => a.id === from)!.doors.filter((d) => d.to === to);
    const ends = (i: number) => { const p = scene.shots[i].sparkle!; return { first: p[0], last: p[p.length - 1] }; };
    expect(doorTo('square', 'yard').some((d) => d.x === ends(4).last[0] && d.y === ends(4).last[1])).toBe(true);
    expect(doorTo('yard', 'square').some((d) => Math.abs(d.x - ends(5).first[0]) <= 1 && d.y === ends(5).first[1])).toBe(true);
    expect(doorTo('yard', 'burrow').some((d) => d.x === ends(5).last[0] && d.y === ends(5).last[1])).toBe(true);
    expect(doorTo('burrow', 'yard').some((d) => d.x === ends(6).first[0] && Math.abs(d.y - ends(6).first[1]) <= 1)).toBe(true);
  });

  it('shows Thimble only from behind, keeps captions short, and walks everyone on open ground', () => {
    for (const shot of scene.shots) {
      for (const [, who] of shot.emotes ?? []) expect(shot.actors?.some((a) => a.who === who), `${shot.area} emote ${who}`).toBe(true);
      for (const [, id] of shot.captions) { expect(text[id], id).toBeTruthy(); expect(text[id].length, id).toBeLessThanOrEqual(60); }
      const area = open(shot.area);
      for (const a of shot.actors ?? []) {
        if (a.who === 'thimble') expect(a.dir, 'Thimble faces away').toBe('up');
        if (a.who !== 'thimble' && a.who !== 'puff') expect(pack.neighbours!.some((n) => n.id === a.who), a.who).toBe(true);
        // Every step along the way, not just the corners.
        for (let ms = a.from ?? 0; ms < Math.min(shot.ms, a.until ?? Infinity); ms += 100) {
          const p = pointAt(a.path, ms);
          const x = Math.round(p.x); const y = Math.round(p.y);
          expect(area.walkable(x, y) || area.doorAt(x, y), `${shot.area} ${a.who} ${x},${y}`).toBeTruthy();
        }
      }
    }
  });
});
