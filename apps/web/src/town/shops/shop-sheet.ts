import { clear, h } from '../../shared/ui/dom';
import type { Content } from '../data/content';
import { formatTime, type Clock } from '../play/clock';
import type { TownState } from '../state';
import { itemIcon } from '../ui/hud';
import type { View } from '../ui/view';
import { buy, isOpen, sell, sellPrice, stockToday, type ShopDef, type ShopResult, type StockEntry } from './shops';

export interface ShopHost { state: TownState; view: View; content: Content; clock: Clock; refreshHud(): void; save(): void }

const SORRY: Record<Exclude<ShopResult, { ok: true }>['reason'], string> = {
  closed: 'The shop\'s closed now. Another time!',
  sparkles: 'Not quite enough Sparkles yet. Tidying earns more!',
  bag: 'Bag\'s full! Put things away first.',
  gone: 'That\'s all gone for now.'
};

/** A shop: what's on the shelf today at fixed prices, and anything it buys back. */
export function openShop(host: ShopHost, shop: ShopDef) {
  const { state, view, content, clock } = host;
  const name = (e: StockEntry) => content.line(`stock.${e.item}`) ?? `${content.itemName(e.item)}${(e.qty ?? 1) > 1 ? ` ×${e.qty}` : ''}`;
  const ctx = () => ({ state, minutes: clock.state.minutes, day: clock.state.day, items: content.pack.items });
  const wallet = h('p', { class: 'muted' });
  const list = h('div', { class: 'shop' });
  const render = () => {
    clear(list);
    const day = clock.state.day; const minutes = clock.state.minutes;
    wallet.textContent = `You have ${state.sparkles} ✨`;
    if (!isOpen(shop, minutes, day)) {
      const when = day < (shop.openFromDay ?? 1) ? `Opens on day ${shop.openFromDay}.` : `Open ${formatTime(shop.opens)} to ${formatTime(shop.closes)}.`;
      list.append(h('p', {}, `Closed right now. ${when}`));
      return;
    }
    list.append(h('p', { class: 'muted' }, `Open until ${formatTime(shop.closes)}.`));
    for (const e of stockToday(shop, day, state.flags)) {
      const btn = h('button', { class: 'btn small primary', type: 'button', 'aria-label': `Buy ${name(e)} for ${e.price} Sparkles` }, `${e.price} ✨`);
      if (state.sparkles < e.price) btn.classList.remove('primary');
      btn.addEventListener('click', () => {
        view.uiTap();
        const r = buy(shop, e, ctx());
        if (!r.ok) { view.say(SORRY[r.reason]); return; }
        view.feedback('coin', 'light');
        if (e.kind === 'bag') view.banner(`A bigger bag! +${e.slots} slots`);
        if (e.kind === 'animal') view.banner(`${name(e)} moves into the yard tomorrow!`);
        if (e.kind === 'recipe') { view.banner(`New recipe: ${name(e)}`); view.say('Pip can help me make it at the workbench!'); }
        render(); host.refreshHud(); host.save();
      });
      list.append(h('div', { class: 'shop-row' }, itemIcon(e.kind === 'bag' ? 'bag' : e.item), h('span', { class: 'shop-name' }, name(e)), btn));
    }
    const selling = (shop.buys ?? []).filter((id) => state.bag.count(id) > 0);
    if (selling.length) list.append(h('p', { class: 'friend-name' }, 'We buy'));
    for (const id of selling) {
      const btn = h('button', { class: 'btn small', type: 'button', 'aria-label': `Sell a ${content.itemName(id).toLowerCase()} for ${sellPrice(id, ctx())} Sparkles` }, `Sell +${sellPrice(id, ctx())} ✨`);
      btn.addEventListener('click', () => {
        view.uiTap();
        const r = sell(shop, id, ctx());
        if (!r.ok) { view.say(SORRY[r.reason]); return; }
        view.feedback('coin', 'light');
        render(); host.refreshHud(); host.save();
      });
      list.append(h('div', { class: 'shop-row' }, itemIcon(id), h('span', { class: 'shop-name' }, `${content.itemName(id)} ×${state.bag.count(id)}`), btn));
    }
  };
  render();
  view.sheet(shop.name, [wallet, list]);
}
