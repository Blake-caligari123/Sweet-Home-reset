import type { Content } from '../data/content';
import type { Clock } from '../play/clock';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { World } from '../world/world';
import { festivalToday, lanternsLeft, litFlag } from './festivals';

export interface LanternsHost {
  state: TownState; view: View; content: Content; clock: Clock; world: World;
  /** The area changed (a lantern lit): show it again. */
  refreshArea(): void;
  refreshHud(): void;
  save(): void;
  /** Play a story scene once (the year-one finale). */
  playStory(id: string): void;
}

/** Sparkles for lighting every lantern, once each Winter Lights. */
const ALL_LIT = 100;

/**
 * Winter Lights (VISION §7): Puff lights each lantern round the square, no hurry. When the last
 * one glows, the Glimmerwell shines and the year's chapter closes (the game carries on into spring).
 */
export class Lanterns {
  constructor(private host: LanternsHost) {}

  light(x: number, y: number) {
    const { state, view, content, clock, world } = this.host;
    const def = festivalToday(content.pack.festivals ?? [], clock.state.day);
    if (def?.game !== 'lights' || !lanternsLeft(def, state.flags, clock.state.day).some((l) => l.x === x && l.y === y)) return;
    state.flag(litFlag(def, clock.state.day, x, y));
    world.sparkleBurst(x, y, 8);
    view.feedback('chime', 'success');
    this.host.refreshArea();
    if (lanternsLeft(def, state.flags, clock.state.day).length) { view.say(content.line(`festival.${def.id}.lit`) ?? ''); this.host.save(); return; }
    state.flag(`festival_${def.id}`);
    state.sparkles += ALL_LIT;
    world.sparkleBurst(15, 10, 30);
    view.feedback('fanfare', 'success');
    view.banner(`${content.line(`festival.${def.id}.done`) ?? ''} +${ALL_LIT} ✨`);
    const text = `${content.line(`festival.${def.id}.done`) ?? ''} ${content.line(`festival.${def.id}.next`) ?? ''}`;
    const scene = def.scene;
    if (scene) view.ask(text, [{ label: 'OK', primary: true, onClick: () => this.host.playStory(scene) }]);
    else view.showDialogue(text);
    this.host.refreshHud();
    this.host.save();
  }
}
