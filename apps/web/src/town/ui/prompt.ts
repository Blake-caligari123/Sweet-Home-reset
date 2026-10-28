import type { Content } from '../data/content';
import type { Crop } from '../state';
import type { Here, Target } from '../play/targets';

const CLEAN: Record<string, string> = { dust: 'Dust it', stain: 'Sponge the stain', weeds: 'Rake the weeds', grime: 'Scrub the grime', cobweb: 'Dust the cobweb' };
const USE: Record<string, string> = { putaway: 'Put things away', sleep: 'Go to bed', sign: 'Read the sign', board: 'Read the notice board', mailbox: 'Check the mail', shop: 'Browse the shop', build: 'Look at the Keeper\'s plans', craft: 'Use the workbench', cook: 'Cook something', museum: 'Look at Moss\'s collection', decor: 'Pick it up', mine: 'Mine the rock', hatch: 'Climb down', repair: 'Look at the broken bridge' };

/** The context line above the tool bar: what Puff is facing or about to do. */
export function promptFor(t: Target | null, here: Here, crops: Crop[], content: Content): string {
  if (!t) return '';
  const name = (id: string) => content.itemName(id).toLowerCase();
  switch (t.kind) {
    case 'mess': {
      const { mess, area } = here;
      const type = mess.typeAt(t.x, t.y);
      const hp = mess.hp[t.y * area.w + t.x];
      const verb = type === 'clutter' ? `Pick up the ${name(mess.item[t.y * area.w + t.x] ?? '')}` : CLEAN[type] ?? 'Clean it';
      return `${verb}${hp > 1 ? ` (${hp} hits)` : ''}`;
    }
    case 'soil': return crops.some((c) => c.area === here.area.pack.id && c.x === t.x && c.y === t.y) ? 'Tend the crop' : 'Plant seeds';
    case 'door': return 'Go through';
    case 'pickup': { const p = here.pickups.find((x) => x.id === t.id); return p?.letter ? 'Read the letter' : p ? `Take the ${name(p.item)}` : ''; }
    case 'neighbour': return `Say hello to ${content.neighbour(t.id)?.name ?? 'them'}`;
    case 'grumble': return 'Brighten the Grumble';
    case 'prop': return USE[t.action] ?? '';
    default: return '';
  }
}
