import type { ToolId } from './mess';

// GDD v3 A6, the first 30 minutes: the burrow, the yard, then into town to meet Hazel, Bea and
// Pip, a first job and a first night's sleep. One hint at a time; each disappears once done, and
// anything done early counts. Skippable after the first clean.
export type OnboardEvent =
  | { type: 'stood'; ground: string; area: string }
  | { type: 'cleared'; mess: string; area: string }
  | { type: 'putaway'; item: string }
  | { type: 'restored'; area: string }
  | { type: 'planted' }
  | { type: 'watered' }
  | { type: 'entered'; area: string }
  | { type: 'timer' }
  | { type: 'met'; id: string }
  | { type: 'ate'; item: string }
  | { type: 'accepted'; id: string }
  | { type: 'jobDone'; id: string }
  | { type: 'slept' };

export interface Step {
  id: string;
  hint: string;
  count?: number;
  /** Tools handed over when the step is done. */
  grant?: ToolId[];
  /** Items topped up when the step starts (the seeds it asks Puff to plant). */
  items?: Record<string, number>;
  /** Items handed over when the step is done (Hazel's tart). */
  gift?: Record<string, number>;
  /** What Puff says when the step is done. */
  say?: string;
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
  // Heading outside also moves on, so a player who leaves a few bits behind isn't stuck on this tip for days.
  { id: 'burrow', hint: 'Tidy the rest of the burrow.', match: (e) => (e.type === 'restored' && e.area === 'burrow') || (e.type === 'entered' && e.area === 'yard') },
  { id: 'yard', hint: 'Head outside and rake the weeds.', grant: ['rake'], count: 3, match: (e) => e.type === 'cleared' && e.mess === 'weeds' },
  { id: 'plant', hint: 'Plant 3 radish seeds in the garden plot.', grant: ['can'], items: { radish_seeds: 3 }, count: 3, match: (e) => e.type === 'planted' },
  { id: 'water', hint: 'Water your seeds with the can.', count: 3, match: (e) => e.type === 'watered' },
  { id: 'town', hint: 'Follow the path to the Town Square.', say: 'Why is that fountain so quiet?', match: (e) => e.type === 'entered' && e.area === 'square' },
  { id: 'hazel', hint: 'Say hello to Hazel in her bakery.', gift: { tart: 1 }, say: 'A Berry tart from Hazel! Snack for later.', match: (e) => e.type === 'met' && e.id === 'hazel' },
  { id: 'eat', hint: "Eat Hazel's Berry tart. Tap it in the bag.", match: (e) => e.type === 'ate' && e.item === 'tart' },
  { id: 'board', hint: 'Check the notice board in the square.', match: (e) => e.type === 'accepted' && e.id === 'hazel_counter' },
  { id: 'counter', hint: "Dust Hazel's shop counter.", match: (e) => e.type === 'jobDone' && e.id === 'hazel_counter' },
  { id: 'lane', hint: 'Meet Bea and Pip on Neighbour Lane.', count: 2, match: (e) => e.type === 'met' && (e.id === 'bea' || e.id === 'pip') },
  { id: 'bed', hint: 'Explore, chat, tidy. Bed when {puff} gets sleepy.', match: (e) => e.type === 'slept' }
];

/** What the save already shows Puff did: neighbours met, flags, jobs taken. */
export interface Facts { met: string[]; flags: string[]; accepted: string[] }

/** Steps the save can answer by itself (an older save, or done before the tip came up). */
const FROM_FACTS: Record<string, (f: Facts) => number> = {
  hazel: (f) => Number(f.met.includes('hazel')),
  board: (f) => Number(f.accepted.includes('hazel_counter') || f.flags.includes('onboard_counter_done')),
  counter: (f) => Number(f.flags.includes('onboard_counter_done')),
  lane: (f) => ['bea', 'pip'].filter((id) => f.met.includes(id)).length
};

export class Onboarding {
  /**
   * step: the hint showing now. ahead: progress per step id, counted for later steps too, so
   * doing things out of order (putting the sock away before the dust is done) still counts.
   */
  constructor(public step = 0, public ahead: Record<string, number> = {}) {}

  get current(): Step | null { return STEPS[this.step] ?? null; }
  get done() { return this.step >= STEPS.length; }
  /** The tips still lead somewhere before the last one (bed), so an early night gets a gentle check. */
  get moreBeforeBed() { return !!this.current && this.current.id !== 'bed'; }
  /** A6: skippable after the first clean. */
  get skippable() { return this.step >= 2 && !this.done; }

  /** Feed a game event; returns the steps it completed (so the game can grant their rewards). */
  handle(e: OnboardEvent): Step[] {
    for (let i = this.step; i < STEPS.length; i += 1) {
      const s = STEPS[i];
      if (s.match(e)) this.ahead[s.id] = (this.ahead[s.id] ?? 0) + 1;
      if (e.type === 'restored' && s.doneByRestore === e.area) this.ahead[s.id] = s.count ?? 1;
    }
    return this.advance();
  }

  /** Count what the save already shows; returns the steps that finishes. */
  catchUp(f: Facts): Step[] {
    for (const s of STEPS.slice(this.step)) {
      const known = FROM_FACTS[s.id]?.(f) ?? 0;
      if (known > (this.ahead[s.id] ?? 0)) this.ahead[s.id] = known;
    }
    return this.advance();
  }

  private advance() {
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
