import { h } from '../../shared/ui/dom';
import { cleanName, DEFAULT_NAMES, NAME_MAX, type Names } from '../play/names';
import type { View } from './view';

/**
 * Name Puff and the town: at the start of a new game, and any time from the pause menu.
 * However the sheet closes (Done, Escape, Android back), what's typed is kept, tidied up.
 */
export function openNaming(view: View, names: Names, done: (names: Names) => void) {
  const field = (label: string, value: string) => {
    const input = h('input', { class: 'name-input', type: 'text', value, maxlength: NAME_MAX, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'done' });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); view.closeTopSheet(); } });
    return { input, row: h('label', { class: 'name-field' }, h('span', { class: 'label' }, label), input) };
  };
  const puff = field('Your dust bunny', names.puff);
  const town = field('Your town', names.town);
  view.sheet('Names', [h('p', { class: 'muted' }, 'Call them anything you like. You can change these later in the pause menu.'), puff.row, town.row],
    () => done({ puff: cleanName(puff.input.value, DEFAULT_NAMES.puff), town: cleanName(town.input.value, DEFAULT_NAMES.town) }), 'Done');
}
