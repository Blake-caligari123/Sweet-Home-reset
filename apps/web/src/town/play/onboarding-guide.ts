import type { TownState } from '../state';
import type { Hud } from '../ui/hud';
import { TOOL_NAMES } from '../ui/hud';
import type { View } from '../ui/view';
import type { Tile } from '../world/pathfind';
import type { AreaMess, ToolId } from './mess';
import type { OnboardEvent } from './onboarding';

export interface GuideHost {
  state: TownState;
  view: View;
  hud: Hud;
  area(): string;
  messFor(id: string): AreaMess;
  /** Glow these tiles (the tip's targets). */
  highlight(tiles: Tile[]): void;
  refreshHud(): void;
}

/** Which mess each burrow tip points at, and how many spots to light up. */
const TIP_MESS: Record<string, [string, number]> = { dust: ['dust', 4], stain: ['stain', 3], sock: ['clutter', 3] };

/**
 * Runs the onboarding tips in play: hands out each step's tools and items, lights up what to clean,
 * and moves on when Puff does the thing (in any order). The step rules live in onboarding.ts.
 */
export class OnboardingGuide {
  constructor(private host: GuideHost) {}

  handle(e: OnboardEvent) {
    const { state } = this.host;
    const done = state.onboarding.handle(e);
    if (!done.length) return;
    for (const step of done) {
      for (const t of step.grant ?? []) this.grantTool(t);
      for (const [id, n] of Object.entries(step.items ?? {})) state.bag.add(id, n);
    }
    const next = state.onboarding.current;
    if (next?.grant) for (const t of next.grant) this.grantTool(t);
    if (next?.items) for (const [id, n] of Object.entries(next.items)) if (state.bag.count(id) < n) state.bag.add(id, n - state.bag.count(id));
    if (next?.id === 'fluff') { this.host.hud.pulseFluff(); window.setTimeout(() => this.handle({ type: 'timer' }), 5000); }
    this.updateHighlight();
    this.host.refreshHud();
  }

  /** Skip the remaining tips (pause menu), still giving their tools and items. */
  skip() {
    const { state } = this.host;
    for (const step of state.onboarding.skip()) {
      for (const t of step.grant ?? []) state.tools[t] = 1;
      for (const [id, n] of Object.entries(step.items ?? {})) state.bag.add(id, n);
    }
    this.updateHighlight();
    this.host.refreshHud();
  }

  /** The sock tip can't be done if the sock is gone another way (given as a gift): count it done. */
  unstick() {
    const { state } = this.host;
    if (state.onboarding.current?.id !== 'sock' || state.bag.count('sock') > 0) return;
    if (!this.host.messFor('burrow').item.includes('sock')) this.handle({ type: 'putaway', item: 'sock' });
  }

  updateHighlight() {
    const step = this.host.state.onboarding.current;
    const tip = step && TIP_MESS[step.id];
    if (!step || this.host.area() !== 'burrow' || !tip) { this.host.highlight([]); return; }
    const [want, count] = tip;
    const m = this.host.messFor('burrow');
    const tiles: Tile[] = [];
    for (let i = 0; i < m.type.length; i += 1) if (m.typeAt(i % m.w, Math.floor(i / m.w)) === want) tiles.push({ x: i % m.w, y: Math.floor(i / m.w) });
    this.host.highlight(tiles.slice(0, count));
  }

  private grantTool(t: ToolId) {
    const { state, view } = this.host;
    if (state.tools[t]) return;
    state.tools[t] = 1;
    view.banner(`New tool: ${TOOL_NAMES[t]}!`);
  }
}
