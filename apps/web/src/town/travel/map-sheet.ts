import { h } from '../../shared/ui/dom';
import type { AreaPack } from '../data/area';
import type { View } from '../ui/view';
import type { Meter } from '../play/tidy-meter';
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
  /** How tidy a place is: its tidy meter (play/tidy-meter.ts). */
  meter(area: string): Meter;
}

/** A place's tidy mark on the map: how far along, restored ✓, or spotless today ✨. */
export const mapMark = (m: Meter, spotlessToday: boolean) =>
  m.kind === 'none' ? '' : m.kind === 'progress' ? `${m.pct}%` : spotlessToday ? '✨' : '✓';

/** The town map (NEXT-PHASE §9): every place Puff has been, grouped, with how long the trip takes. */
export function openMap(host: MapHost, spotless: string[] = []) {
  const { view } = host;
  let close = () => {};
  const places = travelPlaces(host.areas(), host.visited, host.here());
  const body: Node[] = [];
  for (const group of [...new Set(places.map((p) => p.group))]) {
    body.push(h('h3', {}, group));
    body.push(h('div', { class: 'map-list' }, ...places.filter((p) => p.group === group).map((p) => {
      const mark = mapMark(host.meter(p.id), spotless.includes(p.id));
      const b = h('button', { class: `btn small${p.here ? ' here' : ''}`, type: 'button' }, host.named(p.name), h('small', {}, `${p.here ? 'You\'re here' : `${p.minutes} min`}${mark ? ` · ${mark}` : ''}`));
      if (p.here) b.setAttribute('disabled', '');
      b.addEventListener('click', () => { view.uiTap(); close(); host.go(p.id, p.minutes); });
      return b;
    })));
  }
  // The whole town's tally: how many places are restored, and spotless today.
  const tidy = places.filter((p) => { const m = host.meter(p.id); return m.kind === 'left' || m.kind === 'spotless'; }).length;
  const marked = places.filter((p) => host.meter(p.id).kind !== 'none').length;
  if (marked) body.unshift(h('p', { class: 'note' }, `🌸 ${tidy} of ${marked} places restored${spotless.length ? ` · ✨ ${spotless.length} spotless today` : ''}`));
  body.push(h('p', { class: 'muted' }, 'New places join the map once Puff has been there. ✓ restored · ✨ spotless today'));
  close = view.sheet('Town map', body);
}
