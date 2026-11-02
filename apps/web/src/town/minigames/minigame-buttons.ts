import type { Button } from '../ui/view';
import type { GameHost } from './games';
import { openLamps } from './lamps-sheet';
import { openPairs } from './pairs-sheet';
import { openPantry } from './pantry-sheet';
import { openShelf } from './shelf-sheet';
import { openSkip } from './skip-sheet';
import { openTea } from './tea-sheet';
import { openEcho } from './echo-sheet';
import { SEED_SET } from './pantry';
import { STASH_ITEMS } from './pairs';

/** Each mini-game, who plays it with Puff, and its chat-box button. */
export const GAMES: { id: string; who: string; label: string; title: string; open(d: GameHost): void }[] = [
  { id: 'shelf', who: 'moss', label: '📚 Sort a shelf', title: 'Sort the shelf', open: (d) => openShelf(d) },
  { id: 'pairs', who: 'bea', label: '🌱 Play garden pairs', title: 'Garden pairs', open: (d) => openPairs(d) },
  { id: 'pantry', who: 'hazel', label: '🧺 Help sort the pantry', title: 'Sort the pantry', open: (d) => openPantry(d) },
  { id: 'skip', who: 'otto', label: '🪨 Skip stones', title: 'Skip stones', open: (d) => openSkip(d) },
  { id: 'lamps', who: 'pip', label: '💡 Light the lamps', title: 'Light the lamps', open: (d) => openLamps(d) },
  { id: 'tea', who: 'mabel', label: '🫖 Pour the tea', title: 'Pour the tea', open: (d) => openTea(d) },
  // The newcomers' games (2 Nov): the shared ones in their own colours, and Juniper's tune.
  { id: 'stash', who: 'sorrel', label: '🌰 Find the stash pairs', title: 'Stash pairs', open: (d) => openPairs(d, 0, { title: '🌰 Sorrel\'s stash', intro: 'Sorrel hid pairs of treats. Turn two at a time to find them.', items: STASH_ITEMS, back: '🌰' }) },
  { id: 'seeds', who: 'fig', label: '🌱 Sort the seed tins', title: 'Sort the seed tins', open: (d) => openPantry(d, 0, SEED_SET) },
  { id: 'boat', who: 'wren', label: '⛵ Sail a paper boat', title: 'Sail a paper boat', open: (d) => openSkip(d, 0, { title: '⛵ Paper boats', intro: 'Tap Sail! when the flag is in the green: the best breeze.', button: 'Sail!', unit: ['wave', 'waves'], mark: '⛵', again: 'Another boat' }) },
  { id: 'echo', who: 'juniper', label: '🎵 Echo the tune', title: 'Echo the tune', open: (d) => openEcho(d) },
  { id: 'buoys', who: 'marlo', label: '🛟 Light the buoys', title: 'Light the buoys', open: (d) => openLamps(d, 0, { title: '🛟 Light the buoys', intro: 'Each buoy you light flips its neighbours. Light the whole harbour!', on: '✨', sea: true }) }
];

/** This neighbour's game button, if they have one. `host(id)` makes the sheet's host for that game. */
export function gameButtons(who: string, host: (game: string) => GameHost): Button[] {
  return GAMES.filter((g) => g.who === who).map((g) => ({ label: g.label, onClick: () => g.open(host(g.id)) }));
}
