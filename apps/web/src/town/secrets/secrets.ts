import type { AreaPack } from '../data/area';

// Secret places (NEXT-PHASE §5.4: things only curious players find). A secret door is pack data:
// a door that only opens once Puff has turned up the find it needs (an old key under the mess).
// Until then it isn't there at all, just the hedge; once found, a path leads through.

/** An area as it stands: secret doors Puff hasn't the find for yet are left out, the rest get a path. */
export function withSecrets(pack: AreaPack, found: readonly string[]): AreaPack {
  if (!pack.doors.some((d) => d.needsFind)) return pack;
  const open = pack.doors.filter((d) => d.needsFind && found.includes(d.needsFind));
  const rows = pack.map.map((r) => r.split(''));
  let legend = pack.legend;
  let path = Object.keys(legend).find((k) => legend[k] === 'path');
  if (open.length && !path) { path = '·'; legend = { ...legend, [path]: 'path' }; }
  for (const d of open) if (path && rows[d.y]?.[d.x] !== undefined) rows[d.y][d.x] = path;
  return { ...pack, legend, map: rows.map((r) => r.join('')), doors: pack.doors.filter((d) => !d.needsFind || found.includes(d.needsFind)) };
}
