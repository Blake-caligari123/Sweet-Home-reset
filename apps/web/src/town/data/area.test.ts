import { describe, expect, it } from 'vitest';
import { hollowfern as pack } from './test-pack';
import { Area, validateTownPack } from './area';
import { findPath } from '../world/pathfind';
import { MESS_TYPES } from '../play/mess';
import { FEET, navFor, REACH } from '../world/nav';

const T = 16;


describe('Hollowfern spring pack', () => {
  it('has the M1 areas and the M2 ones so far', () => {
    expect(pack.areas.map((a) => a.id)).toEqual(['burrow', 'yard', 'square', 'bakery', 'store', 'lane', 'bea_shop', 'pip_workshop', 'library']);
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

  it('lets Puff walk freely from the spawn to every door, mess spot and usable prop', () => {
    for (const a of pack.areas) {
      const area = new Area(a); const nav = navFor(area);
      const spawn = nav.nearestOpen({ x: a.spawn.x * T + T / 2, y: a.spawn.y * T + FEET })!;
      expect(spawn, `${a.id} spawn`).not.toBeNull();
      const tile = (x: number, y: number, w = 1, h = 1) => ({ x0: x * T, y0: y * T, x1: (x + w) * T, y1: (y + h) * T });
      for (const d of a.doors.filter((d) => !d.closedText)) expect(nav.findPathNear(spawn, tile(d.x, d.y), 0), `${a.id} → ${d.to}`).not.toBeNull();
      for (const m of area.spots) expect(nav.findPathNear(spawn, tile(m.x, m.y), REACH), `${a.id} ${m.type} at ${m.x},${m.y}`).not.toBeNull();
      for (const p of a.props.filter((p) => p.action)) expect(nav.findPathNear(spawn, tile(p.x, p.y, p.w, p.h), REACH), `${a.id} ${p.type}`).not.toBeNull();
    }
  });

  it('lets every painted object Puff can use be tapped anywhere on its painting', () => {
    for (const a of pack.areas.filter((x) => x.background)) {
      const area = new Area(a);
      for (const p of a.props.filter((x) => x.action)) {
        expect(p.tap, `${a.id} ${p.type} needs a tap area over its painting`).toBeDefined();
        const [x, y, w, h] = p.tap!;
        for (let ty = y; ty < y + h; ty += 1) for (let tx = x; tx < x + w; tx += 1) expect(area.tapPropAt(tx, ty), `${a.id} ${p.type} at ${tx},${ty}`).toBe(p);
      }
    }
    const burrow = new Area(pack.areas.find((x) => x.id === 'burrow')!);
    expect(burrow.tapPropAt(15, 3)?.accepts).toContain('book'); // the books on the shelf, not the floor in front
  });

  it('gives every clutter item a home that exists in its area', () => {
    for (const a of pack.areas) {
      for (const m of new Area(a).spots.filter((s) => s.type === 'clutter')) {
        expect(MESS_TYPES).toContain(m.type);
        expect(a.props.some((p) => p.accepts?.includes(m.item!)), `${a.id} ${m.item}`).toBe(true);
      }
    }
  });

  it('never loses a placed item or mess spot under scattered mess', () => {
    for (const a of pack.areas) {
      const area = new Area(a);
      for (const d of a.mess) if (!('rect' in d)) expect(area.spots.find((s) => s.x === d.x && s.y === d.y), `${a.id} ${d.type} at ${d.x},${d.y}`).toEqual(d);
    }
  });

  it('rejects a broken pack', () => {
    const broken = JSON.parse(JSON.stringify(pack));
    broken.areas[0].map[6] = broken.areas[0].map[6].replace('.', '?');
    expect(() => validateTownPack(broken)).toThrow(/unknown map char/);
  });
});
