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

`npm run build:native` makes the bundle served from the app root; the plain `npm run build` stays the GitHub Pages PWA. On a phone, strokes, pops and stage milestones give haptic taps and a finished room a success buzz. Android back pauses a room (and closes the pause screen), returns home from menus, and backgrounds the app from home; leaving the app pauses it. Escape does the same on the web.

The **Mobile builds** workflow tests and builds an unsigned debug APK on every change and uploads it as a run artifact you can sideload. Run it by hand with "iOS" ticked to also compile for the iOS Simulator. Signing, TestFlight and Play uploads wait for the developer accounts. Universal/App Links wait for the real app domain, and the icons in `apps/web/public/icons/` are placeholders until the brand art lands.

## Boundaries

- Never commit secrets. Copy the example environment files locally and use Cloudflare Worker secrets for deployed values.
- The game is playable offline and signed out; the API provides optional sync, account, entitlement, and reward services.
- No ads, loot boxes, paid timers, or paid currency. Prices belong only in `config/pricing.json`.
- Store accounts, payment providers, publishing, and real purchases require Blake's explicit approval.

## Status

The game loop is playable on web, iOS and Android builds, fully offline and signed out:

- **Three starter rooms** (Kitchen Nook, Living Room, Bedroom) as pack data in `apps/web/public/packs-bundled/starter-home/2/pack.json`. The next room opens after the one before it, or early through real chores.
- **Cleaning brings the colour back:** a messy room starts drained and dull, with stains, cobwebs and dust. Scrubbing reveals the bright room underneath, and the whole room brightens a step at each stage.
- **Five mini-tasks per room, each with its own tool** (picked automatically for whatever you touch): sponge for grime (stains need a few passes), squeegee for foggy glass, duster for dusty shelves, vacuum for crumbs, plus popping shy dust bunnies and dragging clutter to the right bin (wrong bins bounce back, no penalty). Help Puff finishes a task after 20 s without progress, Puff points at the next spot after 6 s, and Puff naps if left alone.
- **Juice:** foam trails, combos (×5, ×10… with a small capped Sparkle bonus), stage banners with a light wave, a calm synthesised music loop and sound effects whose pitch climbs as the room gets cleaner.
- **Share clip:** after a room is restored, one tap makes a 5.6 s 1080×1920 before/after video on the device (a still image where video recording isn't available) and a second tap opens the share sheet.
- **Stages at 25/50/75/100** reveal light, glow, steam and twinkles; at 95% the room finishes itself with a sparkle sweep and a before/after wipe.
- **Real-chore loop:** a matching chore after each room (Do it for real / Not now), honour ticks, 10 Sparkles + 1 Energy each, 5 rewarded a day. Energy buys the optional Big sponge; scrubbing never needs it.
- **Puff:** frame-based 48 px pixel sprite (idle, blink, hop, sneeze, spin, walk in 4 directions) who follows your brush and wanders the floor.
- **Shop** with fixed Sparkle prices for room decor and Puff outfits, **Cosy Days** that never drop, welcome-back party, settings for sound, haptics, reduced motion and a big brush.
- Pixel art is drawn in code with the 24-colour palette (`apps/web/src/art/palette.ts`, copied from the design docs' `palette24.json`) on the 180×390 grid, scaled by whole device pixels so it stays crisp. Sounds are synthesised with WebAudio.

Controls: drag to scrub and to move clutter, tap dust bunnies. On a keyboard, arrow keys or WASD move the brush and Space or Enter scrubs, picks up and drops. Escape (or Android back) pauses.

Not built yet: accounts and sync, the packs API, Plus and billing, share clips, Mess of the Day. The processed Grok Imagine art will replace the code-drawn fallback art once it is in `art/`.
