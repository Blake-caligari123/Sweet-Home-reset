import { seeded } from '../../shared/art/pixel-canvas';
import type { Area } from '../data/area';
import type { AreaMess, MessSpot } from './mess';

/**
 * Overnight, a little light mess drifts back into places already restored (VISION §7): a few
 * dust motes indoors, a weed or two outside. It's "fresh" mess, so it never counts against the
 * restore; it's just something small and satisfying to tidy on a visit. It never piles up.
 */
export function returningMess(area: Area, m: AreaMess, day: number, o: { perNight: number; maxFresh: number }): MessSpot[] {
  if (!m.restored) return [];
  const room = o.maxFresh - m.fresh.reduce((a, b) => a + b, 0);
  const type = area.pack.kind === 'home' ? 'dust' : 'weeds';
  const r = seeded(day * 131 + area.pack.id.length * 17 + area.pack.id.charCodeAt(0));
  const out: MessSpot[] = [];
  for (let tries = 0; tries < 60 && out.length < Math.min(o.perNight, room); tries += 1) {
    const x = Math.floor(r() * area.w); const y = Math.floor(r() * area.h);
    if (!area.walkable(x, y) || area.doorAt(x, y) || m.typeAt(x, y) !== 'none' || out.some((s) => s.x === x && s.y === y)) continue;
    out.push({ type, x, y });
  }
  return out;
}
