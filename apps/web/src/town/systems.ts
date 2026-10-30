import type { Content } from './data/content';
import { CardHunt } from './craft/cards';
import { Helpers } from './life/helpers';
import type { TownLife } from './life/town-life';
import { openNeeds } from './needs/needs-sheet';
import { TownNeeds } from './needs/town-needs';
import { TidyChain } from './play/chain';
import type { OnboardingGuide } from './play/onboarding-guide';
import type { Puff } from './play/puff';
import { PuffMoods } from './skills/puff-mood';
import { SkillBook } from './skills/skill-book';
import { openSkills } from './skills/skills-sheet';
import type { TownState } from './state';
import type { Hud } from './ui/hud';
import type { View } from './ui/view';
import type { TownAreas } from './world/town-areas';
import type { World } from './world/world';

export interface SystemsHost {
  state: TownState; view: View; content: Content; hud: Hud; world: World; puff: Puff; places: TownAreas; life: TownLife; guide: OnboardingGuide;
  day(): number; arrived(key: string): boolean; refreshHud(): void;
}

/**
 * The Phase 6 systems that listen to play and speak in the morning: skills, Puff's mood, tidy
 * chains, recipe cards, town needs and neighbours helping. They hear what Puff does through the
 * guide; game.ts only asks them for the morning's news and opens their sheets.
 */
export class TownSystems {
  readonly moods: PuffMoods;
  private needs: TownNeeds;
  private helpers: Helpers;

  constructor(private host: SystemsHost) {
    const { state, view, content, places, life } = host;
    const arrived = (k: string) => host.arrived(k);
    this.moods = new PuffMoods({ state, view, hud: host.hud, day: () => host.day(), burrowTidy: () => places.mess('burrow').progress });
    this.needs = new TownNeeds({ state, content, life, arrived });
    this.helpers = new Helpers({ state, content, places, arrived });
    const skills = new SkillBook({ state, view, day: () => host.day() });
    const chain = new TidyChain({ state, view, world: host.world, feet: () => host.puff.feet, refreshHud: () => host.refreshHud() });
    const cards = new CardHunt({ state, content, view });
    host.guide.listen((e) => { skills.hear(e); this.moods.hear(e); chain.hear(e); cards.hear(e); });
  }

  /** After the night: town needs met, then who helped tidy. */
  morningNews() { return [...this.needs.morning(), ...this.helpers.morning()]; }

  openSkills() { openSkills(this.host.view, this.host.state, this.moods.line()); }
  openNeeds() { openNeeds(this.host.view, this.host.state, this.needs.known()); }
}
