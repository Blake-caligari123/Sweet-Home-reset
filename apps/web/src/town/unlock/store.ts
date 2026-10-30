import pricing from '../../../../../config/pricing.json';
import type { Platform } from '../../shared/native';

// Where the one unlock is sold (BACKEND-PLAN §4, VISION §10). The web buys through our server's
// Stripe checkout; iOS and Android buy through their own store via RevenueCat, whose `full_game`
// entitlement is the one source of truth. With nothing set up there is no store, and no gate.

export type BuyResult = 'owned' | 'cancelled' | 'unavailable' | 'sign_in';

export interface Store {
  kind: 'none' | 'web' | 'native' | 'fake';
  /** The price to show: the store's own string on a phone (never a web price on iOS), ours on the web. */
  price(): Promise<string | null>;
  buy(): Promise<BuyResult>;
  /** Whether the unlock is already owned (Restore purchases, or back from checkout). */
  restore(): Promise<boolean>;
  /** Signed in: tell the phone store which account buys, so the purchase reaches every device. */
  identify?(userId: string): Promise<void>;
}

/** The RevenueCat entitlement that unlocks the full game. */
const ENTITLEMENT = 'full_game';

/** The web price from config/pricing.json, the only place prices live. */
export const webPrice = () => `A$${pricing.fullGame.toFixed(2)}`;

type Env = Partial<Record<'VITE_API_ORIGIN' | 'VITE_RC_IOS_KEY' | 'VITE_RC_ANDROID_KEY', string>>;

/** The store for this build: a phone key only counts on that phone, the server only on the web. */
export function pickStore(o: { platform: Platform; env: Env; fake?: boolean }): Store {
  if (o.fake) return fakeStore;
  if (o.platform === 'web') return o.env.VITE_API_ORIGIN ? webStore(o.env.VITE_API_ORIGIN) : noStore;
  const key = o.platform === 'ios' ? o.env.VITE_RC_IOS_KEY : o.env.VITE_RC_ANDROID_KEY;
  return key ? nativeStore(key) : noStore;
}

const noStore: Store = { kind: 'none', price: async () => null, buy: async () => 'unavailable', restore: async () => false };

/** A pretend store for browser playthroughs (`?debug&store=fake`): buying always works. */
const fakeStore: Store = { kind: 'fake', price: async () => webPrice(), buy: async () => 'owned', restore: async () => false };

function webStore(api: string): Store {
  const call = (path: string, init?: RequestInit) => fetch(`${api}${path}`, { credentials: 'include', ...init });
  return {
    kind: 'web',
    price: async () => webPrice(),
    async buy() {
      try {
        const res = await call('/api/billing/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"item":"full_game"}' });
        if (res.status === 401) return 'sign_in';
        if (!res.ok) return 'unavailable';
        const { url } = await res.json() as { url: string };
        location.assign(url); // Stripe's page; it comes back with ?unlocked=1
        return 'cancelled';
      } catch { return 'unavailable'; }
    },
    async restore() {
      try {
        const res = await call('/api/me');
        return res.ok && !!(await res.json() as { fullGame?: boolean }).fullGame;
      } catch { return false; }
    }
  };
}

function nativeStore(apiKey: string): Store {
  // Loaded only on a phone, so the web bundle never carries the plugin.
  let ready: Promise<typeof import('@revenuecat/purchases-capacitor').Purchases> | null = null;
  const sdk = () => (ready ??= import('@revenuecat/purchases-capacitor').then(async ({ Purchases }) => { await Purchases.configure({ apiKey }); return Purchases; }));
  const firstPackage = async () => (await (await sdk()).getOfferings()).current?.availablePackages[0] ?? null;
  return {
    kind: 'native',
    async price() { try { return (await firstPackage())?.product.priceString ?? null; } catch { return null; } },
    async buy() {
      try {
        const aPackage = await firstPackage();
        if (!aPackage) return 'unavailable';
        const { customerInfo } = await (await sdk()).purchasePackage({ aPackage });
        return customerInfo.entitlements.active[ENTITLEMENT] ? 'owned' : 'cancelled';
      } catch (e) { return (e as { userCancelled?: boolean }).userCancelled ? 'cancelled' : 'unavailable'; }
    },
    async restore() {
      try { return !!(await (await sdk()).restorePurchases()).customerInfo.entitlements.active[ENTITLEMENT]; } catch { return false; }
    },
    async identify(userId) { try { await (await sdk()).logIn({ appUserID: userId }); } catch { /* the store remembers on the next try */ } }
  };
}
