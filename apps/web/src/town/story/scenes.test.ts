import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { SOUND_IDS } from '../../shared/audio/sound';
import { afterDue, captionAt, captionHolds, colourAt, ease, facing, hopping, fadeAt, minutesAt, nextCaption, pointAt, sceneLength, soundsBetween, TITLE_MS, zoomAt, type Key, type SceneDef, type Shot, type ShotColour } from './scenes';

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
    // Standing still, they look where they last looked; Puff hops for a moment.
    const looker = { who: 'puff', path: [[4, 8, 0]] as Key[], looks: [[100, 'left'], [500, 'right']] as [number, 'left' | 'right'][], hops: [900] };
    expect(facing(looker, 50)).toBe('down'); expect(facing(looker, 300)).toBe('left'); expect(facing(looker, 800)).toBe('right');
    expect(hopping(looker, 1000)).toBe(true); expect(hopping(looker, 2000)).toBe(false);
  });

  it('ripples the grey out from a point: near first, far last', () => {
    const c: ShotColour = { kind: 'ripple', from: [15, 10], start: 0, end: 4000 };
    expect(colourAt(c, 15, 10, 0)).toBe(1);
    expect(colourAt(c, 15, 10, 1000)).toBeLessThan(colourAt(c, 0, 0, 1000));
    expect(colourAt(c, 0, 0, 4000)).toBe(0);
    expect(colourAt({ kind: 'full' }, 3, 3, 0)).toBe(1);
    // And back: colour blooms out from a point, near first, never past its reach.
    const b: ShotColour = { kind: 'bloom', from: [4, 8], start: 0, end: 2000, reach: 5 };
    expect(colourAt(b, 4, 8, 1000)).toBe(1); expect(colourAt(b, 12, 8, 1000)).toBe(0);
    expect(colourAt(b, 4, 12, 2000)).toBe(1); expect(colourAt(b, 4, 15, 2000)).toBe(0);
  });

  it('plays a scene waiting on a flag the first morning it\'s set, once', () => {
    const scenes: SceneDef[] = [{ id: 'a', shots: [] }, { id: 'b', after: 'welcome_fig', shots: [] }];
    expect(afterDue(scenes, () => false, () => false)).toBeNull();
    expect(afterDue(scenes, (f) => f === 'welcome_fig', () => false)).toBe('b');
    expect(afterDue(scenes, (f) => f === 'welcome_fig', (id) => id === 'b')).toBeNull();
  });

  it('pushes in and pulls back smoothly, and plays each sound once as the moment passes', () => {
    const shot: Shot = { area: 'square', ms: 4000, minutes: 600, camera: walk, colour: { kind: 'full' }, captions: [], zoom: [[0, 3], [1000, 3], [3000, 1]], sounds: [[0, 'hum'], [2000, 'whoosh']] };
    expect(zoomAt(shot, 500)).toBe(3); expect(zoomAt(shot, 2000)).toBe(2); expect(zoomAt(shot, 3500)).toBe(1);
    expect(zoomAt({ ...shot, zoom: undefined }, 100)).toBe(1);
    expect(soundsBetween(shot, -1, 0)).toEqual(['hum']);
    expect(soundsBetween(shot, 0, 1999)).toEqual([]); expect(soundsBetween(shot, 1999, 2016)).toEqual(['whoosh']);
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
    expect(sceneLength(scene)).toBeGreaterThan(40_000); expect(sceneLength(scene)).toBeLessThanOrEqual(75_000);
    expect(scene.shots[0].colour.kind).toBe('full');
    expect(scene.shots.some((s) => s.colour.kind === 'ripple')).toBe(true);
    expect(scene.shots.map((s) => s.area)).toEqual(['square', 'square', 'cave_4', 'square', 'square', 'yard', 'burrow', 'burrow']);
    // Thimble goes down into the fountain (the way to the caves) and sleeps by the Old Spring.
    expect(pack.areas.find((a) => a.id === 'square')!.props.find((p) => p.type === 'fountain')?.to).toBe('cave_1');
    expect(scene.shots[2].actors?.find((a) => a.who === 'thimble')?.sleepFrom).toBeDefined();
    expect(scene.shots.at(-1)!.actors?.some((a) => a.who === 'puff')).toBe(true);
  });

  it('is directed like a film: a hook up close, a pull back over the grey, real silences, and an ending that echoes the start', () => {
    const [first] = scene.shots; const last = scene.shots.at(-1)!;
    expect(zoomAt(first, 0)).toBeGreaterThanOrEqual(2.5); // opens close on the warm fountain...
    expect(zoomAt(first, first.ms)).toBe(1); // ...and pulls back to the whole bright town
    const grey = scene.shots.find((s) => s.colour.kind === 'ripple')!;
    expect(zoomAt(grey, grey.ms)).toBeLessThan(zoomAt(grey, 0));
    expect(scene.shots.filter((s) => s.music === 'off').length).toBeGreaterThanOrEqual(2);
    expect(last.colour.kind).toBe('bloom'); expect(last.music).toBe('warm');
    for (const s of scene.shots) for (const [, id] of s.sounds ?? []) expect(SOUND_IDS, id).toContain(id);
    // Pace for the reader: every caption stays up long enough to read.
    for (const c of captionHolds(scene, (id) => text[id])) expect(c.holds, c.id).toBeGreaterThanOrEqual(c.needs);
  });

  it('paces every scene for reading, and keeps a chapter title card clear of the captions', () => {
    for (const sc of pack.scenes ?? []) {
      for (const c of captionHolds(sc, (id) => text[id])) expect(c.holds, `${sc.id} ${c.id}`).toBeGreaterThanOrEqual(c.needs);
      if (sc.title) expect(sc.shots[0].captions[0]?.[0] ?? Infinity, sc.id).toBeGreaterThanOrEqual(TITLE_MS);
      for (const s of sc.shots) for (const [, id] of s.sounds ?? []) expect(SOUND_IDS, `${sc.id} ${id}`).toContain(id);
    }
  });

  it('saves Thimble\'s face for Winter Lights: they wake, then turn around', () => {
    const wake = (pack.scenes ?? []).find((x) => x.id === 'thimble_wakes')!;
    expect(wake.after).toBe('year_one_chapter'); expect(wake.now).toBe(true);
    const thimble = wake.shots[0].actors!.find((a) => a.who === 'thimble')!;
    expect(facing(thimble, thimble.from!)).toBe('up'); expect(facing(thimble, wake.shots[0].ms - 1)).toBe('down');
  });

  it('opens each season\'s chapter with the fountain, and closes the first three after their festivals', () => {
    const story = pack.story!;
    for (const c of story.chapters.slice(1)) expect((pack.scenes ?? []).some((x) => x.id === c.scene), c.id).toBe(true);
    expect(story.steps.filter((x) => x.scene).map((x) => x.id)).toEqual(['fair', 'picnic', 'leaf_fest', 'deep_cave']);
  });

  it('walks each newcomer up to their new cottage, never through it, the morning after it\'s built', () => {
    const arrivals = (pack.scenes ?? []).filter((x) => x.after?.startsWith('welcome_'));
    expect(arrivals.map((x) => x.after)).toEqual(['welcome_sorrel', 'welcome_fig', 'welcome_wren', 'welcome_juniper', 'welcome_marlo']);
    for (const sc of arrivals) {
      const who = sc.after!.replace('welcome_', '');
      const plot = pack.plots!.find((pl) => pl.allow?.includes(`cottage_${who}`))!;
      const shot = sc.shots[0];
      expect(shot.area, who).toBe(plot.area);
      for (const a of shot.actors ?? []) for (let ms = 0; ms < shot.ms; ms += 100) {
        const p = pointAt(a.path, ms); const x = Math.round(p.x); const y = Math.round(p.y);
        expect(x >= plot.x && x < plot.x + plot.w && y >= plot.y && y < plot.y + plot.h, `${who} ${a.who} ${x},${y}`).toBe(false);
      }
      const end = shot.actors![0].path.at(-1)!;
      expect(end[1], `${who} stops in front`).toBe(plot.y + plot.h); // at the front door
    }
  });

  it('carries the sparkle through real doors: out of the square, across the yard, into the burrow', () => {
    const doorTo = (from: string, to: string) => pack.areas.find((a) => a.id === from)!.doors.filter((d) => d.to === to);
    const ends = (i: number) => { const p = scene.shots[i].sparkle!; return { first: p[0], last: p[p.length - 1] }; };
    expect(doorTo('square', 'yard').some((d) => d.x === ends(4).last[0] && d.y === ends(4).last[1])).toBe(true);
    expect(doorTo('yard', 'square').some((d) => Math.abs(d.x - ends(5).first[0]) <= 1 && d.y === ends(5).first[1])).toBe(true);
    expect(doorTo('yard', 'burrow').some((d) => d.x === ends(5).last[0] && d.y === ends(5).last[1])).toBe(true);
    expect(doorTo('burrow', 'yard').some((d) => d.x === ends(6).first[0] && Math.abs(d.y - ends(6).first[1]) <= 1)).toBe(true);
  });

  it('shows Thimble only from behind (until they wake at Winter Lights), keeps captions short, and walks everyone on open ground (every scene)', () => {
    for (const shot of (pack.scenes ?? []).filter((x) => x.id !== 'thimble_wakes').flatMap((x) => x.shots)) {
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
