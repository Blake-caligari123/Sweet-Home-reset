import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import { heartsOf } from '../neighbours/talk';
import type { Conversations } from '../neighbours/conversations';
import type { TownState } from '../state';
import type { Button, View } from '../ui/view';
import { canInvite, invite, teaTime } from './tea';

export interface TeaHost { state: TownState; content: Content; view: View; talk: Conversations; day(): number; minutes(): number; refreshHud(): void; save(): void }

const line = (h: TeaHost, id: string, who: string) => h.content.named((h.content.line(id) ?? '').replaceAll('{name}', h.content.neighbour(who)?.name ?? ''));

/** This neighbour's tea buttons: asking them round, or (on the day, at the table) having tea together. */
export function teaButtons(h: TeaHost, id: string): Button[] {
  const { state, view, content } = h;
  const def = content.neighbour(id);
  const f = state.friends[id];
  if (!def || !f?.met) return [];
  const day = h.day();
  if (teaTime(state.tea, id, day, h.minutes())) return [{ label: '☕ Have tea together', onClick: () => {
    state.tea = { ...state.tea!, had: true };
    f.points += TUNING.teaFriendship;
    state.sparkles += TUNING.teaSparkles;
    h.talk.says(def, line(h, `tea.chat.${(day + id.length) % 4}`, id), TUNING.teaFriendship, false);
    view.feedback('fanfare', 'success');
    view.banner(`☕ ${line(h, 'tea.banner', id)} +${TUNING.teaSparkles} ✨`);
    h.refreshHud(); h.save();
  } }];
  if (!canInvite(state.tea, day, heartsOf(f.points))) return [];
  return [{ label: '☕ Come round for tea tomorrow?', onClick: () => {
    state.tea = invite(id, day);
    h.talk.says(def, line(h, 'tea.yes', id), 0, false);
    view.feedback('chime', 'light');
    h.save();
  } }];
}

/** The morning card: who's coming for tea today. */
export function teaMorning(h: TeaHost): string[] {
  const t = h.state.tea;
  return t && t.day === h.day() && !t.had ? [line(h, 'tea.morning', t.who)] : [];
}
