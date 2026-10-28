import { h } from '../../shared/ui/dom';
import { pixelImage } from '../../shared/ui/pixel-image';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { drawOutfit } from '../world/art/outfits';
import { earned } from './outfits';

/** Pick what Puff wears: earned outfits can be put on (or taken off); the rest say how to earn them. */
export function openOutfits(view: View, content: Content, state: TownState, changed: () => void) {
  let close = () => {};
  const cards = (content.pack.outfits ?? []).map((o) => {
    const have = earned(state, o);
    const on = state.outfit === o.id;
    const b = h('button', { class: `note pet-card${on ? ' worn' : ''}`, type: 'button', 'aria-pressed': String(on) },
      pixelImage(drawOutfit(o.id), 4), h('p', { class: 'friend-name' }, have ? o.name : '???'), h('p', { class: 'muted' }, have ? (on ? 'Wearing' : 'Tap to wear') : o.hint));
    if (!have) b.setAttribute('disabled', '');
    b.addEventListener('click', () => { view.uiTap(); state.outfit = on ? null : o.id; close(); changed(); });
    return b;
  });
  close = view.sheet('Outfits', [h('div', { class: 'outfit-grid' }, ...cards)]);
}
