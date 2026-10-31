import { clear, h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';
import { putOut, stallPrice, STALL_SLOTS, takeBack } from './stall';

/** The stall: what's out (tap to take back), and what in the bag could go out (tap to put one out). */
export function openStall(d: { state: TownState; view: View; content: Content; changed(): void }) {
  const { state, view, content } = d;
  const sellOf = (id: string) => content.pack.items[id]?.sell ?? 0;
  const body = h('div', { class: 'list' });
  const render = () => {
    clear(body);
    const out = state.stall.slots.map((s) => {
      const b = h('button', { class: 'btn small', type: 'button' }, itemIcon(s.id), ` ${s.count} · ${stallPrice(sellOf(s.id))} ✨ each`);
      b.addEventListener('click', () => { if (state.bag.canAdd(s.id) && takeBack(state.stall, s.id)) { state.bag.add(s.id); d.changed(); render(); } else view.say('Bag\'s full!'); });
      return b;
    });
    const can = state.bag.slots.filter((s): s is NonNullable<typeof s> => !!s && sellOf(s.id) > 0);
    const add = can.map((s) => {
      const b = h('button', { class: 'btn small primary', type: 'button' }, itemIcon(s.id), ` Put out (${s.count})`);
      b.addEventListener('click', () => { if (putOut(state.stall, s.id)) { state.bag.remove(s.id); view.uiTap(); d.changed(); render(); } else view.say(`The stall holds ${STALL_SLOTS} kinds of thing.`); });
      return b;
    });
    body.append(
      h('p', { class: 'friend-name' }, 'On the stall'),
      out.length ? h('div', { class: 'btn-row' }, ...out) : h('p', { class: 'muted' }, 'Nothing out yet.'),
      h('p', { class: 'friend-name' }, 'From your bag'),
      add.length ? h('div', { class: 'btn-row' }, ...add) : h('p', { class: 'muted' }, 'Crops and dishes can go on the stall.'));
  };
  render();
  view.sheet('Your market stall', [h('p', { class: 'muted' }, 'Townsfolk come by overnight and pay a little more than the shops. More come as the town blooms.'), body]);
}
