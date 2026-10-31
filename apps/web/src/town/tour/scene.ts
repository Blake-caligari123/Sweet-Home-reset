import type { DebugTarget } from '../debug';

/** What a tour card can set up: the day and time, where Puff is, and a few things in the save. */
export class Scene {
  constructor(private g: DebugTarget) {}

  get state() { return this.g.state; }

  /** A new day as the night would start it: the board and the Grumbles for that day. */
  day(d: number) { this.g.clock.state.day = d; this.g.jobs.post(); this.g.grumbles.newDay(d); return this; }
  time(h: number, m = 0) { this.g.clock.state.minutes = h * 60 + m; return this; }
  /** Puff to a place's front door (and it counts as visited, for the map). */
  go(area: string) { this.g.rebuild(); const s = this.g.spawnOf(area); this.g.enterArea(area, s.x, s.y, false); return this; }
  give(item: string, n = 1) { this.state.bag.add(item, n); return this; }
  sparkles(n: number) { this.state.sparkles = Math.max(this.state.sparkles, n); return this; }
  flag(f: string) { this.state.flag(f); return this; }
  meet(...ids: string[]) { for (const id of ids) this.state.friendOf(id).met = true; return this; }
  /** A place fully restored (a neighbour's home, for what that changes). */
  restore(area: string) { this.g.messFor(area).restore(); return this; }
  visited(...areas: string[]) { for (const a of areas) this.state.visit(a); return this; }
}
