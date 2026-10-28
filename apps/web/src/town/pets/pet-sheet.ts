import { h } from '../../shared/ui/dom';
import { pixelImage } from '../../shared/ui/pixel-image';
import type { Content } from '../data/content';
import { cleanName, NAME_MAX } from '../play/names';
import type { View } from '../ui/view';
import { drawPet } from '../world/art/pets';
import type { PetDef } from './pets';

/**
 * Day 4: three little visitors at the door. Pick one, then name it (its usual name is filled in).
 * "Maybe later" leaves them waiting; they come by again.
 */
export function openPetChoice(view: View, content: Content, done: (kind: string, name: string) => void) {
  const pets = content.pack.pets ?? [];
  let close = () => {};
  const cards = pets.map((def) => {
    const b = h('button', { class: 'note pet-card', type: 'button' },
      pixelImage(drawPet(def.id, 0), 3), h('p', { class: 'friend-name' }, def.name), h('p', { class: 'muted' }, content.line(def.line) ?? ''));
    b.addEventListener('click', () => { view.uiTap(); close(); nameIt(view, def, done); });
    return b;
  });
  close = view.sheet('Who\'d like to live with you?', [h('div', { class: 'board' }, ...cards)], undefined, 'Maybe later');
}

function nameIt(view: View, def: PetDef, done: (kind: string, name: string) => void) {
  const input = h('input', { class: 'name-input', type: 'text', value: def.defaultName, maxlength: NAME_MAX, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'done' });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); view.closeTopSheet(); } });
  view.sheet(`Name your ${def.name.toLowerCase()}`, [pixelImage(drawPet(def.id, 0), 4), h('label', { class: 'name-field' }, h('span', { class: 'label' }, 'Their name'), input)],
    () => done(def.id, cleanName(input.value, def.defaultName)), 'Done');
}
