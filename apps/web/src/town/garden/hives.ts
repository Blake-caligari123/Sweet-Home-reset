// Beehives (a cosy side activity, 2 Nov): a hive built at Pip's bench and placed anywhere fills
// with honey overnight, a jar a night, and two when flowers grow in the same place. It holds
// three; in winter the bees stay snug inside. Pure rules; hive-life.ts runs them.

/** Honey waiting in each hive, by its place and tile. */
export type Hives = Record<string, number>;

export const HIVE = 'beehive';
export const hiveKey = (area: string, x: number, y: number) => `${area}:${x},${y}`;

/** The flowers grown in beds (play/crops.ts): bees love a place with them. */
export const FLOWER_CROPS = ['daisy', 'poppy', 'aster', 'snowdrop'];

/** Overnight: each placed hive makes honey (more beside flowers), up to what it holds; none in winter. */
export function overnightHoney(hives: Hives, placed: { item: string; area: string; x: number; y: number }[], flowerAreas: Set<string>, season: string, max: number): Hives {
  const out: Hives = {};
  for (const p of placed.filter((d) => d.item === HIVE)) {
    const key = hiveKey(p.area, p.x, p.y);
    const made = season === 'Winter' ? 0 : flowerAreas.has(p.area) ? 2 : 1;
    out[key] = Math.min(max, (hives[key] ?? 0) + made);
  }
  return out;
}

/** Collect a hive's honey: how much, and the hives after. */
export function collectHoney(hives: Hives, key: string): { honey: number; hives: Hives } {
  return { honey: hives[key] ?? 0, hives: { ...hives, [key]: 0 } };
}
