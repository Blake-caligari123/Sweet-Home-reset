# Sweet Home Reset

Scrub a little room back to sparkling with Puff the dust bunny, then take one gentle real-world reset step. The game is calm, local-first, and never punishes a player for taking time away.

## Stack

- Web/PWA: Vite, TypeScript, PixiJS
- Mobile: Capacitor wrapping the same web build
- API: Cloudflare Workers, Hono, D1
- Tests: Vitest (Playwright is added with the first browser-flow milestone)

## Repository layout

```
apps/web/          PixiJS game shell and bundled starter pack
apps/api/          Cloudflare Worker API and D1 migrations
packages/shared/   Save types and shared domain constants
config/            Product configuration; prices have one source of truth
docs/              Architecture and delivery notes
```

## Quick start

Requires Node 22+ and npm 10+.

```sh
npm install
npm run dev:web
```

In another terminal, start the API when needed:

```sh
npm run dev:api
```

Run the checks with `npm run typecheck`, `npm test`, and `npm run build`.

## Mobile apps (iOS and Android)

Capacitor wraps the same game for iOS and Android (app id `com.pixelvortexgames.sweethomereset`). The `ios/` and `android/` projects are generated and gitignored, so create them once per checkout from `apps/web`:

```sh
npx cap add android   # needs Android Studio / the Android SDK and JDK 21
npx cap add ios       # needs a Mac with Xcode
npm run cap:android   # builds with --mode native, syncs, opens Android Studio
npm run cap:ios       # same for Xcode
```

`npm run build:native` makes the bundle served from the app root; the plain `npm run build` stays the GitHub Pages PWA. On a phone, stage milestones give a light haptic and a finished room a success buzz, Android back opens the pause screen (back again sends the app to the background), and leaving the app pauses it. Escape does the same on the web.

The **Mobile builds** workflow tests and builds an unsigned debug APK on every change and uploads it as a run artifact you can sideload. Run it by hand with "iOS" ticked to also compile for the iOS Simulator. Signing, TestFlight and Play uploads wait for the developer accounts. Universal/App Links wait for the real app domain, and the icons in `apps/web/public/icons/` are placeholders until the brand art lands.

## Boundaries

- Never commit secrets. Copy the example environment files locally and use Cloudflare Worker secrets for deployed values.
- The game is playable offline and signed out; the API provides optional sync, account, entitlement, and reward services.
- No ads, loot boxes, paid timers, or paid currency. Prices belong only in `config/pricing.json`.
- Store accounts, payment providers, publishing, and real purchases require Blake's explicit approval.

## Status

The first playable room is underway. The kitchen nook has a drag-to-scrub interaction, a clean meter with stage markers, Puff's reactions, keyboard brushing, and an offline save. It currently uses temporary code-drawn room art and one starter room.

Focus the game canvas and use arrow keys or WASD to move the brush, then press Space or Enter to scrub. Pointer, mouse, and touch drags also clean the counter. Progress saves in the browser and is restored when the page is reopened.

Next milestones: polish the task loop and feedback, add the remaining starter rooms as pack data, then build the health/migration baseline for the API.
