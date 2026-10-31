import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';
import type { JournalPage } from './journal';

/** Pause → 📔 Journal (or tap the 📖 tracker): today, the chapter's story so far, new things, side quests, and memories to watch again. */
export function openJournal(view: View, page: JournalPage, memories: { label: string; play(): void }[]) {
  const section = (title: string, ...body: Node[]) => h('div', { class: 'journal-part' }, h('p', { class: 'friend-name' }, title), ...body);
  const dots = h('p', { class: 'journal-dots', 'aria-label': `${page.done} of ${page.total} done` }, '●'.repeat(page.done) + '○'.repeat(Math.max(0, page.total - page.done)));
  const body: Node[] = [
    h('p', { class: 'journal-chapter' }, `📖 ${page.chapter}`), dots,
    section('Today', h('p', { class: 'note' }, page.today), ...page.also.map((a) => h('p', { class: 'muted' }, `You could also: ${a}`))),
    section('The story so far', ...(page.diary.length ? page.diary.map((d) => h('p', { class: 'journal-line' }, d)) : [h('p', { class: 'muted' }, 'The first page is waiting to be written.')]),
      ...page.past.map((c) => h('p', { class: 'muted' }, `✓ ${c}`)))
  ];
  if (page.tryNew) body.push(section('New to try', h('p', {}, page.tryNew)));
  if (page.quests.length) body.push(section('Side quests', ...page.quests.map((q) => h('p', {}, h('b', {}, q.name), ` · ${q.hint}`))));
  const replays = memories.map((m) => {
    const b = h('button', { class: 'btn small', type: 'button' }, `🎬 ${m.label}`);
    b.addEventListener('click', () => { view.uiTap(); view.closeTopSheet(); m.play(); });
    return b;
  });
  if (replays.length) body.push(section('Memories', h('div', { class: 'btn-row' }, ...replays)));
  view.sheet('📔 Keeper\'s journal', body);
}
