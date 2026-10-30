import type { Area } from '../data/area';
import type { Placing } from '../decor/placing';
import type { GrumbleLife } from '../grumbles/grumble-life';
import type { Neighbours } from '../neighbours/neighbours';
import type { PetLife } from '../pets/pet-life';
import type { View } from '../ui/view';
import { T } from '../world/art/texture';
import { REACH, type NavGrid, type Pt } from '../world/nav';
import type { World } from '../world/world';
import type { PuffActions } from './actions';
import type { Puff } from './puff';
import { distTo, neighbourAt, rectOf, targetAt, type Here, type Target } from './targets';

/** The most scrubs a rub, circle or hold can queue on one spot. */
export const MAX_RUB = 4;

export interface TapHost {
  view: View; puff: Puff; world: World; actions: PuffActions; placing: Placing; pet: PetLife; neighbours: Neighbours; grumbles: GrumbleLife;
  area(): Area; areaId(): string; nav(): NavGrid; here(): Here;
  /** A fade between places is running (taps wait). */
  fading(): boolean;
  refreshHud(): void;
}

/**
 * A tap on the world (from a finger, the keyboard or a drag that ends somewhere): walk there, or
 * walk within reach of what's there and use it. Placing decor and patting the pet come first.
 */
export class Taps {
  constructor(private host: TapHost) {}

  tap(px: number, py: number) {
    const h = this.host; const area = h.area();
    const tile = { x: Math.floor(px / T), y: Math.floor(py / T) };
    if (h.view.busy || h.fading() || !area.inside(tile.x, tile.y)) return;
    const p = h.puff;
    // Placing decor: taps go on the ground (tapping Puff stops).
    if (h.placing.active) { if (Math.hypot(px - p.fx, py - p.fy + 8) < 10) h.placing.stop(); else h.placing.tap(tile); h.refreshHud(); return; }
    if (h.pet.at(px, py)) { h.pet.pat(); return; }
    h.neighbours.releaseAll();
    p.charged = false;
    const target = neighbourAt(h.neighbours.visible(h.areaId()), px, py) ?? h.grumbles.at(px, py) ?? targetAt(h.here(), tile.x, tile.y);
    if (target.kind === 'neighbour') h.neighbours.hold(target.id);
    h.world.showMarker(px, py);
    const feet = p.feet;
    // Tapping the thing Puff is already working on queues another go.
    if (p.swingMs > 0 && p.swing && target.kind === p.swing.kind && target.x === p.swing.x && target.y === p.swing.y) {
      p.repeat = Math.min(3, p.repeat + 1);
      return;
    }
    const nav = h.nav();
    if (target.kind === 'walk') { this.go(nav.findPathTo(feet, { x: px, y: py }), null); return; }
    if (target.kind === 'door') { this.go(nav.findPathNear(feet, this.rectOf(target), 0), target); return; } // feet inside the door tile
    // Act from wherever is close enough to the target (any tile of a multi-tile prop).
    const r = this.rectOf(target);
    if (!p.path.length && distTo(r, feet) <= REACH) { h.actions.act(target); return; }
    const path = nav.findPathNear(feet, r, REACH);
    if (!path) { h.view.say('Hmm, can\'t reach that.'); return; }
    this.go(path, target);
  }

  /** A tap on mess or a Grumble with extra scrubs queued (from a rub, circle or hold). */
  scrub(p: Pt, extra: number) {
    this.tap(p.x, p.y);
    const puff = this.host.puff;
    const kind = (puff.swing ?? puff.action)?.kind;
    if (kind === 'mess' || kind === 'grumble') puff.repeat = Math.min(MAX_RUB, extra);
  }

  private go(path: Pt[] | null, action: Target | null) {
    if (!path) return;
    this.host.puff.path = path; this.host.puff.action = action;
  }

  private rectOf(t: Target) {
    const h = this.host;
    return rectOf(t, h.area(), t.kind === 'neighbour' ? h.neighbours.states.get(t.id) : t.kind === 'grumble' ? h.grumbles.find(t.id) : undefined);
  }
}
