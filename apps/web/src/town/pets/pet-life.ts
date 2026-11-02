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
import { knownTricks, newTrick, pat, startWalk, walkTo, WALK_PLACES, type TrickId } from './tricks';

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
    this.away = null;
    this.trail.reset(this.host.puff()); this.last = null;
    if (area === DOORSTEP) window.setTimeout(() => this.offer(), OFFER_DELAY_MS);
    this.walkHere(area);
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
    const s = this.away?.at ?? this.trail.spot;
    return !!this.host.state.pet && Math.abs(px - s.x) <= 9 && py >= s.y + FEET_TO_BASE - 14 && py <= s.y + FEET_TO_BASE + 2;
  }

  /** Tapping the pet: a pat, a trick, or a walk together. */
  pat() {
    const { state, view } = this.host;
    const pet = state.pet;
    if (!pet) return;
    this.comeBack();
    const walking = pet.walk?.day === this.host.day() && !pet.walk.done;
    const walked = pet.walk?.day === this.host.day() && pet.walk.done;
    view.ask(this.say('pet.menu'), [
      { label: `🐾 Pat ${pet.name}`, primary: true, onClick: () => this.givePat() },
      { label: '✨ Do a trick!', onClick: () => this.chooseTrick() },
      ...(walked ? [] : [{ label: walking ? `🌳 Walk: ${pet.walk!.places.length}/${WALK_PLACES} places` : '🌳 Go for a walk', onClick: () => this.walk() }]),
      { label: 'Bye!', onClick: () => {} }
    ]);
  }

  private givePat() {
    const { state, view } = this.host;
    const pet = state.pet!;
    const before = pet.bond ?? 0;
    pat(pet, this.host.day(), TUNING.petPatsPerDay);
    const s = this.trail.spot;
    this.host.world.sparkleBurst(Math.floor(s.x / T), Math.floor(s.y / T), 8);
    view.feedback('boing', 'light');
    view.say(this.say(`pet.pat.${(this.pats++ % 3) + 1}`));
    this.learned(before);
    this.host.save();
  }

  /** A new trick learned as the bond grows: a cheer, once. */
  private learned(before: number) {
    const t = newTrick(before, this.host.state.pet?.bond ?? 0);
    if (!t) return;
    this.host.view.feedback('fanfare', 'success');
    this.host.view.banner(this.say('pet.learned').replace('{trick}', t.name));
  }

  private trick: { id: TrickId; ms: number } | null = null;

  private chooseTrick() {
    const { view } = this.host;
    const known = knownTricks(this.host.state.pet?.bond ?? 0);
    view.ask(this.say('pet.which_trick'), [...known.map((t) => ({ label: t.name, onClick: () => this.doTrick(t.id) })), { label: 'Maybe later', onClick: () => {} }]);
  }

  private doTrick(id: TrickId) {
    this.trick = { id, ms: 0 };
    this.host.view.feedback(id === 'dance' ? 'combo' : 'pop', 'light');
    const s = this.trail.spot;
    this.host.world.sparkleBurst(Math.floor(s.x / T), Math.floor(s.y / T), 6);
    this.host.view.say(this.say(`pet.trick.${id}`));
  }

  /** A walk: three outdoor places together today; the pet finds something at the end. */
  private walk() {
    const { state, view } = this.host;
    const pet = state.pet!;
    if (!startWalk(pet, this.host.day())) return;
    view.say(this.say('pet.walk.start'));
    this.host.save();
  }

  /** Puff and the pet arrive somewhere outdoors: a step on today's walk. */
  private walkHere(area: string) {
    const { state, view, content } = this.host;
    const pet = state.pet;
    if (!pet || content.pack.areas.find((a) => a.id === area)?.kind !== 'outdoor') return;
    const r = walkTo(pet, this.host.day(), area);
    if (!r) return;
    if (!r.finished) { view.toast(`🐾 ${this.say('pet.walk.step').replace('{n}', String(r.count)).replace('{of}', String(WALK_PLACES))}`); this.host.save(); return; }
    const before = pet.bond ?? 0;
    pet.bond = before + TUNING.petWalkBond;
    state.sparkles += TUNING.petWalkSparkles;
    const def = content.pack.pets?.find((p) => p.id === pet.kind);
    const gift = def?.finds?.[this.host.day() % def.finds.length];
    if (gift && state.bag.canAdd(gift)) state.bag.add(gift);
    view.feedback('fanfare', 'success');
    view.banner(`🐾 ${this.say('pet.walk.done')} +${TUNING.petWalkSparkles} ✨${gift ? ` and ${content.itemName(gift).toLowerCase()}` : ''}`);
    this.learned(before);
    this.host.refreshHud(); this.host.save();
  }

  /** Off to its bed or after its ball: where it is, where it's going, and how long it's been. */
  private away: { to: Pt; at: Pt; kind: 'nap' | 'play'; ms: number } | null = null;

  /** A pet bed or ball (decor): the pet trots over for a nap, or chases the ball and comes back. A little bond, once a day each. */
  toy(type: string, x: number, y: number) {
    const { state, view } = this.host;
    const pet = state.pet;
    const kind = type === 'pet_bed' ? 'nap' : 'play';
    if (!pet) { view.say(this.say(kind === 'nap' ? 'pet.bed.empty' : 'pet.ball.empty')); return; }
    const day = this.host.day();
    const played = pet.toys?.day === day ? pet.toys.kinds : [];
    const before = pet.bond ?? 0;
    if (!played.includes(kind)) { pet.bond = before + 1; pet.toys = { day, kinds: [...played, kind] }; }
    this.away = { to: { x: x * T + T / 2, y: y * T + T - 3 }, at: { ...this.trail.spot }, kind, ms: 0 };
    view.feedback(kind === 'nap' ? 'pop' : 'boing', 'light');
    view.say(this.say(kind === 'nap' ? 'pet.bed.nap' : 'pet.ball.chase'));
    this.learned(before);
    this.host.save();
  }

  /** Back to trotting along behind Puff, from wherever it is. */
  private comeBack() { if (this.away) { this.trail.reset(this.away.at); this.away = null; } }

  /** Each frame: follow Puff's trail (or go to its bed or ball) and draw. */
  tick(dt: number) {
    const pet = this.host.state.pet;
    if (!pet) { this.host.layer.draw(null, dt); return; }
    this.trail.push(this.host.puff());
    let s = this.trail.spot;
    let napping = false;
    if (this.away) {
      const a = this.away; a.ms += dt;
      const dx = a.to.x - a.at.x; const dy = a.to.y - a.at.y; const d = Math.hypot(dx, dy); const step = dt * 0.07;
      a.at = d > step ? { x: a.at.x + (dx / d) * step, y: a.at.y + (dy / d) * step } : { ...a.to };
      const there = d <= step;
      const puff = this.host.puff();
      if (there && a.kind === 'play' && !this.trick) this.trick = { id: 'spin', ms: 0 };
      napping = there && a.kind === 'nap';
      if ((a.kind === 'play' && a.ms > 2800) || (a.kind === 'nap' && Math.hypot(puff.x - a.at.x, puff.y - a.at.y) > 6 * T)) this.comeBack();
      else s = a.at;
    }
    const moving = !!this.last && Math.hypot(s.x - this.last.x, s.y - this.last.y) > 0.05;
    const left = this.last ? s.x < this.last.x - 0.05 || (s.x <= this.last.x + 0.05 && this.leftWas) : false;
    this.leftWas = left;
    this.last = s;
    if (this.trick) { this.trick.ms += dt; if (this.trick.ms > 1100) this.trick = null; }
    this.host.layer.draw({ kind: pet.kind, x: s.x, y: s.y + FEET_TO_BASE, left, moving, trick: napping ? { id: 'sit', ms: 0 } : this.trick ?? undefined }, dt);
  }

}
