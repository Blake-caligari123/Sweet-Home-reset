import { h } from '../../shared/ui/dom';
import type { AreaPack } from '../data/area';
import type { View } from '../ui/view';
import { travelPlaces } from './map';

export interface MapHost {
  view: View;
  /** Every place as it stands now (built repairs included), and the ones Puff has been. */
  areas(): AreaPack[];
  visited: string[];
  here(): string;
  /** Text with name tokens filled in ({puff}'s burrow). */
  named(text: string): string;
  /** Go there; the trip takes this many game minutes. */
  go(area: string, minutes: number): void;
}

/** The town map (NEXT-PHASE §9): every place Puff has been, grouped, with how long the trip takes. */
export function openMap(host: MapHost) {
  const { view } = host;
  let close = () => {};
  const places = travelPlaces(host.areas(), host.visited, host.here());
  const body: Node[] = [];
  for (const group of [...new Set(places.map((p) => p.group))]) {
    body.push(h('h3', {}, group));
    body.push(h('div', { class: 'map-list' }, ...places.filter((p) => p.group === group).map((p) => {
      const b = h('button', { class: `btn small${p.here ? ' here' : ''}`, type: 'button' }, host.named(p.name), h('small', {}, p.here ? 'You\'re here' : `${p.minutes} min`));
      if (p.here) b.setAttribute('disabled', '');
      b.addEventListener('click', () => { view.uiTap(); close(); host.go(p.id, p.minutes); });
      return b;
    })));
  }
  body.push(h('p', { class: 'muted' }, 'New places join the map once Puff has been there.'));
  close = view.sheet('Town map', body);
}
