import { h } from '../../shared/ui/dom';
import type { SoundId } from '../../shared/audio/sound';
import { againButton, starLine, type GameHost } from './games';
import { BELLS, echo, echoStars, FIRST, LAST, tune } from './echo';

/** Each bell's colour and sound. */
const BELL: { colour: string; sound: SoundId; name: string }[] = [
  { colour: '#f4c2a8', sound: 'chime', name: 'peach' }, { colour: '#f6e3a1', sound: 'sparkle', name: 'gold' },
  { colour: '#a9cda0', sound: 'pop', name: 'green' }, { colour: '#a9bfd6', sound: 'boing', name: 'blue' }
];

/** Juniper's tune: listen, then play it back on the bells. One note longer each time, three to six. */
export function openEcho(d: GameHost, round = 0) {
  const { view } = d;
  const notes = tune(d.day(), round);
  let length = FIRST; let played: number[] = []; let slips = 0; let listening = true; let timer = 0;
  const status = h('p', { class: 'friend-name', 'aria-live': 'polite' }, 'Listen...');
  const bells = Array.from({ length: BELLS }, (_, i) => {
    const b = h('button', { class: 'bell', type: 'button', 'aria-label': `${BELL[i].name} bell`, style: { backgroundColor: BELL[i].colour } });
    b.addEventListener('click', () => ring(i));
    return b;
  });
  const flash = (i: number) => { bells[i].classList.remove('lit'); void bells[i].offsetWidth; bells[i].classList.add('lit'); view.feedback(BELL[i].sound, null); };
  const play = () => {
    listening = true; played = []; status.textContent = 'Listen...';
    notes.slice(0, length).forEach((n, k) => { timer = window.setTimeout(() => flash(n), 500 + k * 520); });
    timer = window.setTimeout(() => { listening = false; status.textContent = `Your turn! ${length} notes.`; }, 500 + length * 520);
  };
  const ring = (i: number) => {
    if (listening) return;
    flash(i);
    played = [...played, i];
    const r = echo(notes, played, length);
    if (r === 'more') return;
    if (r === 'slip') { slips += 1; status.textContent = 'Nearly! Let\'s hear it again.'; listening = true; timer = window.setTimeout(play, 900); return; }
    if (length < LAST) { length += 1; status.textContent = 'Lovely! A little longer now...'; listening = true; timer = window.setTimeout(play, 900); return; }
    const stars = echoStars(slips);
    listening = true;
    view.feedback('fanfare', 'success');
    status.textContent = `${starLine(stars)}  ${d.finished(stars)}`;
    status.after(againButton(view, 'Another tune', () => openEcho(d, round + 1)));
  };
  view.sheet('🎵 Echo the tune', [h('p', { class: 'muted' }, 'Listen to the bells, then play the tune back.'), h('div', { class: 'bells' }, ...bells), status], () => window.clearTimeout(timer));
  play();
}
