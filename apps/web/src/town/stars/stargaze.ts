import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { Clock } from '../play/clock';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { isNight, tonight } from './constellations';
import { openStars } from './star-sheet';

export interface StargazeHost { state: TownState; view: View; content: Content; clock: Clock; onboard(e: OnboardEvent): void; refreshHud(): void; save(): void }

/** The telescope: after dark, tonight's constellation to find (a new one goes in the star book, with Sparkles). */
export function stargaze(h: StargazeHost) {
  const { state, view, content, clock } = h;
  if (!isNight(clock.state.minutes)) { view.say(content.line('stars.day') ?? ''); return; }
  const c = tonight(clock.state.day, clock.season, state.starsSeen);
  openStars(view, c, clock.state.day, () => {
    h.onboard({ type: 'stargazed' });
    if (state.starsSeen.includes(c.id)) return content.line('stars.again') ?? '';
    state.starsSeen = [...state.starsSeen, c.id];
    state.sparkles += TUNING.starSparkles;
    h.refreshHud(); h.save();
    return `${content.line('stars.new') ?? ''} +${TUNING.starSparkles} ✨`;
  });
}
