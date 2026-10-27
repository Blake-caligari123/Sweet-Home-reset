import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Area, validateTownPack } from './area';
import { findPath } from './pathfind';
import { MESS_TYPES } from './mess';

const pack = validateTownPack(JSON.parse(readFileSync(new URL('../../public/packs-bundled/hollowfern/1/pack.json', import.meta.url), 'utf8')));

describe('Hollowfern spring pack', () => {
  it('has the four M1 areas', () => {
    expect(pack.areas.map((a) => a.id)).toEqual(['burrow', 'yard', 'square', 'bakery']);
  });

  it('can reach every open door and every mess tile from the spawn', () => {
    for (const a of pack.areas) {
      const area = new Area(a);
      for (const d of a.doors.filter((d) => !d.closedText)) expect(findPath(area, a.spawn, d), `${a.id} → ${d.to}`).not.toBeNull();
      for (const m of area.spots) {
        const beside = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => area.walkable(m.x + dx, m.y + dy) && findPath(area, a.spawn, { x: m.x + dx, y: m.y + dy }));
        expect(beside, `${a.id} ${m.type} at ${m.x},${m.y}`).toBe(true);
      }
    }
  });

  it('gives every clutter item a home that exists in its area', () => {
    for (const a of pack.areas) {
      for (const m of new Area(a).spots.filter((s) => s.type === 'clutter')) {
        expect(MESS_TYPES).toContain(m.type);
        expect(a.props.some((p) => p.accepts?.includes(m.item!)), `${a.id} ${m.item}`).toBe(true);
      }
    }
  });

  it('rejects a broken pack', () => {
    const broken = JSON.parse(JSON.stringify(pack));
    broken.areas[0].map[6] = broken.areas[0].map[6].replace('.', '?');
    expect(() => validateTownPack(broken)).toThrow(/unknown map char/);
  });
});
