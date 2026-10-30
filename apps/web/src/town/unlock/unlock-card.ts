import { h } from '../../shared/ui/dom';
import type { Unlock } from '../data/save';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import { parentAnswerOk, parentQuestion } from './parental-gate';
import type { Store } from './store';

export interface UnlockHost {
  state: TownState; view: View;
  /** Which store the purchase went through, for the save. */
  via: Unlock['via'];
  save(): void;
  /** Sign in first (a web purchase belongs to an account). */
  signIn?(): void;
  /** An anonymous play count (GDD A10: how often the unlock is offered and bought). */
  count?(name: 'unlock_offered' | 'unlock_bought'): void;
}

/**
 * The unlock in play (STORY "Plus offer", now the one unlock): a postcard after the free spring,
 * never a wall. "Not now" is an equal button, and Puff's answer is the same either way.
 */
export class Unlocker {
  constructor(private host: UnlockHost, private store: Store) {}

  /** Whether this build sells the unlock at all; without a store nothing is gated. */
  get gate() { return this.store.kind !== 'none'; }

  async offer() {
    const { view } = this.host;
    const price = await this.store.price();
    this.host.count?.('unlock_offered');
    let close = () => {};
    const buy = h('button', { class: 'btn primary', type: 'button' }, price ? `Unlock the full game · ${price}` : 'Unlock the full game');
    buy.addEventListener('click', () => { view.uiTap(); close(); this.askGrownUp(); });
    close = view.sheet('A postcard', [
      h('p', {}, 'Spring was lovely! Summer, autumn and winter are waiting: new places, festivals and every friend\'s story.'),
      h('p', {}, 'One unlock, yours to keep, with every future chapter included.'),
      h('p', { class: 'muted' }, 'Spring carries on either way. Nothing is ever lost.'),
      buy
    ], () => view.say('Best spring ever.'), 'Not now');
  }

  /** Restore purchases (Pause): finds an unlock bought before, on this or another device. */
  async restore() {
    const { view } = this.host;
    if (await this.store.restore()) this.owned(); else view.showDialogue('No unlock found for this account yet.');
  }

  /** Signed in: an unlock bought on another platform counts here too, and a phone store learns who this is. */
  fromAccount(me: { id: string; fullGame: boolean }) {
    void this.store.identify?.(me.id);
    if (me.fullGame && !this.host.state.unlock.owned) this.owned();
  }

  /** Back from the web checkout (`?unlocked=1`): check with the server and say thank you. */
  async checkReturn() { if (!this.host.state.unlock.owned && await this.store.restore()) this.owned(); }

  /** The parental gate (VISION §10), then the store's own purchase screen. */
  private askGrownUp() {
    const { view } = this.host;
    const q = parentQuestion(Math.random);
    const input = h('input', { class: 'name-input', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Answer' }) as HTMLInputElement;
    const note = h('p', { class: 'muted', role: 'status' }, '');
    const go = h('button', { class: 'btn primary', type: 'button' }, 'Go on');
    let close = () => {};
    go.addEventListener('click', () => {
      if (!parentAnswerOk(input.value, q.answer)) { note.textContent = 'Not quite. A grown-up can help with this one.'; return; }
      close();
      void this.buy();
    });
    close = view.sheet('For grown-ups', [h('p', {}, q.text), input, note, go], undefined, 'Not now');
    window.setTimeout(() => input.focus(), 30);
  }

  private async buy() {
    const { view } = this.host;
    const result = await this.store.buy();
    if (result === 'owned') this.owned();
    else if (result === 'sign_in' && this.host.signIn) this.host.signIn();
    else if (result === 'sign_in') view.showDialogue('Sign in first, so the unlock stays with you on every device.');
    else if (result === 'unavailable') view.showDialogue('The unlock isn\'t available right now. Spring carries on!');
    else view.say('Best spring ever.');
  }

  private owned() {
    const { state, view } = this.host;
    state.unlock = { owned: true, via: this.host.via, at: new Date().toISOString() };
    this.host.count?.('unlock_bought');
    view.feedback('fanfare', 'success');
    view.banner('🌸 The full year is yours! Summer is on its way.');
    this.host.save();
  }
}
