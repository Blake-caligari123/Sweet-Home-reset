import type { ToolId } from './mess';

// GDD v3 A6, 0:00–6:30 for M1, then two soft goals that lead into town. One hint at a time;
// each disappears once done. Skippable after the first clean.
export type OnboardEvent =
  | { type: 'stood'; ground: string; area: string }
  | { type: 'cleared'; mess: string; area: string }
  | { type: 'putaway'; item: string }
  | { type: 'restored'; area: string }
  | { type: 'planted' }
  | { type: 'watered' }
  | { type: 'entered'; area: string }
  | { type: 'timer' };

export interface Step {
  id: string;
  hint: string;
  count?: number;
  grant?: ToolId[];
  items?: Record<string, number>;
  match: (e: OnboardEvent) => boolean;
}

export const STEPS: Step[] = [
  { id: 'walk', hint: 'Tap the floor to walk. Try the rug.', match: (e) => e.type === 'stood' && e.ground === 'rug' },
  { id: 'dust', hint: 'Tap the dust to clean it.', count: 3, match: (e) => e.type === 'cleared' && e.mess === 'dust' },
  { id: 'sock', hint: 'Pick up the sock, then tap the basket.', match: (e) => e.type === 'putaway' && e.item === 'sock' },
  { id: 'stain', hint: 'Sponge a stain in the Kitchen Nook. It takes 3 hits.', grant: ['sponge'], match: (e) => e.type === 'cleared' && e.mess === 'stain' },
  { id: 'fluff', hint: 'Cleaning uses Fluff. Snacks and sleep refill it.', match: (e) => e.type === 'timer' },
  { id: 'burrow', hint: 'Tidy the rest of the burrow.', match: (e) => e.type === 'restored' && e.area === 'burrow' },
  { id: 'yard', hint: 'Head outside and rake the weeds.', grant: ['rake'], count: 3, match: (e) => e.type === 'cleared' && e.mess === 'weeds' },
  { id: 'plant', hint: 'Plant 3 radish seeds in the garden plot.', grant: ['can'], items: { radish_seeds: 3 }, count: 3, match: (e) => e.type === 'planted' },
  { id: 'water', hint: 'Water your seeds with the can.', count: 3, match: (e) => e.type === 'watered' },
  { id: 'town', hint: 'Follow the path to the Town Square.', match: (e) => e.type === 'entered' && e.area === 'square' },
  { id: 'bakery', hint: "Hazel's bakery could use a hand.", match: (e) => e.type === 'restored' && e.area === 'bakery' }
];

export class Onboarding {
  constructor(public step = 0, public progress = 0) {}

  get current(): Step | null { return STEPS[this.step] ?? null; }
  get done() { return this.step >= STEPS.length; }
  /** A6: skippable after the first clean. */
  get skippable() { return this.step >= 2 && !this.done; }

  /** Feed a game event; returns the steps it completed (so the game can grant their rewards). */
  handle(e: OnboardEvent): Step[] {
    const finished: Step[] = [];
    for (let guard = 0; guard < STEPS.length; guard += 1) {
      const s = this.current;
      if (!s || !s.match(e)) break;
      this.progress += 1;
      if (this.progress < (s.count ?? 1)) break;
      finished.push(s);
      this.step += 1; this.progress = 0;
      // A restore can finish a later goal too (e.g. tidying the whole burrow before the stain).
      if (e.type !== 'restored') break;
    }
    return finished;
  }

  /** Skip the rest: every tool and item the remaining steps would have given. */
  skip() {
    const rest = STEPS.slice(this.step);
    this.step = STEPS.length; this.progress = 0;
    return rest;
  }
}
