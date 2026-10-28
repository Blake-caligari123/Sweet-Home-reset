import type { Area } from './data/area';
import type { Neighbours } from './neighbours/neighbours';
import type { Clock } from './play/clock';
import { FULL_COLOUR, type AreaMess } from './play/mess';
import type { OnboardingGuide } from './play/onboarding-guide';
import type { Puff } from './play/puff';
import { FEET_TO_BASE } from './play/targets';
import type { Jobs } from './requests/jobs';
import type { TownState } from './state';
import type { View } from './ui/view';
import { T } from './world/art/texture';
import type { NavGrid } from './world/nav';
import type { World } from './world/world';

/** The parts of the game the test hooks look at and poke. */
export interface DebugTarget {
  world: World; puff: Puff; state: TownState; clock: Clock; jobs: Jobs; neighbours: Neighbours; view: View; guide: OnboardingGuide;
  areaId(): string; area(): Area; mess(): AreaMess; nav(): NavGrid; fading(): boolean;
  messFor(id: string): AreaMess;
  enterArea(id: string, x: number, y: number, announce: boolean): void;
  /** A tap at a world point. */
  tap(px: number, py: number): void;
  refreshHud(): void;
}

/** Test hooks for automated playthroughs (`window.__town`), only with ?debug in the URL. */
export function installDebugHooks(g: DebugTarget) {
  const s = g.state;
  (window as unknown as { __town: unknown }).__town = {
    tileToScreen: (x: number, y: number) => g.world.toScreen((x + 0.5) * T, (y + 0.5) * T),
    debug: () => ({ area: g.areaId(), puff: { x: g.puff.x, y: g.puff.y }, fluff: s.fluff.value, sparkles: s.sparkles, bag: s.bag.slots.filter(Boolean), tools: s.tools, step: s.onboarding.current?.id ?? 'done', progress: g.mess().progress, day: g.clock.state.day, minutes: g.clock.state.minutes, crops: s.crops }),
    setMinutes: (m: number) => { g.clock.state.minutes = m; },
    setDay: (d: number) => { g.clock.state.day = d; g.jobs.post(); },
    mess: () => { const m = g.mess(); const out: { x: number; y: number; type: string; hp: number; item?: string }[] = []; for (let i = 0; i < m.type.length; i += 1) if (m.type[i]) out.push({ x: i % m.w, y: Math.floor(i / m.w), type: m.typeAt(i % m.w, Math.floor(i / m.w)), hp: m.hp[i], item: m.item[i] }); return out; },
    props: () => g.area().pack.props.filter((p) => p.action).map((p) => ({ type: p.type, x: p.x, y: p.y, action: p.action, accepts: p.accepts })),
    doors: () => g.area().pack.doors.filter((d) => !d.closedText),
    tapTile: (x: number, y: number) => g.tap((x + 0.5) * T, (y + 0.5) * T),
    tapPoint: (x: number, y: number) => g.tap(x, y),
    feet: () => ({ x: g.puff.fx, y: g.puff.fy }),
    openAt: (x: number, y: number) => g.nav().openAt(x, y),
    busy: () => g.puff.path.length > 0 || g.puff.swingMs > 0 || g.view.busy || g.fading(),
    busyWhy: () => ({ path: g.puff.path.length, swingMs: g.puff.swingMs, view: g.view.busy, fading: g.fading() }),
    /** Jump to an area in full colour, for screenshots. */
    visit: (id: string, x: number, y: number, colour = true) => { if (colour) g.messFor(id).colour.fill(FULL_COLOUR); g.enterArea(id, x, y, false); },
    puffSprite: () => ({ ...g.world.puffDebug, pose: g.puff.pose, dir: g.puff.dir }),
    /** Where Puff is drawn, in tile units (the tile's own coords when standing at its usual spot). */
    drawn: () => ({ x: g.puff.fx / T - 0.5, y: (g.puff.fy + FEET_TO_BASE + 1) / T - 1 }),
    neighbours: () => g.neighbours.visible(g.areaId()).map((n) => ({ id: n.id, x: Math.floor(n.fx / T), y: Math.floor(n.fy / T), fx: n.fx, fy: n.fy, pose: n.pose, dir: n.dir })),
    tapNeighbour: (id: string) => { const n = g.neighbours.states.get(id); if (n) g.tap(n.fx, n.fy - 6); },
    grumbles: () => s.grumbles.list.filter((x) => x.area === g.areaId()),
    friends: () => s.friends,
    flags: () => s.flags,
    requests: () => s.requests,
    /** Skip the tips (hands over every tool), for tests of later play. */
    skipTips: () => g.guide.skip(),
    /** Mark this area restored (for testing what happens after), as if the last mess had gone. */
    restoreHere: () => { g.mess().restore(); },
    /** Every coming-alive stage of this area at once, for screenshots. */
    showAlive: () => { const st = g.area().pack.alive ?? []; g.world.alive.load(st, st.length); },
    /** Grow every crop by some days (as if that many nights passed, watered). */
    growCrops: (days: number) => { for (const c of s.crops) c.days += days; },
    /** Fluff straight to a value, to see the sleepy bar. */
    setFluff: (n: number) => { s.fluff.value = n; },
    addItem: (id: string, n = 1) => { s.bag.add(id, n); g.refreshHud(); },
    addSparkles: (n: number) => { s.sparkles += n; g.refreshHud(); },
    /** Friendship points straight in, to reach heart events in tests. */
    addPoints: (id: string, n: number) => { s.friendOf(id).points += Math.max(0, n); }
  };
}
