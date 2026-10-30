import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { FEET_TO_BASE } from '../play/targets';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { T } from '../world/art/texture';
import type { Pt } from '../world/nav';
import type { PetLayer } from '../world/pet-layer';
import type { World } from '../world/world';
import { openPetChoice } from './pet-sheet';
import { sniff, Trail } from './pets';

export interface PetHost {
  state: TownState; view: View; content: Content; world: World; layer: PetLayer;
  /** Whether the pet has arrived in the year-one schedule (day 4). */
  arrived(key: string): boolean;
  puff(): Pt;
  day(): number;
  refreshHud(): void;
  save(): void;
}

/** Where the visitors wait: just outside the burrow door. */
const DOORSTEP = 'yard';
/** A beat after arriving, so Puff is through the door first. */
const OFFER_DELAY_MS = 700;
/** The pet has a sniff about once Puff's settled in. */
const SNIFF_DELAY_MS = 1500;

/** Puff's pet in play: chosen and named on day 4, then trotting along behind Puff everywhere. */
export class PetLife {
  private trail = new Trail(TUNING.petFollowPx);
  private last: Pt | null = null;
  private pats = 0;
  /** Facing left (kept while standing still, so it doesn't flip). */
  private leftWas = false;
  private offeredDay = 0;

  constructor(private host: PetHost) {}

  private get name() { return this.host.state.pet?.name ?? ''; }
  private say(id: string) { return (this.host.content.line(id) ?? '').replaceAll('{pet}', this.name); }

  /** From day 4 until one's chosen: stepping out of the burrow, the little visitors are at the door (once a day). */
  private offer() {
    const { state, view, content } = this.host;
    if (state.pet || !this.host.arrived('pet') || !content.pack.pets?.length || this.offeredDay === this.host.day()) return;
    this.offeredDay = this.host.day();
    view.say(this.say('pet.arrive'));
    openPetChoice(view, content, (kind, name) => {
      state.pet = { kind, name, day: this.host.day() };
      this.trail.reset(this.host.puff());
      view.banner(this.say('pet.welcome'));
      view.feedback('fanfare', 'success');
      this.host.refreshHud();
      this.host.save();
    });
  }

  /** A new area: the pet comes in at Puff's feet. Out in the yard, the visitors may be waiting. Outdoors, the pet may sniff something out. */
  entered(area: string) {
    this.trail.reset(this.host.puff()); this.last = null;
    if (area === DOORSTEP) window.setTimeout(() => this.offer(), OFFER_DELAY_MS);
    window.setTimeout(() => this.sniffAround(area), SNIFF_DELAY_MS);
  }

  private sniffAround(area: string) {
    const { state, content, view } = this.host;
    const pet = state.pet;
    if (!pet || content.pack.areas.find((a) => a.id === area)?.kind !== 'outdoor') return;
    const item = sniff(pet, content.pack.pets?.find((p) => p.id === pet.kind), area, this.host.day(), TUNING.petFindsPerDay);
    if (!item || !state.bag.canAdd(item)) return;
    state.bag.add(item);
    const s = this.trail.spot;
    this.host.world.sparkleBurst(Math.floor(s.x / T), Math.floor(s.y / T), 6);
    view.feedback('chime', 'light');
    view.say(this.say('pet.sniffed').replace('{item}', content.itemName(item)));
    this.host.refreshHud();
  }

  /** The pet drawn under this world point. */
  at(px: number, py: number) {
    const s = this.trail.spot;
    return !!this.host.state.pet && Math.abs(px - s.x) <= 9 && py >= s.y + FEET_TO_BASE - 14 && py <= s.y + FEET_TO_BASE + 2;
  }

  /** A pat: a happy wiggle and a sparkle (just for joy; nothing to keep up). */
  pat() {
    const s = this.trail.spot;
    this.host.world.sparkleBurst(Math.floor(s.x / T), Math.floor(s.y / T), 8);
    this.host.view.feedback('boing', 'light');
    this.host.view.say(this.say(`pet.pat.${(this.pats++ % 3) + 1}`));
  }

  /** Each frame: follow Puff's trail and draw. */
  tick(dt: number) {
    const pet = this.host.state.pet;
    if (!pet) { this.host.layer.draw(null, dt); return; }
    this.trail.push(this.host.puff());
    const s = this.trail.spot;
    const moving = !!this.last && Math.hypot(s.x - this.last.x, s.y - this.last.y) > 0.05;
    const left = this.last ? s.x < this.last.x - 0.05 || (s.x <= this.last.x + 0.05 && this.leftWas) : false;
    this.leftWas = left;
    this.last = s;
    this.host.layer.draw({ kind: pet.kind, x: s.x, y: s.y + FEET_TO_BASE, left, moving }, dt);
  }

}
