import { describe, expect, it } from 'vitest';
import { isNeverCached, pwaManifest, workboxOptions } from './pwa-config';

describe('PWA caching rules', () => {
  it.each(['/api/save', '/api/save/kitchen', '/api/me', '/api/auth/magic-link', '/api/billing/webhook'])(
    'never caches %s',
    (path) => { expect(isNeverCached(new URL(path, 'https://example.test'))).toBe(true); }
  );

  it('may cache pack files', () => {
    expect(isNeverCached(new URL('/packs-bundled/starter-home/1/pack.json', 'https://example.test'))).toBe(false);
  });

  it('never answers an API navigation with the app shell', () => {
    expect(workboxOptions.navigateFallbackDenylist?.some((rule) => rule.test('/api/me'))).toBe(true);
  });

  it('has no runtime cache rule that could match a private API route', () => {
    const urls = ['/api/save', '/api/me', '/api/auth/x', '/api/billing'].map((p) => new URL(p, 'https://example.test'));
    for (const rule of workboxOptions.runtimeCaching ?? []) {
      const match = rule.urlPattern as (o: { url: URL }) => boolean;
      expect(typeof match).toBe('function');
      for (const url of urls) expect(match({ url })).toBe(false);
    }
  });

  it('precaches the bundled starter pack, sprites and painted areas so the town plays offline', () => {
    expect(workboxOptions.globPatterns).toContain('**/*.{js,css,html,png,webp,svg,json,webmanifest}');
  });

  it('ships installable icons', () => {
    const sizes = pwaManifest.icons?.map((icon) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(pwaManifest.display).toBe('standalone');
  });
});
