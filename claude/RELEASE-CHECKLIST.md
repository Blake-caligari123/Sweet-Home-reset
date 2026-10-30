# Release checklist (30 Oct 2026)
What's left before v1.0 (VISION §12–13, Phase 5 "done when Blake approves the store submissions"). The code side is built and tested with no keys. Everything below needs Blake: accounts, money, keys or a yes to publish (CLAUDE.md hard rules). Secrets go in Worker secrets or `.dev.vars`, never in code or chat.

## 1. Accounts (cost money: Blake's yes)
- [ ] Apple Developer Program, organisation PixelVortex Games (D-U-N-S number, about US$99 a year).
- [ ] Google Play Console, organisation (about US$25 once).
- [ ] Cloudflare (free tier), Resend (free tier, a sending domain), Stripe (test mode first), RevenueCat (free tier: check its revenue cap).

## 2. The server (`apps/api`)
- [ ] `wrangler d1 create sweet-home-reset`, put its id in `apps/api/wrangler.toml`, then `wrangler d1 migrations apply sweet-home-reset`.
- [ ] Worker secrets: `PUBLIC_ORIGIN`, `RESEND_API_KEY`, `EMAIL_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FULL_GAME`, `REVENUECAT_WEBHOOK_AUTH`, `APPLE_CLIENT_IDS`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`.
- [ ] Deploy (Blake's yes), then point Stripe's webhook at `/api/stripe/webhook` and RevenueCat's at `/api/revenuecat/webhook`.
- [ ] A real Stripe test-mode run: buy, refund (BACKEND-PLAN §9).

## 3. The purchase
- [ ] Pick the price point: A$14.99 is provisional (`config/pricing.json`). Check the nearest App Store and Play tiers, then update the file.
- [ ] App Store Connect: non-consumable in-app purchase `full_game`. Play Console: one-time product `full_game`.
- [ ] RevenueCat: entitlement `full_game` with both products in the current offering; copy the public SDK keys.
- [ ] Stripe: product "Full game" with a one-time AUD price (its id is `STRIPE_PRICE_FULL_GAME`).

## 4. Builds
- [ ] Build settings: `VITE_API_ORIGIN` (web), `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY` (phones). Without them the build has no gate and no account, which is right for the test link.
- [ ] Sign in with Apple: a Services ID `com.pixelvortexgames.sweethomereset.web` and a key; the server side is ready, and the button goes in once these exist.
- [ ] Universal Links / App Links for sign-in emails, once the real domain exists (`capacitor.config.ts` notes the placeholder).
- [ ] iOS: `npx cap add ios`, `npx cap sync`, archive in Xcode, TestFlight. Android: `npx cap sync`, signed bundle, internal testing track.

## 5. Store pages
- [ ] Copy: `claude/STORE-LISTING.md`. Ratings and privacy forms: `claude/IARC-ANSWERS.md`.
- [ ] Fill `{SUPPORT_EMAIL}`, `{SUPPORT_URL}`, `{SITE}` and `{API_DOMAIN}` in the listing and in `apps/web/public/privacy.html`, and have the policy reviewed.
- [ ] Screenshots: `art/store/` (iPhone 6.9" and Android phone). Make fresh ones with `node tools/store-screenshots.cjs` while the dev server runs.
- [ ] Check frame time on a real iPhone (the recheck's open item).

## 6. Testing rounds, then submit
- [ ] TestFlight and Play internal testing with a few families; fix what they find.
- [ ] QA Group signs off (CLAUDE.md), then Blake approves the submissions.
