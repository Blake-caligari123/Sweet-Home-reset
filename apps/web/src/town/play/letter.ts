import { localDate } from '../../shared/date';
import { TUNING } from '../data/tuning';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { Clock } from './clock';

/** What Puff did yesterday, and a tiny matching real chore (GDD v3 §2.4: warm, no guilt). */
const LETTER_CHORES: Record<string, [string, string]> = {
  dust: ['dusted a whole room', 'dust one shelf of yours'],
  stain: ['scrubbed a stain away', 'wipe one counter of yours'],
  weeds: ['raked the weeds', 'water a plant, or pull one weed'],
  clutter: ['put things where they live', 'put 3 things back where they belong'],
  crumbs: ['cleaned a counter', 'wipe one counter of yours'],
  cobweb: ['swept away cobwebs', 'dust one high corner'],
  grime: ['scrubbed away grime', 'wipe one tap or handle'],
  fog: ['cleared a foggy mirror', 'wipe one mirror or window'],
  mud: ['cleared away mud', 'shake out one doormat'],
  none: ['had a cosy day', 'open a window for some fresh air']
};

/** Each morning: Puff's letter with one optional real chore. Ticking it gives a Cosy Boost (5 a real day at most). */
export function morningLetter(d: { state: TownState; view: View; clock: Clock; refreshHud(): void }) {
  const { state, view } = d;
  const [did, chore] = LETTER_CHORES[state.lastClean] ?? LETTER_CHORES.none;
  const today = localDate();
  if (state.chores.day !== today) state.chores = { ...state.chores, day: today, keys: [] };
  const key = `day${d.clock.state.day}`;
  view.ask(`Dear friend, yesterday I ${did}. My paws sparkle! Maybe ${chore}? Or just have tea. Both are lovely. ♥ Puff`, [
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
