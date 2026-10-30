import type { ManifestOptions, VitePWAOptions } from 'vite-plugin-pwa';

type WorkboxOptions = NonNullable<VitePWAOptions['workbox']>;

/** The API (saves, account, sign-in, billing) always goes to the network; nothing under /api/ is cached. */
export function isNeverCached(url: URL): boolean {
  return url.pathname.includes('/api/');
}

export const pwaManifest: Partial<ManifestOptions> = {
  name: 'Sweet Home Reset',
  short_name: 'Sweet Home',
  description: 'Tidy a grey little town back to colour, make friends and grow a cosy home.',
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
  globPatterns: ['**/*.{js,css,html,png,webp,svg,json,webmanifest}'],
  navigateFallbackDenylist: [/\/api\//],
  // Pages read their ?options in the browser, so any query still opens the cached page it names
  // (by default only utm_ and fbclid are ignored, and /test/?debug fell back to the room game).
  ignoreURLParametersMatching: [/.*/],
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
