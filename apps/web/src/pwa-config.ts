import type { ManifestOptions, VitePWAOptions } from 'vite-plugin-pwa';

type WorkboxOptions = NonNullable<VitePWAOptions['workbox']>;

/** The API (saves, account, sign-in, billing) always goes to the network; nothing under /api/ is cached. */
export function isNeverCached(url: URL): boolean {
  return url.pathname.includes('/api/');
}

export const pwaManifest: Partial<ManifestOptions> = {
  name: 'Sweet Home Reset',
  short_name: 'Sweet Home',
  description: 'Scrub a little room back to sparkling with Puff the dust bunny.',
  lang: 'en-AU',
  display: 'standalone',
  orientation: 'portrait',
  start_url: '.',
  scope: '.',
  background_color: '#f8e8be',
  theme_color: '#f8e8be',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};

export const workboxOptions: WorkboxOptions = {
  globPatterns: ['**/*.{js,css,html,png,svg,json,webmanifest}'],
  navigateFallbackDenylist: [/\/api\//],
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      // Downloaded packs: show the cached copy at once and refresh it in the background.
      urlPattern: ({ url }) => !isNeverCached(url) && url.pathname.includes('/packs/'),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'shr-packs', expiration: { maxEntries: 60 } }
    }
  ]
};
