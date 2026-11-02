import type { Button } from '../ui/view';
import type { GameHost } from './games';
import { openLamps } from './lamps-sheet';
import { openPairs } from './pairs-sheet';
import { openPantry } from './pantry-sheet';
import { openShelf } from './shelf-sheet';
import { openSkip } from './skip-sheet';
import { openTea } from './tea-sheet';

/** Each mini-game, who plays it with Puff, and its chat-box button. */
export const GAMES: { id: string; who: string; label: string; title: string; open(d: GameHost): void }[] = [
  { id: 'shelf', who: 'moss', label: '📚 Sort a shelf', title: 'Sort the shelf', open: (d) => openShelf(d) },
  { id: 'pairs', who: 'bea', label: '🌱 Play garden pairs', title: 'Garden pairs', open: (d) => openPairs(d) },
  { id: 'pantry', who: 'hazel', label: '🧺 Help sort the pantry', title: 'Sort the pantry', open: (d) => openPantry(d) },
  { id: 'skip', who: 'otto', label: '🪨 Skip stones', title: 'Skip stones', open: (d) => openSkip(d) },
  { id: 'lamps', who: 'pip', label: '💡 Light the lamps', title: 'Light the lamps', open: (d) => openLamps(d) },
  { id: 'tea', who: 'mabel', label: '🫖 Pour the tea', title: 'Pour the tea', open: (d) => openTea(d) }
];

/** This neighbour's game button, if they have one. `host(id)` makes the sheet's host for that game. */
export function gameButtons(who: string, host: (game: string) => GameHost): Button[] {
  return GAMES.filter((g) => g.who === who).map((g) => ({ label: g.label, onClick: () => g.open(host(g.id)) }));
}
