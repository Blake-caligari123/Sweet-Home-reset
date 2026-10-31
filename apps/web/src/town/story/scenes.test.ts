import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from '../data/test-pack';
import { Area } from '../data/area';
import { along, colourAt, ease } from './scenes';

describe('scene timeline', () => {
  it('eases gently from start to end', () => {
    expect(ease(0)).toBe(0); expect(ease(1)).toBe(1); expect(ease(0.5)).toBe(0.5);
    expect(ease(0.1)).toBeLessThan(0.1);
  });

  it('glides a camera or a character from one tile to another, or holds still', () => {
    expect(along([2, 4], [10, 4], 0)).toEqual([2, 4]);
    expect(along([2, 4], [10, 4], 1)).toEqual([10, 4]);
    expect(along([2, 4], undefined, 0.5)).toEqual([2, 4]);
  });

  it('drains the colour west to east over a beat, and fills it back the same way', () => {
    expect(colourAt('drain', 0, 30, 0)).toBe(1);
    expect(colourAt('drain', 29, 30, 1)).toBe(0);
    const mid = (x: number) => colourAt('drain', x, 30, 0.5);
    expect(mid(2)).toBeLessThan(mid(27)); // the west side greys first
    expect(colourAt('fill', 0, 30, 1)).toBe(1);
    expect(colourAt('full', 5, 30, 0.3)).toBe(1);
    expect(colourAt('grey', 5, 30, 0.3)).toBe(0);
  });
});

describe('Hollowfern opening', () => {
  const scene = (pack.scenes ?? []).find((s) => s.id === 'opening')!;
  const text = pack.strings!['en-AU'];

  it('tells the town before, Thimble, the grey, Puff\'s birth and the town today, in about a minute', () => {
    expect(scene.beats.length).toBeGreaterThanOrEqual(5);
    const total = scene.beats.reduce((n, b) => n + b.ms, 0);
    expect(total).toBeGreaterThan(40_000); expect(total).toBeLessThan(80_000);
    expect(scene.beats[0].colour).toBe('full');
    expect(scene.beats.some((b) => b.colour === 'drain')).toBe(true);
    expect(scene.beats.some((b) => b.sparkle)).toBe(true);
  });

  it('shows Thimble only from behind, and keeps every caption short and on open ground', () => {
    for (const b of scene.beats) {
      expect(text[b.caption], b.caption).toBeTruthy();
      expect(text[b.caption].length, b.caption).toBeLessThanOrEqual(60);
      const area = pack.areas.find((a) => a.id === b.area)!;
      expect(area, b.area).toBeTruthy();
      const map = new Area(area);
      for (const a of b.actors ?? []) {
        if (a.who === 'thimble') expect(a.dir, 'Thimble faces away').toBe('up');
        for (const [x, y] of [[a.x, a.y], ...(a.to ? [a.to] : [])]) expect(map.walkable(x, y) || map.doorAt(x, y), `${b.caption} ${a.who} ${x},${y}`).toBeTruthy();
        if (a.who !== 'thimble' && a.who !== 'puff') expect(pack.neighbours!.some((n) => n.id === a.who), a.who).toBe(true);
      }
    }
  });
});
