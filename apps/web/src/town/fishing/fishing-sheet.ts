import { h } from '../../shared/ui/dom';
import type { Clock } from '../play/clock';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { OnboardEvent } from '../play/onboarding';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';
import { fishHere, reel, whichFish } from './fishing';

export interface FishingHost { state: TownState; view: View; content: Content; clock: Clock; area(): string; onboard(e: OnboardEvent): void; changed(): void }

const ROD = 'fishing_rod';

/** At the ripples: cast, wait for the bite, tap Reel in! in time. Cast again as often as Puff likes. */
export function openFishing(d: FishingHost) {
  const { state, view, content, clock } = d;
  if (!state.bag.count(ROD)) { view.say(content.line('fish.no_rod') ?? ''); return; }
  const status = h('p', { class: 'friend-name' }, '');
  const bobber = h('p', { style: { fontSize: '2.4rem', margin: '6px 0' }, 'aria-hidden': 'true' }, '🎣');
  const btn = h('button', { class: 'btn big', type: 'button' }, 'Reel in!');
  // waiting: line in the water; bite: the window to reel; done: caught or got away (tap to cast again).
  let phase: 'waiting' | 'bite' | 'done' = 'waiting';
  let biteAt = Infinity; let timer = 0;
  const settle = (text: string) => { phase = 'done'; status.textContent = text; btn.textContent = 'Cast again'; btn.classList.remove('primary'); };
  const startCast = () => {
    phase = 'waiting'; biteAt = Infinity;
    bobber.textContent = '🎣'; btn.textContent = 'Reel in!'; btn.classList.remove('primary');
    status.textContent = 'Waiting for a bite…';
    const [lo, hi] = TUNING.fishing.biteMs;
    timer = window.setTimeout(() => {
      phase = 'bite'; biteAt = performance.now();
      bobber.textContent = '💦'; status.textContent = 'A bite! Reel in!'; btn.classList.add('primary');
      view.feedback('boing', 'medium');
    }, lo + Math.random() * (hi - lo));
  };
  btn.addEventListener('click', () => {
    if (phase === 'done') { startCast(); return; }
    window.clearTimeout(timer);
    const r = reel(biteAt, performance.now(), TUNING.fishing.windowMs);
    bobber.textContent = '〰';
    if (r !== 'caught') { settle(r === 'early' ? 'Too soon! The fish swam off.' : 'It got away!'); return; }
    const here = fishHere(content.pack.fish ?? [], d.area(), clock.season, clock.state.minutes);
    const fish = whichFish(here, clock.state.day, state.fishCaught);
    if (!fish) { settle('Nothing bites here right now.'); return; }
    if (!state.bag.canAdd(fish.id)) { settle('Bag\'s full! It swims away.'); return; }
    state.bag.add(fish.id); state.fishCaught += 1;
    bobber.replaceChildren(itemIcon(fish.id, 3));
    settle(`Caught: ${content.itemName(fish.id)}!`);
    view.feedback('fanfare', 'success');
    d.onboard({ type: 'caught', fish: fish.id });
    d.changed();
  });
  view.sheet('Fishing', [h('p', { class: 'muted' }, 'Wait for the splash, then tap Reel in! quickly.'), bobber, status, btn]);
  startCast();
}
