import { h } from '../../shared/ui/dom';
import pkg from '../../../package.json';
import type { View } from './view';

/**
 * Pause → About: the version, who made it and the privacy policy.
 */
export function aboutLines(version: string) {
  return [
    `Sweet Home Reset, version ${version}. Made by PixelVortex Games.`,
    'Music and sounds are made by the game itself.',
    'No ads and no tracking. Your town is saved on this device; an account is optional.'
  ];
}

export function openAbout(view: View) {
  const privacy = h('a', { href: `${import.meta.env.BASE_URL}privacy.html`, target: '_blank', rel: 'noopener' }, 'Privacy policy');
  view.sheet('About', [...aboutLines(pkg.version).map((line) => h('p', {}, line)), h('p', {}, privacy)]);
}
