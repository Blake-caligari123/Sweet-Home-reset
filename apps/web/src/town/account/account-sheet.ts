import { h } from '../../shared/ui/dom';
import { migrate, type TownSave } from '../data/save';
import type { TownState } from '../state';
import type { View } from '../ui/view';
import type { Api, CloudSave, Me } from './api';
import { saveLine, syncStep } from './sync-rules';

export interface AccountHost {
  state: TownState; view: View;
  /** This device's save as it stands now. */
  snapshot(): TownSave;
  save(): Promise<void>;
  /** Replace this device's save with another (the cloud copy) and start again from it. */
  adopt(save: TownSave): Promise<void>;
  /** Signed in: the account owns the full game, and (on phones) the store should know who this is. */
  signedIn(me: Me): void;
}

/**
 * The optional account (BACKEND-PLAN steps 2, 4, 7 and 14): sign in by email (16+), sync after
 * bedtime, export, delete. The game plays fully without it. Sync never merges: when the cloud
 * moved on elsewhere, the player picks which save to keep and the other stays in history.
 */
export class Account {
  private me: Me | null = null;

  constructor(private host: AccountHost, private api: Api) {}

  /** On start: use a sign-in link (`?signin=`), then check who's signed in and sync once. */
  async start(params: URLSearchParams) {
    const link = params.get('signin');
    if (link) {
      history.replaceState(null, '', location.pathname + location.search.replace(/[?&]signin=\w+/, '').replace(/^&/, '?'));
      if (!(await this.api.verify(link))) this.host.view.showDialogue('That sign-in link has been used or has expired. Ask for a new one in Pause → Account.');
    }
    this.me = await this.api.me();
    if (!this.me) return;
    this.host.signedIn(this.me);
    if (link) this.host.view.banner('Signed in! Your town can follow you now.');
    await this.sync();
  }

  /** After bedtime (and Sync now): send this device's save, or ask which to keep. */
  async sync(manual = false) {
    if (!this.me) return;
    const cloud = await this.api.cloud();
    if (cloud === 'error') { if (manual) this.host.view.showDialogue('Sync isn\'t reachable right now. Your save is safe on this device.'); return; }
    if (syncStep(this.host.state.cloudVersion, cloud) === 'ask' && cloud) { this.askWhich(cloud); return; }
    await this.send(cloud?.version ?? 0, manual);
  }

  private async send(baseVersion: number, manual: boolean) {
    const local = this.host.snapshot();
    const put = await this.api.put(baseVersion, JSON.stringify(local), local.deviceId, local.savedAt, local.schemaVersion);
    if (put === 'error') { if (manual) this.host.view.showDialogue('Sync isn\'t reachable right now. Your save is safe on this device.'); return; }
    if ('conflict' in put) { if (put.conflict) this.askWhich(put.conflict); return; }
    this.host.state.cloudVersion = put.version;
    await this.host.save();
    if (manual) this.host.view.say('Synced!');
  }

  private askWhich(cloud: CloudSave) {
    const { view } = this.host;
    const theirs = migrate(JSON.parse(cloud.blob));
    if (!theirs) { view.showDialogue('The cloud save is from a newer version of the game. Update the app to use it.'); return; }
    const mine = this.host.snapshot();
    view.ask(`Two saves! This device: ${saveLine(mine)}. Cloud: ${saveLine(theirs)}. Which should ${mine.names.puff} keep? The other stays safe in history for 30 days.`, [
      { label: 'This device', primary: true, onClick: () => void this.send(cloud.version, true) },
      { label: 'Cloud save', onClick: () => void this.host.adopt({ ...theirs, cloudVersion: cloud.version }) }
    ]);
  }

  /** Pause → Account. */
  open() {
    if (this.me) this.signedInSheet(this.me); else this.signInSheet();
  }

  private signInSheet() {
    const { view } = this.host;
    const email = h('input', { class: 'name-input', type: 'email', autocomplete: 'email', 'aria-label': 'Email', placeholder: 'you@example.com' }) as HTMLInputElement;
    const age = h('input', { type: 'checkbox', id: 'age16' }) as HTMLInputElement;
    const note = h('p', { class: 'muted', role: 'status' }, '');
    const send = h('button', { class: 'btn primary', type: 'button' }, 'Email me a sign-in link');
    send.addEventListener('click', async () => {
      const r = await this.api.start(email.value.trim(), age.checked);
      note.textContent = r === 'sent' ? 'Sent! Open the link on this device to sign in.'
        : r === 'age_required' ? 'A new account needs the 16+ box ticked.'
          : r === 'bad_email' ? 'That email doesn\'t look quite right.' : 'Sign-in isn\'t available right now. The game plays fully without it.';
    });
    view.sheet('Account', [
      h('p', {}, 'An account is optional. It lets your town follow you to another device.'),
      email, h('label', { class: 'row', for: 'age16' }, age, h('span', { class: 'label' }, 'I\'m 16 or older')), send, note
    ]);
  }

  private signedInSheet(me: Me) {
    const { view } = this.host;
    const button = (label: string, run: () => void) => { const b = h('button', { class: 'btn small', type: 'button' }, label); b.addEventListener('click', run); return b; };
    let close = () => {};
    close = view.sheet('Account', [
      h('p', {}, `Signed in as ${me.email ?? 'your Apple ID'}.`),
      h('div', { class: 'btn-row' },
        button('Sync now', () => { close(); void this.sync(true); }),
        button('Export my data', () => void this.download()),
        button('Sign out', async () => { close(); await this.api.signOut(); this.me = null; view.say('Signed out. Your save stays on this device.'); })),
      button('Delete account', () => { close(); this.confirmDelete(); })
    ]);
  }

  private async download() {
    const file = await this.api.exportData();
    if (!file) { this.host.view.showDialogue('Export isn\'t reachable right now. Try again soon.'); return; }
    const a = h('a', { href: URL.createObjectURL(file), download: 'sweet-home-reset-data.json' }) as HTMLAnchorElement;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /** Two confirms, then whether to clear this device's save too (BACKEND-PLAN step 14). */
  private confirmDelete() {
    const { view } = this.host;
    view.confirm('Delete your account? Your cloud save and history go now, and the account within 30 days.', 'Delete', () => {
      view.confirm('Are you sure? This can\'t be undone.', 'Yes, delete it', async () => {
        const storeNote = await this.api.deleteAccount();
        if (storeNote === null) { view.showDialogue('Deleting isn\'t reachable right now. Try again soon.'); return; }
        this.me = null;
        this.host.state.cloudVersion = undefined;
        await this.host.save();
        view.showDialogue(`Your account is deleted. ${storeNote} The save on this device is still here; Start over in Pause clears it.`);
      });
    });
  }
}
