import { h } from '../../shared/ui/dom';
import type { View } from '../ui/view';
import type { Scene } from './scene';
import { TOUR, type TourCard } from './tour';

/** Pause → Feature tour: every new feature with a Try it button, then what to do there. */
export function openTour(view: View, scene: Scene, done: () => void) {
  let close = () => {};
  const rows = TOUR.map((card) => {
    const go = h('button', { class: 'btn small primary', type: 'button' }, 'Try it');
    go.addEventListener('click', () => { view.uiTap(); close(); card.setup(scene); done(); howTo(view, card); });
    return h('div', { class: 'note', style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' } }, h('p', { class: 'friend-name' }, card.title), go);
  });
  close = view.sheet('Feature tour', [
    h('p', { class: 'muted' }, 'Each one jumps to the right day and place and sets things up. It changes this save, so use Pause → Start over for a normal game.'),
    h('div', { class: 'board' }, ...rows)
  ]);
}

function howTo(view: View, card: TourCard) {
  view.sheet(card.title, [h('div', { class: 'list' }, ...card.steps.map((s, i) => h('p', {}, `${i + 1}. ${s}`)))]);
}
