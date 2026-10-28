import { h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import { TUNING } from '../data/tuning';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { readFlag, type LetterDef } from './letters';

/** A letter: its lines, then a reply to choose. Replying sends it back and is friendship with its writer. */
export function openLetter(view: View, content: Content, state: TownState, l: LetterDef, done: () => void) {
  let close = () => {};
  const replies = l.replies.map((r) => {
    const b = h('button', { class: 'btn small primary', type: 'button' }, content.line(r.label) ?? '');
    b.addEventListener('click', () => {
      view.uiTap();
      for (const f of [readFlag(l), r.flag, ...(l.gives ?? [])]) state.flag(f);
      state.friendOf(l.from).points += TUNING.friendship.letter;
      close();
      view.feedback('chime', 'success');
      view.say(content.line(l.sent ?? 'letter.sent') ?? '');
      done();
    });
    return b;
  });
  close = view.sheet(content.line(l.title ?? 'letter.title') ?? '', [
    h('div', { class: 'note letter' }, ...l.lines.map((id) => h('p', {}, content.line(id) ?? ''))),
    h('p', { class: 'muted' }, 'Write back:'), h('div', { class: 'reply-list' }, ...replies)
  ], undefined, 'Later');
}
