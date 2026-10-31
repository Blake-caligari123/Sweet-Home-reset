import type { ToolId } from '../play/mess';
import { perkIn } from '../skills/skills';
import type { CookGesture } from './cook-steps';
import type { TownState } from '../state';

// Making things (VISION §7): at Pip's workbench, a recipe learned at a shop, Sparkles and forage
// (twigs, pebbles) make a better tool; in Puff's kitchen, what the farm grows becomes a dish.
// Fixed costs, no chance involved.

/** What a recipe makes: a tool at a tier, or an item (a dish). */
export type Makes = { tool: ToolId; tier: number } | { item: string; qty: number };

/** `station`: where it's made (Pip's workbench by default). `learn`: the flag that teaches it. */
export interface RecipeDef { id: string; name: string; station?: 'bench' | 'kitchen'; makes: Makes; cost: { sparkles?: number; items?: Record<string, number> }; learn?: string;
  /** In the kitchen, the cooking steps (cook-steps.ts); chop then stir if not given. */
  gestures?: CookGesture[] }

/** Sparkles a recipe costs Puff now: less as crafting grows. */
export const sparkleCost = (s: TownState, r: RecipeDef) => Math.round((r.cost.sparkles ?? 0) * (1 - perkIn(s.skills, 'crafting')));

/** `unknown`: not learned yet (or no tool a tier below to upgrade); `have`: already at that tier or better; `full`: no room in the bag. */
export function canCraft(s: TownState, r: RecipeDef): 'ok' | 'unknown' | 'have' | 'short' | 'full' {
  if (r.learn && !s.has(r.learn)) return 'unknown';
  if ('tool' in r.makes) {
    const now = s.tools[r.makes.tool];
    if (!now || now < r.makes.tier - 1) return 'unknown'; // one tier at a time: Silver after Copper
    if (now >= r.makes.tier) return 'have';
  }
  if (s.sparkles < sparkleCost(s, r)) return 'short';
  if (Object.entries(r.cost.items ?? {}).some(([id, n]) => s.bag.count(id) < n)) return 'short';
  if ('item' in r.makes && !s.bag.canAdd(r.makes.item, r.makes.qty)) return 'full';
  return 'ok';
}

/** Make it, paying the cost; all or nothing. */
export function craft(s: TownState, r: RecipeDef) {
  if (canCraft(s, r) !== 'ok') return false;
  s.sparkles -= sparkleCost(s, r);
  for (const [id, n] of Object.entries(r.cost.items ?? {})) s.bag.remove(id, n);
  if ('tool' in r.makes) s.tools[r.makes.tool] = r.makes.tier;
  else s.bag.add(r.makes.item, r.makes.qty);
  return true;
}
