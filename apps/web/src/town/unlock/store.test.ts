import { describe, expect, it } from 'vitest';
import { pickStore, webPrice } from './store';

describe('which store sells the unlock', () => {
  it('is none when nothing is set up, so the test link plays the whole year', () => {
    expect(pickStore({ platform: 'web', env: {} }).kind).toBe('none');
    expect(pickStore({ platform: 'ios', env: {} }).kind).toBe('none');
  });

  it('is the server on the web, and the phone store on iOS and Android', () => {
    expect(pickStore({ platform: 'web', env: { VITE_API_ORIGIN: 'https://api.example' } }).kind).toBe('web');
    expect(pickStore({ platform: 'ios', env: { VITE_RC_IOS_KEY: 'appl_x' } }).kind).toBe('native');
    expect(pickStore({ platform: 'android', env: { VITE_RC_ANDROID_KEY: 'goog_x' } }).kind).toBe('native');
    // A web key never turns on a phone store, and a phone key never the web.
    expect(pickStore({ platform: 'ios', env: { VITE_API_ORIGIN: 'https://api.example' } }).kind).toBe('none');
    expect(pickStore({ platform: 'web', env: { VITE_RC_IOS_KEY: 'appl_x' } }).kind).toBe('none');
  });

  it('shows the web price from config/pricing.json', () => {
    expect(webPrice()).toMatch(/^A\$\d+\.\d\d$/);
  });

  it('has a pretend store for browser playthroughs, only when asked for', async () => {
    const fake = pickStore({ platform: 'web', env: {}, fake: true });
    expect(fake.kind).toBe('fake');
    expect(await fake.buy()).toBe('owned');
  });
});
