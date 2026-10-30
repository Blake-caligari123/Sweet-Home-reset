import { localDate } from '../../shared/date';
import { TUNING } from '../data/tuning';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { Clock } from './clock';

/**
 * What Puff did yesterday, and a tiny matching real chore (GDD v3 §2.4: warm, no guilt). Each claim is
 * true after a single clean, so the letter never says more than Puff did.
 */
const LETTER_CHORES: Record<string, [string, string]> = {
  dust: ['did some dusting', 'dust one shelf of yours'],
  stain: ['scrubbed a stain away', 'wipe one counter of yours'],
  weeds: ['pulled up some weeds', 'water a plant, or pull one weed'],
  clutter: ['put something back where it lives', 'put 3 things back where they belong'],
  crumbs: ['swept up some crumbs', 'wipe one counter of yours'],
  cobweb: ['swept away a cobweb', 'dust one high corner'],
  grime: ['scrubbed away some grime', 'wipe one tap or handle'],
  fog: ['cleared some foggy glass', 'wipe one mirror or window'],
  mud: ['cleared away some mud', 'shake out one doormat'],
  leaves: ['raked up some leaves', 'sweep one doorstep']
};

/** A quiet day (nothing tidied): a few cosy chores in turn, so the letter isn't the same each morning. */
const QUIET_CHORES = ['open a window for some fresh air', 'fluff one cushion', 'make one cup of tea', 'tuck in one blanket'];

/** The morning letter's text: yesterday's tidy (or a quiet day) and one tiny optional chore. */
export function letterText(lastClean: string, day: number, puff: string) {
  const known = LETTER_CHORES[lastClean];
  const [did, chore] = known ?? ['had a cosy, quiet day', QUIET_CHORES[day % QUIET_CHORES.length]];
  return `Dear friend, yesterday I ${did}.${known ? ' My paws sparkle!' : ''} Maybe ${chore}? Or just have tea. Both are lovely. ♥ ${puff}`;
}

/** Each morning: Puff's letter with one optional real chore. Ticking it gives a Cosy Boost (5 a real day at most). */
export function morningLetter(d: { state: TownState; view: View; clock: Clock; refreshHud(): void }) {
  const { state, view } = d;
  const today = localDate();
  if (state.chores.day !== today) state.chores = { ...state.chores, day: today, keys: [] };
  const key = `day${d.clock.state.day}`;
  view.ask(letterText(state.lastClean, d.clock.state.day, state.names.puff), [
    { label: 'I did it!', primary: true, onClick: () => {
      if (state.chores.keys.length >= TUNING.realChoreCapPerDay) { view.say('That\'s loads today. Rest counts too.'); return; }
      state.chores.keys.push(key); state.chores.total += 1;
      state.sparkles += TUNING.realChoreReward.sparkles;
      state.fluff.boost = TUNING.realChoreReward.maxFluffBonus;
      state.fluff.eat(TUNING.realChoreReward.maxFluffBonus);
      view.feedback('coin', 'success');
      view.banner(`Cosy Boost! +${TUNING.realChoreReward.sparkles} ✨ +${TUNING.realChoreReward.maxFluffBonus} Fluff today`);
      d.refreshHud();
    } },
    { label: 'Not today', onClick: () => view.say('Tea it is. Lovely.') }
  ]);
  state.lastClean = 'none';
}
