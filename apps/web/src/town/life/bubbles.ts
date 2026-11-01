// Neighbour bubbles (polish: a town that feels alive). Now and then a little bubble over someone
// shows what they're up to (bread at the bakery, a book in the library, a rod by the river), how
// they feel (a hum when they're happy), or that they've noticed Puff: a wave as Puff comes near,
// a smile when Puff tidies beside them. Pure choices here; ui/neighbour-bubbles.ts draws them.

/** What someone might be doing in each place. */
const DOING: Record<string, string[]> = {
  bakery: ['🍞', '🥧', '☕'], library: ['📖', '📚'], bea_shop: ['🌸', '🌷'], pip_workshop: ['🔨', '🧸'], bathhouse: ['♨', '🧼'],
  riverside: ['🎣', '🌊'], far_bank: ['🎣', '🌿'], harbour: ['⚓', '🐟'], beach: ['🐚', '🌊'], woodland: ['🍎', '🍂'], orchard_hill: ['🍐', '🍎'],
  square: ['💬', '☕'], lane: ['💬', '🌼'], yard: ['🌱'], store: ['🛒'], library_garden: ['🌿']
};

/** Someone's own thing, wherever they are. */
const OWN: Record<string, string> = { juniper: '🎻', moss: '📖', pip: '🧸', hazel: '🍞', otto: '🎣', bea: '🐝', wren: '⛵', fig: '🌱', sorrel: '🌰', mabel: '✉', marlo: '⚓', thimble: '♪' };

export interface BubbleWho { id: string; area: string; pose: string; mood: string }

/** A bubble for a quiet moment: asleep, happy, their own thing, or what they're doing here. `roll` 0..1 picks. */
export function idleBubble(n: BubbleWho, roll: number): string {
  if (n.pose === 'sleep') return '💤';
  if ((n.mood === 'happy' || n.mood === 'glowing') && roll < 0.25) return '♪';
  const here = DOING[n.area];
  if (!here || roll < 0.45) return OWN[n.id] ?? '💬';
  return here[Math.floor(roll * 100) % here.length];
}

/** A wave as Puff comes close (once in a while per person), and a smile for tidying beside them. */
export const GREET = '👋';
export const PLEASED = ['😊', '✨', '💛'];

/** How long a bubble shows, and how long each person waits between idle bubbles. */
export const BUBBLE_MS = 2200;
export const IDLE_GAP_MS: [number, number] = [7000, 16000];
/** Within this many tiles, Puff is "near". */
export const NEAR_TILES = 2.5;
