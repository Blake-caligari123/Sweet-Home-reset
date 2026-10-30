import type { NativeBridge } from '../shared/native';
import { Account } from './account/account-sheet';
import { Api } from './account/api';
import { Counts } from './account/counts';
import { writeTown, type TownSave } from './data/save';
import type { TownState } from './state';
import type { Settings, View } from './ui/view';
import { pickStore } from './unlock/store';
import { Unlocker } from './unlock/unlock-card';

/**
 * The parts that talk to the outside, built from what this build is set up for: the store that
 * sells the unlock (none on the test link; `?debug&store=fake` pretends) and the optional account
 * and anonymous play counts (only with VITE_API_ORIGIN). Coming back from checkout or a sign-in link is handled here too.
 */
export function connect(o: { state: TownState; view: View; settings: Settings; native: NativeBridge; snapshot(): TownSave; save(): Promise<void> }) {
  const params = new URLSearchParams(location.search);
  const store = pickStore({ platform: o.native.platform, env: import.meta.env, fake: params.has('debug') && params.get('store') === 'fake' });
  const origin = import.meta.env.VITE_API_ORIGIN;
  let account: Account | null = null;
  const counts = origin ? new Counts(origin, () => o.settings.shareCounts !== false) : null;
  const unlocker = new Unlocker({ state: o.state, view: o.view, via: o.native.platform, save: () => void o.save(), signIn: () => account?.open(), count: (name) => counts?.add(name) }, store);
  if (origin) {
    account = new Account({
      state: o.state, view: o.view, snapshot: o.snapshot, save: o.save, signedIn: (me) => unlocker.fromAccount(me),
      adopt: async (save) => { await writeTown(save, true); location.reload(); }
    }, new Api(origin, o.native.isNative));
  }
  if (params.has('unlocked')) void unlocker.checkReturn();
  void account?.start(params);
  return { unlocker, account, counts };
}
