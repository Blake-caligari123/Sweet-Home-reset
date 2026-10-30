# Sweet Home Reset: Backend Plan v3 (for Claude Code)
Owner: SF Backend & Payments Dev. Publisher: PixelVortex Games. Matches GAME-DESIGN.md v3 (Part A wins; section A11 backend = `claude/gdd-v3/backend.md`). If this doc and GAME-DESIGN disagree, BB Builder decides. v2 plan archived at `claude/gdd-v3/BACKEND-PLAN-v2-archive.md`.

## 0. Ground rules (also in /CLAUDE.md)
- Free tiers only: Cloudflare Workers, D1, Pages, Cron Triggers, Resend free tier, RevenueCat free tier. No paid add-ons.
- Never commit secrets. Worker secrets (`wrangler secret put`); `.dev.vars` locally (gitignored, chmod 600).
- Stripe test mode until Blake finishes Stripe setup for PixelVortex Games.
- **Local first:** the whole game (town, Fluff, clock, seasons, neighbours, crafting) runs on the device, offline and signed out. The server only does opt-in sync, Plus, Mess of the Day / real-chore claim checks, packs, analytics and privacy. No gameplay waits on the network.
- Accounts are optional, 16+ (age checkbox), needed only for sync and cross-device Plus. No public profiles, chat, feed, friend visits or leaderboards in v3 (later).
- Tests first; every step ends with `npm test` green.

## 1. Stack
- Cloudflare Workers + Hono (TypeScript), D1 (SQLite), static on Pages, API at `/api/*`.
- Vitest with `@cloudflare/vitest-pool-workers` on local D1; Stripe, RevenueCat, Apple and Resend mocked with fetch stubs (no keys in tests).
- Env names (values never in code or chat): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_COUPON_FOUNDING` (optional), `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_AUTH`, `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_ORIGIN`, `SESSION_SECRET`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CLIENT_IDS`.
- Fail closed: missing billing vars → `/api/billing/*` 503 `{"error":"billing_unavailable"}`, app shows "Plus isn't available yet". Missing Resend vars → sign-in 503 with a clear message. The game itself is unaffected.

## 2. Client save (no server needed)
- IndexedDB DB `shr`, store `saves`, keys `main` and `backup`. One JSON object:
  `schemaVersion, catalogueVersion, deviceId, savedAt (ISO with local offset), localDate, day, season, year, clockMin, fluff, sparkles, bag[], tools{id:tier}, areas{areaId: messRLE (1 byte/tile)}, restored[], crops[], hearts{npcId:n}, seenEvents[], requests[], festivalsDone[], letters[], choreLog[], plusCache, settings`.
- Write: at bed (main), autosave every 60 s and on `visibilitychange` hidden (backup). Backup first, then main. Corrupt or unparsable main → load backup, log `save_recovered`.
- Migrations: `src/save/migrations.ts`, `migrations[n](save) → save` chain run on load; never drop unknown fields; one fixture per version in `test/fixtures/save-vN.json`.
- Size target < 256 KB after a scripted 56-day run (mess RLE keeps it small).
- AT1 (M1): round-trip; corrupt main recovers from backup; v1→v2 fixture migrates; schema bump on a real save keeps every field.

## 3. Data model (D1 migrations in `migrations/`)
- `users`: id (uuid), email (unique, lowercased, nullable for Apple relay), apple_sub (unique, nullable), created_at, age_confirmed_at, plan [free|plus], plan_status [none|trialing|active|past_due|canceled|refunded], plan_period_end, cancel_at_period_end, first_failed_at, stripe_customer_id, stripe_subscription_id, deleted_requested_at
- `sessions`: id (32 random bytes, stored SHA-256), user_id, created_at, expires_at (30 days), user_agent_hash
- `magic_links`: token_hash, email, expires_at (15 min), used_at
- `saves`: user_id PK, blob (gzip JSON ≤ 256 KB), schema_version, version (int, optimistic lock), saved_at, device_id
- `save_history`: id, user_id, blob, saved_at, device_id; kept 30 days, max 10 per user
- `claims`: id, user_id, kind [motd|chore], key, local_date, server_date, sparkles; UNIQUE(user_id, kind, key, local_date)
- `billing_events`: event_id PK, source [stripe|revenuecat], type, processed_at
- `packs`: id, version, catalogue_version, tier [free|plus], released_at, manifest_url, sha256, min_app_version
- `rate_limits`: key, window_start, count
- `founding_counter`: id=1, redeemed
- Removed from v2: `energy`, `wallet`/`ledger` (Sparkles live in the save; only server-checked claims are stored), `pack_progress`, `chore_bonus` (now `claims`).

## 4. Plus: one entitlement across web, iOS and Android
- **30 Oct 2026, VISION §10:** Plus is now one non-consumable unlock, the RevenueCat `full_game` entitlement, kept as `users.full_game`. Stripe Checkout runs in `payment` mode with `STRIPE_PRICE_FULL_GAME`. There are no renewals, trials, grace or trial emails, so steps 11–13 fall away; a refund takes the unlock back. The subscription text below is kept for history.
- **RevenueCat** (free tier, check its current revenue limit before launch) is the single source of truth for the `plus` entitlement. The RevenueCat app user id is our `users.id`, set once the player signs in on any platform.
- **Web:** Stripe Checkout (Steps 6–9), connected to RevenueCat through its Stripe integration.
- **iOS:** Apple In-App Purchase, with auto-renewable subscriptions `plus_monthly` and `plus_yearly` in one subscription group and a 7-day free trial as an introductory offer. In the Australian App Store the iOS app shows only IAP and never links to or mentions web prices. Restore Purchases sits in Settings.
- **Android:** Google Play Billing, with subscription `plus` and base plans `monthly` and `yearly`, plus a 7-day free-trial offer.
- **Prices:** A$7.99/mo and A$44.99/yr (yearly default), 7-day trial on every platform. Apple and Google use price points, so Ops confirms the AUD point (STORE-PRICES.md), and the wording shown must use the exact store price. The founding A$34.99 first year is web only (Stripe coupon); there is no mobile founding offer.
- **Server:** `POST /api/revenuecat/webhook` (Authorization header must equal REVENUECAT_WEBHOOK_AUTH, compared in constant time, and idempotent on event.id in `stripe_events`, renamed `billing_events` with a `source` column) handles INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION, BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE and REFUND by updating `users.plan` and the related fields, then calls RevenueCat `GET /subscribers/{id}` to confirm. The Stripe webhook (Step 7) stays for web events. Whichever fires, `plan` comes from the active entitlement, so a player who pays on one platform has Plus on all of them.
- **Grace period:** a store billing issue (Apple billing retry, Google grace or account hold) maps to past_due and uses the same notice and the same 7-day rule as Step 8.
- **Cancel and refund:** on web this goes through the Stripe portal. On iOS and Android, Plan & billing deep-links to the store's subscription page, because store refunds are handled by Apple or Google.
- **AT15:** a mocked RevenueCat webhook for each event type sets the right plan. A replayed event or wrong auth gets no change and 401. A purchase on iOS gives Plus on web for the same user. Two purchases on different stores show one Plus and log an alert.

- **v3 gate:** `plus` unlocks seasons 2–4 (summer, autumn, winter), neighbours 4–6 and their stories, weekly visitors, the full wardrobe/decor and extra house upgrades. The whole first spring (days 1–14, neighbours 1–3, garden, crafting) is free.
- **Client check:** from cached RevenueCat CustomerInfo (`plusCache` in the save) so it works offline; re-check on launch when online; 3-day offline grace, then treat as free until next check.
- **Offer:** as a postcard back home after the Spring Clean Fair (day 14, `freeDays` in `config/tuning.json`; repeats after `unlockOfferRepeatNights`), never during a task, at most once a week after.
- **Lapse:** never locks or edits existing progress. The player freezes at the end of the last season they can access, with a friendly card; save, town, items, hearts and restored homes stay usable. Re-subscribing resumes exactly where they stopped.
- **Server check:** only for synced Plus content in packs and for `/api/me`. The local game never needs the server to play.
- AT4 (M5): mocked entitlement opens and closes the gate; lapse leaves the save byte-identical; Restore Purchases restores Plus in sandbox; offer never fires mid-task or twice in one week.

## 5. API steps (Claude Code-sized, in order; tests first)
**Step 1: Scaffold.** Hono, D1 binding, migrations, `GET /api/health` → `{ok:true}`, test harness.
- AT-S1: health 200; migrations apply to an empty DB.

**Step 2: Magic-link auth.** `POST /api/auth/start {email, ageConfirmed}` (ageConfirmed required for new users), hashed token, Resend email. `GET /api/auth/verify?token=` one-time, sets HttpOnly/Secure/SameSite=Lax cookie (native: Bearer token in Keychain/Keystore). `POST /api/auth/logout`. Same response whether the email exists or not.
- AT-S2: no ageConfirmed → 400; expired/used token → 400; valid token → session, reuse fails; 5/email/h and 20/IP/h then 429.

**Step 3: Sign in with Apple** (see section 8). AT-S3 = AT16.

**Step 4: Opt-in sync.** `GET /api/save` → {version, schemaVersion, savedAt, deviceId, blob}. `PUT /api/save {baseVersion, blob, deviceId, savedAt}` saves only if baseVersion matches, increments version and copies the old row into `save_history`; else 409 with the server copy. The client never auto-merges a life-sim save: on 409 from a different device it shows "Keep this device or cloud save?" with day, season and savedAt of each, and the losing copy stays in `save_history`. Server rejects a blob whose schemaVersion is newer than it knows (422) and never migrates saves itself.
- AT-S4: two devices → one 409 and the prompt; chosen copy wins, the other is in history; >256 KB → 413; bad JSON → 400; history capped at 10 and 30 days.

**Step 5: Pack catalogue.** Content is pack JSON (areas with tile maps and walkable grid, chunks, mess types, neighbours with schedules, likes, dialogue and heart events, crops, shop stock by season, festivals, requests, weekly visitors, tuning), validated by `schemas/pack.schema.json` in CI. The app ships with the year-1 packs bundled, so it works offline from first launch. `GET /api/packs?since=` (public, ETag, 5-min max-age) lists newer packs; files are immutable on Pages at `/packs/{id}/{version}/`; client checks sha256 and caches. Plus packs download for anyone (so lapsed saves still load) but the client gates play by entitlement.
- AT-S5: ETag 304/200; sha256 mismatch rejected; `min_app_version` newer than client hidden; a new pack row reaches an unchanged build and plays offline; schema CI fails on a bad pack.

**Step 6: Mess of the Day and real-chore claims.** Seed shared by client and server: `sha256("motd:" + local YYYY-MM-DD + ":" + catalogueVersion)`. Signed-out players claim locally (honour system, capped in the save). Signed-in players call `POST /api/claims {kind, key, localDate}`: MotD once per date; real chores up to 5 a day; the server rejects a localDate more than 1 day from server date in the player's timezone (clock-change guard). The response gives the Sparkles to add to the save. Nothing ever resets or is taken away, and nothing random is sold.
- AT-S6: same seed on client and server; second claim pays 0; 6th chore → 429; far-off localDate → 400; works offline with the bundled catalogue.

**Step 7: `GET /api/me`.** plan, status, period end, cancel_at_period_end, `notice`.
- AT-S7: free vs Plus correct from mocked RevenueCat.

**Step 8: Stripe Checkout (web).** `POST /api/billing/checkout {interval}`: subscription mode, price from env, `trial_period_days=7`, client_reference_id=user id, founding coupon (A$34.99 first year, yearly only, first 100). Prices A$7.99/mo and A$44.99/yr, AUD GST-inclusive, in `config/pricing.json` (a test checks it against Stripe, App Store and Play prices). Renewal wording from `RENEWAL_COPY` (Ops text).
- AT-S8: mocked Stripe gets the right price, trial and reference; missing keys 503; signed-out 401.

**Step 9: Stripe webhook.** `POST /api/stripe/webhook`: HMAC-SHA256 signature (5-min tolerance, any v1 matches), event_id into `billing_events` in the same transaction. checkout.session.completed / subscription.created|updated → plan fields; invoice.paid → active, clear first_failed_at; invoice.payment_failed → past_due, set first_failed_at once (Plus stays); subscription.deleted → free/canceled; charge.refunded (full) → free/refunded, a later invoice.paid for that period can't restore. Bad sig 400, duplicate 200 no-op, unknown 200, processing error 500 (not marked done).
- AT-S9: one test per event, replay, bad sig, stale timestamp, rotated secret, refund then late paid.

**Step 10: RevenueCat webhook.** As section 4 (AT15).

**Step 11: Grace and cron.** past_due keeps Plus; daily cron sets free when `now - first_failed_at > 7 days` or on unpaid/canceled. Notice: "Payment didn't go through. Update your card in Plan & billing." Saves are never touched (see Lapse).
- AT-S11: injected clock, day 6 Plus, day 8 free, save unchanged.

**Step 12: Cancel and portal.** `POST /api/billing/portal` (web). Cancel at period end; `/api/me` shows "Plus until [date]". Mobile deep-links to store subscription settings.
- AT-S12: cancel_at_period_end keeps Plus to the end date, then free via subscription.deleted.

**Step 13: Trial reminder email.** Daily cron, 3 days before first charge, Ops wording "You'll be charged A$[PRICE] on [DATE] unless you cancel.", once per user, web trials only (stores send their own).
- AT-S13: one send per eligible user; second run sends nothing.

**Step 14: Privacy, export, delete.** In-app Settings: Export my data (`GET /api/me/export`: users, saves, save_history, claims, billing state) and Delete account (`DELETE /api/me`: cancels Stripe now, revokes Apple token, deletes sessions, saves and save_history straight away, sets deleted_requested_at; daily cron hard-deletes the rest after 30 days). Option "also delete the save on this device". App tells store subscribers to cancel in the store. Public `/delete-account` page for Google. Logs never contain emails, tokens or save contents.
- AT-S14: export complete; after delete sign-in blocked, Stripe cancel and Apple revoke called, save rows gone at once, 0 rows after day 31.

**Step 15: Analytics.** `POST /api/events` batches ≤ 50 of the GAME-DESIGN metric events, anonymous install id, user id only when signed in, no email or chore text; off switch respected; kept 13 months; rate-limited.
- AT-S15 (AT17): unknown events and email-like fields rejected; nothing stored when off.

**Step 16: Hardening.** Origin check vs PUBLIC_ORIGIN on browser state-changing routes (native uses Bearer), JSON body limits, rate limits (auth per step 2; saves 60/min/user; claims per step 6; global 60 req/min/user), security headers, uniform `{error:"code"}`.
- AT-S16: cross-origin POST 403; over-limit 429.

## 6. Milestone mapping (GAME-DESIGN A9, v2 order; backend done-when)
- **M1 Burrow and yard:** section 2 (client save, migrations, backup) + pack schema in CI. AT1 and the AT-S5 schema test.
- **M2 Town and all 6 neighbours:** neighbours, hearts, requests and shops load from packs; hearts never drop across save/load; Plus gate for neighbours 4-6 stubbed with a mocked flag.
- **M3 Garden, materials, crafting:** crops, materials and tool tiers persist; save < 256 KB after a scripted 7-day run.
- **M4 Seasons, festivals, sharing:** 56-day scripted run saves/loads at every bed; save < 256 KB; device-timezone seasons; Step 6 (Mess of the Day and claims, local path) with AT-S6; clips never uploaded.
- **M5 Launch:** Steps 1-5 and 7-16 (accounts, sync, Plus on all stores, server claims, privacy, analytics, hardening), section 8 store items and IARC. AT4, AT15, AT16 and every AT-S pass.

## 7. Risks
- Clock changes offline can speed the day cycle; accepted for single-player. Only server claims are guarded.
- Real-month seasons need the device timezone; always store local date with offset.
- Sync conflicts on a life sim can't be merged safely, so the player chooses; history keeps the other copy 30 days.
- RevenueCat free tier revenue cap: check before launch.

## 8. Store submission (backend side)
- **Blake-only actions, nothing pre-paid:** developer accounts under PixelVortex Games: Apple Developer Program (organisation, needs a D-U-N-S number, about US$99 a year) and Google Play Console (organisation, a one-off fee of about US$25). These cost money, so they need Blake's yes. Blake does the ID steps.
- **Account deletion:** Apple and Google both require deletion inside the app. `DELETE /api/me` (Step 11) is reachable from Settings on every platform, and Google also needs a public deletion web page at `/delete-account`. Deleting an account doesn't cancel a store subscription, so the app tells the player to cancel it in the store, as both stores require.
- **Privacy labels and data safety:** collected data is email (account), game progress (save blob) and chore ticks (app functionality), and purchase history (through RevenueCat and the stores). Nothing is used for tracking, nothing is sold, and there's no IDFA or ad SDK. Data is encrypted in transit, and players can delete it. Use the same list in Apple's App Privacy and Google's Data safety forms, and it must match /privacy.
- **IARC rating:** answer the questionnaire truthfully. There's no violence, chat, gambling or loot boxes, so the content rating is likely Everyone/4+. That's separate from our 16+ account policy. Ops decides whether to pick a higher age band on purpose (Apple lets developers choose a higher rating). Mark "digital purchases" yes.
- **Sign-in:** an email magic link, plus Sign in with Apple. `POST /api/auth/apple {identityToken, nonce}` checks the JWT against Apple's JWKS (iss, aud = bundle ID `com.pixelvortexgames.sweethomereset` (iOS) and the web Services ID `com.pixelvortexgames.sweethomereset.web`, exp, and a hashed nonce), then links to an existing account by Apple `sub`, or by verified email. Hide-my-email relay addresses are supported. When an account is deleted, call Apple's token revoke endpoint. Env: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CLIENT_IDS` (comma-separated, both ids above).
- **AT16:** a forged, expired or wrong-audience Apple token gets 401. A valid token creates the account once, and signing in again returns the same user. Revoke is called on deletion.
- On mobile, magic links open the app through Universal Links (`apple-app-site-association`) and Android App Links (`assetlinks.json`), both served by the Worker.

## 9. Done checklist
- Every AT passes locally with no keys.
- Real Stripe test-mode run (checkout, test-clock renewal, failed card, cancel, refund) only after Blake adds test keys as Worker secrets.
- QA Group signs off before anything is called done; nothing goes to production or public without Blake's yes via BB Manager.
