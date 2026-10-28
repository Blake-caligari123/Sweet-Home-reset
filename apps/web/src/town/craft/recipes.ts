import type { ToolId } from '../play/mess';
import type { TownState } from '../state';

// Crafting at Pip's workbench (VISION §7): a recipe learned at a shop, Sparkles and forage
// (twigs, pebbles) make a better tool. Fixed costs, no chance involved.

/** What a recipe makes: a tool at a tier (more later: decor, gifts). */
export type Makes = { tool: ToolId; tier: number };

export interface RecipeDef { id: string; name: string; makes: Makes; cost: { sparkles?: number; items?: Record<string, number> }; learn?: string }

/** `unknown`: not learned yet (or no tool to upgrade); `have`: already at that tier or better. */
export function canCraft(s: TownState, r: RecipeDef): 'ok' | 'unknown' | 'have' | 'short' {
  if (r.learn && !s.has(r.learn)) return 'unknown';
  const now = s.tools[r.makes.tool];
  if (!now) return 'unknown';
  if (now >= r.makes.tier) return 'have';
  if (s.sparkles < (r.cost.sparkles ?? 0)) return 'short';
  if (Object.entries(r.cost.items ?? {}).some(([id, n]) => s.bag.count(id) < n)) return 'short';
  return 'ok';
}

/** Make it, paying the cost; all or nothing. */
export function craft(s: TownState, r: RecipeDef) {
  if (canCraft(s, r) !== 'ok') return false;
  s.sparkles -= r.cost.sparkles ?? 0;
  for (const [id, n] of Object.entries(r.cost.items ?? {})) s.bag.remove(id, n);
  s.tools[r.makes.tool] = r.makes.tier;
  return true;
}
