import { seeded } from '../../shared/art/pixel-canvas';
import type { Area, AreaPack } from '../data/area';
import { TUNING } from '../data/tuning';
import type { PickupDef } from '../play/pickups';

// Golden dust: one shiny dust bunny waits somewhere Puff can reach each day (from goldenFromDay).
// Catching it costs no Fluff and gives a Sparkle burst and a find. The morning letter hints where.
export const GOLDEN = 'golden_dust';

export interface GoldenSpot { area: string; x: number; y: number }

/** The areas Puff can walk to on a day: from the burrow, through every door open by then. */
export function openOn(areas: AreaPack[], day: number) {
  const open = new Set(['burrow']);
  const queue = ['burrow'];
  while (queue.length) {
    const at = queue.shift();
    const a = areas.find((x) => x.id === at);
    for (const d of a?.doors ?? []) {
      const shut = d.closedText && (!d.opensDay || day < d.opensDay);
      if (shut || open.has(d.to) || !areas.some((x) => x.id === d.to)) continue;
      open.add(d.to); queue.push(d.to);
    }
  }
  return open;
}

/** Where today's golden dust waits, or null before it starts. */
export function goldenSpot(day: number, packs: AreaPack[], areas: Map<string, Area>): GoldenSpot | null {
  if (day < TUNING.rewards.goldenFromDay) return null;
  const rand = seeded(day * 2654435761);
  const open = [...openOn(packs, day)].sort();
  for (let tries = 0; tries < 50; tries += 1) {
    const id = open[Math.floor(rand() * open.length)];
    const a = areas.get(id)!;
    const x = Math.floor(rand() * a.w); const y = Math.floor(rand() * a.h);
    if (a.walkable(x, y) && !a.doorAt(x, y) && a.groundAt(x, y) !== 'soil') return { area: id, x, y };
  }
  return null;
}

/** Today's golden dust as a pickup in this area, if it's here and not caught yet. */
export function goldenPickup(spot: GoldenSpot | null, area: string, day: number): PickupDef[] {
  return spot && spot.area === area ? [{ id: `golden_${day}`, x: spot.x, y: spot.y, item: GOLDEN }] : [];
}
