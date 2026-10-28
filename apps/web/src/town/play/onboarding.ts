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
  /** Restoring this area finishes the step (its last mess sparkles away, so it can't be done by hand). */
  doneByRestore?: string;
}

export const STEPS: Step[] = [
  { id: 'walk', hint: 'Tap the floor to walk. Try the rug.', match: (e) => e.type === 'stood' && e.ground === 'rug' },
  { id: 'dust', hint: 'Tap the dust to clean it.', count: 3, doneByRestore: 'burrow', match: (e) => e.type === 'cleared' && e.mess === 'dust' },
  { id: 'sock', hint: 'Pick up the sock, then tap the basket.', match: (e) => e.type === 'putaway' && e.item === 'sock' },
  { id: 'stain', hint: 'Sponge a stain in the Kitchen Nook. It takes 3 hits.', grant: ['sponge'], doneByRestore: 'burrow', match: (e) => e.type === 'cleared' && e.mess === 'stain' },
  { id: 'fluff', hint: 'Cleaning uses Fluff. Try the snack on the counter!', match: (e) => e.type === 'timer' },
  { id: 'burrow', hint: 'Tidy the rest of the burrow.', match: (e) => e.type === 'restored' && e.area === 'burrow' },
  { id: 'yard', hint: 'Head outside and rake the weeds.', grant: ['rake'], count: 3, match: (e) => e.type === 'cleared' && e.mess === 'weeds' },
  { id: 'plant', hint: 'Plant 3 radish seeds in the garden plot.', grant: ['can'], items: { radish_seeds: 3 }, count: 3, match: (e) => e.type === 'planted' },
  { id: 'water', hint: 'Water your seeds with the can.', count: 3, match: (e) => e.type === 'watered' },
  { id: 'town', hint: 'Follow the path to the Town Square.', match: (e) => e.type === 'entered' && e.area === 'square' },
  { id: 'bakery', hint: "Hazel's bakery could use a hand.", match: (e) => e.type === 'restored' && e.area === 'bakery' }
];

export class Onboarding {
  /**
   * step: the hint showing now. ahead: progress per step id, counted for later steps too, so
   * doing things out of order (putting the sock away before the dust is done) still counts.
   */
  constructor(public step = 0, public ahead: Record<string, number> = {}) {}

  get current(): Step | null { return STEPS[this.step] ?? null; }
  get done() { return this.step >= STEPS.length; }
  /** A6: skippable after the first clean. */
  get skippable() { return this.step >= 2 && !this.done; }

  /** Feed a game event; returns the steps it completed (so the game can grant their rewards). */
  handle(e: OnboardEvent): Step[] {
    for (let i = this.step; i < STEPS.length; i += 1) {
      const s = STEPS[i];
      if (s.match(e)) this.ahead[s.id] = (this.ahead[s.id] ?? 0) + 1;
      if (e.type === 'restored' && s.doneByRestore === e.area) this.ahead[s.id] = s.count ?? 1;
    }
    const finished: Step[] = [];
    while (this.current && (this.ahead[this.current.id] ?? 0) >= (this.current.count ?? 1)) {
      finished.push(this.current);
      delete this.ahead[this.current.id];
      this.step += 1;
    }
    return finished;
  }

  /** Skip the rest: every tool and item the remaining steps would have given. */
  skip() {
    const rest = STEPS.slice(this.step);
    this.step = STEPS.length; this.ahead = {};
    return rest;
  }
}
