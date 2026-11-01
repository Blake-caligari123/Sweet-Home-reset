import { h } from '../../shared/ui/dom';
import type { View } from './view';

/** What the morning has to say, gathered in one place. */
export interface MorningCard {
  /** "Spring 7", and the sky: sunny, rain, a rainbow; a new season's line. */
  date: string; sky: string; season: string | null;
  /** Puff's note, with its tiny optional real chore. */
  note: string;
  /** The day's news: today's story step, the happening, goals, what was built, the town. */
  lines: string[];
}

/** A news line; a list in it ("🎯 Today's goals: a · b · c") gets its own bullets. */
function item(line: string) {
  const list = /^(.*?): (.* · .*)$/.exec(line);
  return list ? h('li', {}, list[1], h('ul', { class: 'morning-sub' }, ...list[2].split(' · ').map((x) => h('li', {}, x)))) : h('li', {}, line);
}

/**
 * Good morning! One card instead of a queue of banners: the date and sky, Puff's note (tick the
 * chore right here), and everything that's on today. "Let's go!" and the day begins.
 */
export function openMorning(view: View, card: MorningCard, chore: { did(): string; skip(): string }, then: () => void) {
  const answer = h('p', { class: 'muted morning-answer' });
  const did = h('button', { class: 'btn small primary', type: 'button' }, 'I did it!');
  const skip = h('button', { class: 'btn small', type: 'button' }, 'Not today');
  const choices = h('div', { class: 'btn-row' }, did, skip);
  const pick = (say: () => string) => { view.uiTap(); choices.remove(); answer.textContent = say(); };
  did.addEventListener('click', () => pick(chore.did));
  skip.addEventListener('click', () => pick(chore.skip));
  view.sheet(`☀ Good morning!`, [
    h('p', { class: 'morning-date' }, `${card.date} · ${card.sky}`),
    ...(card.season ? [h('p', { class: 'morning-season' }, card.season)] : []),
    h('div', { class: 'morning-note' }, h('p', {}, card.note), choices, answer),
    ...(card.lines.length ? [h('ul', { class: 'morning-list' }, ...card.lines.map(item))] : [])
  ], then, 'Let\'s go!');
}
