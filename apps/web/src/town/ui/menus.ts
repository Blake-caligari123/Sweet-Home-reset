import type { Sound } from '../../shared/audio/sound';
import type { Account } from '../account/account-sheet';
import { openCollection } from '../bloom/collection-sheet';
import { openBuildBoard } from '../build/build-sheet';
import type { TownPack } from '../data/area';
import type { Content } from '../data/content';
import type { Placing } from '../decor/placing';
import { lettersWaiting } from '../letters/letters';
import type { Conversations } from '../neighbours/conversations';
import { openOutfits } from '../outfits/outfit-sheet';
import type { Clock } from '../play/clock';
import { nudge } from '../play/nudges';
import type { OnboardingGuide } from '../play/onboarding-guide';
import type { Puff } from '../play/puff';
import { openShop } from '../shops/shop-sheet';
import { isOpen } from '../shops/shops';
import type { TownState } from '../state';
import { seenFlag } from '../story/path';
import type { TownSystems } from '../systems';
import type { Scene } from '../tour/scene';
import { openTour } from '../tour/tour-sheet';
import { openMap } from '../travel/map-sheet';
import type { Unlocker } from '../unlock/unlock-card';
import type { Pt } from '../world/nav';
import type { TownAreas } from '../world/town-areas';
import type { World } from '../world/world';
import { openBag } from './bag-sheet';
import { openNaming } from './naming-sheet';
import { meterOf } from '../play/tidy-meter';
import { completionParts, completionPct } from '../bloom/completion';
import { openCompletion } from '../bloom/completion-sheet';
import { openPause } from './pause-menu';
import type { Settings, View } from './view';

export interface MenusHost {
  state: TownState; view: View; content: Content; clock: Clock; places: TownAreas; world: World; puff: Puff; settings: Settings; sound: Sound;
  talk: Conversations; systems: TownSystems; guide: OnboardingGuide; unlocker: Unlocker; account: Account | null; placing: Placing;
  areaId(): string; arrived(key: string): boolean;
  enterArea(id: string, x: number, y: number, announce: boolean, feet?: Pt): void;
  travel(id: string, x: number, y: number): void;
  refreshHud(): void; save(): void;
  /** Settings changed in Pause: apply them and save. */
  settingsChanged(): void;
  /** The feature tour's scene setter, on the test link only. */
  tour: (() => Scene) | null;
  playStory(id: string): void;
}

/**
 * The sheets the game opens from the HUD and chat boxes: Pause, the map, the bag, the
 * journal, names, shops and the Keeper's plans. game.ts wires them to buttons; this builds them.
 */
export class Menus {
  constructor(private h: MenusHost) {}

  openShop(shop: NonNullable<TownPack['shops']>[number]) {
    const { state, view, content, clock } = this.h;
    openShop({ state, view, content, clock, refreshHud: () => this.h.refreshHud(), save: () => this.h.save() }, shop);
  }

  /** "Browse" in a shopkeeper's chat box while their shop is open. */
  shopButtonsFor(id: string) {
    const { content, clock } = this.h;
    return (content.pack.shops ?? []).filter((s) => s.keeper === id && isOpen(s, clock.state.minutes, clock.state.day))
      .map((s) => ({ label: `Browse ${s.name.replace(/^.*'s /, '')}`, onClick: () => this.openShop(s) }));
  }

  openBuild() {
    const { state, view, content, clock, places, puff, world } = this.h;
    openBuildBoard({
      state, view, content, clock, arrived: (k) => this.h.arrived(k),
      started: (plot) => {
        places.rebuild(state);
        if (plot.area === this.h.areaId()) this.h.enterArea(plot.area, puff.x, puff.y, false, { x: puff.fx, y: puff.fy });
        world.sparkleBurst(plot.x, plot.y, 10);
        this.h.refreshHud(); this.h.save();
      }
    });
  }

  openBag() {
    const { state, view, content, guide, placing } = this.h;
    openBag({ state, view, content, onboard: (e) => guide.handle(e), refreshHud: () => this.h.refreshHud(), place: (id) => { placing.start(id); this.h.refreshHud(); } });
  }

  openPause() {
    const { state, view, content, settings, sound, talk, systems, guide, unlocker, account } = this.h;
    const tour = this.h.tour;
    openPause({
      view, settings, sound,
      settingsChanged: () => this.h.settingsChanged(),
      openFriends: () => talk.openFriends(),
      openNames: () => this.openNames(),
      openOutfits: () => openOutfits(view, content, state, () => this.h.save()),
      openCollection: () => openCollection(view, content, state),
      openJournal: () => this.openJournal(),
      openSkills: () => systems.openSkills(),
      openNeeds: () => systems.openNeeds(),
      completion: completionPct(completionParts(state, content.pack)),
      openCompletion: () => openCompletion(view, state, content.pack, content.named('{town}')),
      openTour: tour ? () => openTour(view, tour(), () => { this.h.refreshHud(); this.h.save(); }) : null,
      townLine: `🌸 Town Bloom: ${content.line(`bloom.${state.bloom}`)} · ${state.finds.found.length} of ${content.pack.finds?.length ?? 0} finds`,
      skipTips: state.onboarding.skippable ? () => guide.skip() : null,
      restore: unlocker.gate ? () => void unlocker.restore() : null,
      openAccount: account ? () => account.open() : null
    });
  }

  openMap() {
    const { view, state, content, places, clock } = this.h;
    const today = state.spotless.day === clock.state.day ? state.spotless.areas : [];
    openMap({
      view, visited: state.visited, here: () => this.h.areaId(), named: (t) => content.named(t),
      areas: () => content.pack.areas.map((a) => places.get(a.id)?.pack ?? a),
      go: (id, minutes) => { clock.pass(minutes); const s = places.get(id)!.pack.spawn; this.h.travel(id, s.x, s.y); },
      meter: (id) => meterOf(places.mess(id))
    }, today);
  }

  /** Name Puff and the town; `then` runs once the sheet closes. */
  openNames(then?: () => void) {
    const { view, state } = this.h;
    openNaming(view, state.names, (names) => { state.names = names; this.h.refreshHud(); this.h.save(); then?.(); });
  }

  /** The newest thing to try (a letter waiting, a Grumble, a repair due), if any. */
  nudgeLine() {
    const { content, clock, state } = this.h;
    const [letter] = lettersWaiting(content.pack.letters ?? [], clock.state.day, state.flags);
    return content.line(nudge(state, (k) => this.h.arrived(k), letter ? letter.hint ?? 'letter.hint' : null) ?? undefined) ?? null;
  }

  /** The 📔 journal, with every cutscene seen so far to watch again. */
  openJournal() {
    const { content, state, systems } = this.h;
    const tryNew = this.nudgeLine();
    const memories = (content.pack.scenes ?? []).filter((s) => s.id === 'opening' || state.has(seenFlag(s.id)))
      .map((s) => ({ label: content.line(s.name ?? s.title) ?? s.id, play: () => this.h.playStory(s.id) }));
    systems.openJournal(tryNew && content.named(tryNew), memories);
  }
}
