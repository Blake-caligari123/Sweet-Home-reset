# Sweet Home Reset: Backend Plan (for Codex)
Owner: SF Backend & Payments Dev. Publisher: PixelVortex Games. This reuses BUILD-SPEC.md sections 5, 7 and 8. If this doc and BUILD-SPEC disagree, BB Builder decides.

## 0. Ground rules (paste into every Codex session)
- Use free tiers only: Cloudflare Workers, D1, Pages, Cron Triggers, and the Resend free tier. No paid add-ons.
- Never commit secrets. Put them in Worker secrets (`wrangler secret put`), and use `.dev.vars` locally (gitignored, chmod 600).
- Use Stripe test mode until Blake finishes Stripe setup for PixelVortex Games.
- The game must be fully playable offline and while signed out, and the server only backs it up. The core loop is never behind the server or the paywall.
- The game is playable signed out on every platform. An account is needed only for sync and Plus. Accounts are 16+, with an age checkbox at sign-up. There are no public profiles, chat or feed.
- Every step below ends with its tests passing (`npm test`). Write the tests first.

## 1. Stack
- The API is Cloudflare Workers with Hono (TypeScript), and the database is D1 (SQLite). Static files are on Pages, and the API is mounted at `/api/*`.
- Tests use Vitest with `@cloudflare/vitest-pool-workers`, against a local D1 database. Stripe and Resend are mocked with fetch stubs, so the tests need no keys.
- Env var names (values never go in code or chat): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_COUPON_FOUNDING` (optional), `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_AUTH`, `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_ORIGIN`, `SESSION_SECRET`.
- Fail closed: if any Stripe var is missing or malformed, every `/api/billing/*` route returns 503 `{"error":"billing_unavailable"}` and the app shows "Plus isn't available yet". The same applies to email if the Resend vars are missing: sign-in returns 503 with a clear message.

## 2. Data model (D1 migrations in `migrations/`)
- `users`: id (uuid), email (unique, lowercased), created_at, age_confirmed_at, plan [free|plus], plan_status [none|trialing|active|past_due|canceled|refunded], plan_period_end, cancel_at_period_end (0/1), first_failed_at, stripe_customer_id, stripe_subscription_id, deleted_requested_at
- `sessions`: id (random 32 bytes, stored as a SHA-256 hash), user_id, created_at, expires_at (30 days), user_agent_hash
- `magic_links`: token_hash, email, expires_at (15 min), used_at
- `saves`: user_id PK, version (int), data_json (the game state blob, max 256 KB), updated_at, device_id
- `chore_bonus`: id, user_id, chore_key, claimed_on (local date), sparkles; UNIQUE(user_id, chore_key, claimed_on)
- `wallet` (user_id, sparkles_balance) and `ledger` (id, user_id, delta, reason, ref_id, created_at). The balance always equals the sum of the ledger.
- `stripe_events`: event_id PK, type, processed_at
- `rate_limits`: key, window_start, count
- `founding_counter`: id=1, redeemed (int)
- `users.apple_sub` (unique, nullable)
- `energy` (user_id, balance, updated_at). Ticking a real chore adds Energy and Sparkles. Scrubbing and mini-tasks never cost Energy. Energy is spent only on optional boosts and Puff's tools, and the server rejects any spend that would take the balance below 0. Every change is written to `ledger` with currency [sparkles|energy].
- `packs` (id, version, title, tier [free|plus], released_at, manifest_url, sha256, min_app_version)
- `pack_progress` (user_id, pack_id, room_id, stage, mask_progress, updated_at). This can stay inside the save blob, and the table is only for analytics if Ops approves.


## 2b. One entitlement across web, iOS and Android
- **RevenueCat** (free tier, check its current revenue limit before launch) is the single source of truth for the `plus` entitlement. The RevenueCat app user id is our `users.id`, set once the player signs in on any platform.
- **Web:** Stripe Checkout (Steps 6–9), connected to RevenueCat through its Stripe integration.
- **iOS:** Apple In-App Purchase, with auto-renewable subscriptions `plus_monthly` and `plus_yearly` in one subscription group and a 7-day free trial as an introductory offer. In the Australian App Store the iOS app shows only IAP and never links to or mentions web prices. Restore Purchases sits in Settings.
- **Android:** Google Play Billing, with subscription `plus` and base plans `monthly` and `yearly`, plus a 7-day free-trial offer.
- **Prices:** target A$7.99/mo and A$44.99/yr. Apple and Google use price points, so Ops picks the nearest AUD point, and the wording shown must use the exact store price. The founding A$34.99 first year is web only (Stripe coupon), and on mobile it's a store introductory offer only if Ops approves it.
- **Server:** `POST /api/revenuecat/webhook` (Authorization header must equal REVENUECAT_WEBHOOK_AUTH, compared in constant time, and idempotent on event.id in `stripe_events`, renamed `billing_events` with a `source` column) handles INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION, BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE and REFUND by updating `users.plan` and the related fields, then calls RevenueCat `GET /subscribers/{id}` to confirm. The Stripe webhook (Step 7) stays for web events. Whichever fires, `plan` comes from the active entitlement, so a player who pays on one platform has Plus on all of them.
- **Grace period:** a store billing issue (Apple billing retry, Google grace or account hold) maps to past_due and uses the same notice and the same 7-day rule as Step 8.
- **Cancel and refund:** on web this goes through the Stripe portal. On iOS and Android, Plan & billing deep-links to the store's subscription page, because store refunds are handled by Apple or Google.
- **AT15:** a mocked RevenueCat webhook for each event type sets the right plan. A replayed event or wrong auth gets no change and 401. A purchase on iOS gives Plus on web for the same user. Two purchases on different stores show one Plus and log an alert.

## 2c. Store submission (backend side)
- **Blake-only actions, nothing pre-paid:** developer accounts under PixelVortex Games: Apple Developer Program (organisation, needs a D-U-N-S number, about US$99 a year) and Google Play Console (organisation, a one-off fee of about US$25). These cost money, so they need Blake's yes. Blake does the ID steps.
- **Account deletion:** Apple and Google both require deletion inside the app. `DELETE /api/me` (Step 11) is reachable from Settings on every platform, and Google also needs a public deletion web page at `/delete-account`. Deleting an account doesn't cancel a store subscription, so the app tells the player to cancel it in the store, as both stores require.
- **Privacy labels and data safety:** collected data is email (account), game progress and chore ticks (app functionality), and purchase history (through RevenueCat and the stores). Nothing is used for tracking, nothing is sold, and there's no IDFA or ad SDK. Data is encrypted in transit, and players can delete it. Use the same list in Apple's App Privacy and Google's Data safety forms, and it must match /privacy.
- **IARC rating:** answer the questionnaire truthfully. There's no violence, chat, gambling or loot boxes, so the content rating is likely Everyone/4+. That's separate from our 16+ account policy. Ops decides whether to pick a higher age band on purpose (Apple lets developers choose a higher rating). Mark "digital purchases" yes.
- **Sign-in:** an email magic link, plus Sign in with Apple. `POST /api/auth/apple {identityToken, nonce}` checks the JWT against Apple's JWKS (iss, aud = bundle ID `com.pixelvortexgames.sweethomereset` (iOS) and the web Services ID `com.pixelvortexgames.sweethomereset.web`, exp, and a hashed nonce), then links to an existing account by Apple `sub`, or by verified email. Hide-my-email relay addresses are supported. When an account is deleted, call Apple's token revoke endpoint. Env: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CLIENT_IDS` (comma-separated, both ids above).
- **AT16:** a forged, expired or wrong-audience Apple token gets 401. A valid token creates the account once, and signing in again returns the same user. Revoke is called on deletion.
- On mobile, magic links open the app through Universal Links (`apple-app-site-association`) and Android App Links (`assetlinks.json`), both served by the Worker.

## 3. Codex-sized steps (in order)
Version 1 includes everything below, and the scrub game and the real-chore loop are both core. The save blob holds each room's dirt-mask progress and stage (25/50/75/100, with a room counting as clean at 95%). 3 rooms are free and the rest are Plus. Before-and-after clips are made and shared on the device and never uploaded. Web, iOS and Android all use the same API and the same account.
**Step 1: Scaffold.** Hono app, D1 binding, migrations, `GET /api/health` returning `{ok:true}`, and the test harness.
- AT1: `GET /api/health` returns 200, and migrations apply cleanly to an empty database.

**Step 2: Magic-link auth.** `POST /api/auth/start {email, ageConfirmed}` requires ageConfirmed=true for new users, saves a hashed token and emails a link through Resend. `GET /api/auth/verify?token=` uses the token once, sets the session cookie (HttpOnly, Secure, SameSite=Lax) and redirects. `POST /api/auth/logout` deletes the session.
- The response is the same whether or not the email exists, so it can't be used to discover accounts.
- AT2: a new user without ageConfirmed gets 400. An expired or used token gets 400. A valid token gives a session, and reusing it fails.
- AT3: `/api/auth/start` allows 5 requests per email per hour and 20 per IP per hour, then returns 429.

**Step 3: Save and sync.** `GET /api/save` returns {version, data, updated_at}. `PUT /api/save {baseVersion, data, deviceId}` saves only if baseVersion matches the stored version, then increments it. Otherwise it returns 409 with the server copy, and the client merges by taking the higher progress per room and the union of owned items, then retries.
- The client keeps a local save in IndexedDB and syncs when online. Signed-out play saves locally only.
- AT4: two devices save at the same time, one gets 409, and after the merge nothing is lost. Saves over 256 KB get 413. Invalid JSON gets 400.

**Step 4: Sparkles ledger and the real-chore loop (core).** `POST /api/chores/claim {choreKey, localDate}` adds a fixed bonus (from a server-side table) once per chore per day, up to a daily cap of 5 claims. It also gives +2 Energy once per ISO week when chores have been ticked on 3 distinct local dates that week (ledger reason `weekly_3_days`). Nothing resets and nothing is taken away. The chore bonus works on the honour system with no photos, and it never takes anything away.
- AT5: claiming the same chore twice on the same day only adds once. A sixth claim gets 429. The wallet always equals the ledger sum.
- AT6: no endpoint gives a random reward in exchange for money (code review plus a test of the item price table).

**Step 4b: Room pack catalogue (weekly drops, no app release).** `GET /api/packs?since=` is public and cacheable (ETag, 5-minute max-age) and returns [{id, version, title, tier, released_at, manifest_url, sha256, min_app_version}]. Each pack's JSON (art layers, dirt masks, decor and chores) and its assets are static files on Pages under `/packs/{id}/{version}/`. They're immutable and cached by the client for offline play. A pack's free or Plus flag is decided on the server. A Plus pack's manifest can be downloaded by anyone, but saving progress or claiming rewards in it needs the plus entitlement. A pack is published by adding a row and its files, and nothing has to be redeployed.
- AT4b: the catalogue lists the free and Plus flags, and a changed ETag gives 200 while an unchanged one gives 304. A hash mismatch is rejected. A free user saving progress in a Plus pack gets 403. A pack whose min_app_version is newer than the client's is hidden.
- AT4c (no store release): with the app build unchanged, insert a new `packs` row and upload its files. The next `GET /api/packs` call returns it, the client downloads it, checks the sha256, and makes it playable offline. A Plus pack shows as locked to free users.
- Puff's tools and outfits are rows in `items` (slot puff_tool or puff_outfit), unlocked with Sparkles or by Plus, at fixed prices with no random rewards. Energy only powers optional boosts and Puff's tools.

**Step 4d: Mess of the Day seed.** The seed is computed the same way on the client and the server, so it works offline: `seed = sha256("motd:" + YYYY-MM-DD in the player's local tz + ":" + catalogue_version)`, which picks a free room plus a mess layout from the cached free packs. `GET /api/daily?date=` returns the same seed and is used only to check Sparkles claims. Each user can claim the Mess of the Day reward once per date.
- AT4d: the client and server produce the same seed for the same date and catalogue. A second claim on the same date pays nothing. It works offline with the cached catalogue.

**Step 5: Plus entitlement.** `GET /api/me` returns the plan, status, period end, cancel_at_period_end and a `notice` string. The rooms and features behind Plus are checked on the server from `users`, not trusted from the client.
- AT7: a free user can't unlock a Plus room through the API, and a Plus user can.

**Step 6: Stripe Checkout.** `POST /api/billing/checkout {interval: monthly|yearly}` creates a Checkout Session in subscription mode with the price from env, a 7-day trial (`subscription_data.trial_period_days=7`), client_reference_id=user id, and the founding coupon when the counter is under 100 and the interval is yearly. Prices are A$7.99/mo, A$44.99/yr and A$34.99 for the founding first year, AUD and GST-inclusive. They live in one `config/pricing.json` (used for display and checked against the Stripe, App Store and Play prices by a test), and the charged amounts come from the Stripe price ids.
- The renewal wording comes from the `RENEWAL_COPY` constant (Ops owns the text, quoted verbatim in BUILD-SPEC section 7).
- AT8: mocked Stripe receives the right price id, trial days and reference. Missing keys return 503. Users who aren't signed in get 401.

**Step 7: Webhook.** `POST /api/stripe/webhook` checks the Stripe-Signature (HMAC-SHA256, 5-minute tolerance, any v1 signature can match), then inserts event_id into `stripe_events` inside the same transaction as the update. It handles:
- `checkout.session.completed` and `customer.subscription.created|updated`: set plan, status, period end and cancel_at_period_end.
- `invoice.paid`: status=active and clear first_failed_at.
- `invoice.payment_failed`: status=past_due and set first_failed_at once. Plus stays on.
- `customer.subscription.deleted`: plan=free, status=canceled.
- `charge.refunded` (full refund): plan=free, status=refunded. A later invoice.paid for the same period can't restore access.
- Bad signature returns 400, duplicate event returns 200 with no change, unknown type returns 200, and a processing error returns 500 without marking the event done, so Stripe retries.
- AT9: one test per event type, plus tests for a replayed event, a bad signature, a stale timestamp, a rotated secret (two v1 values) and a full refund followed by a late paid event.

**Step 8: Grace period and cron.** Plus stays on while past_due. A daily cron sets plan=free when `now - first_failed_at > 7 days`, or straight away on `unpaid`/`canceled`. While past_due, `notice` reads "Payment didn't go through. Update your card in Plan & billing." Saves and items are never deleted, and Plus rooms freeze as they are.
- AT10: with an injected clock, day 6 still has Plus and day 8 is free, and the save is unchanged.

**Step 9: Cancel and the portal.** `POST /api/billing/portal` returns a Stripe Customer Portal URL. Cancelling happens at period end, so Plus lasts until `plan_period_end`, and `/api/me` shows "Plus until [date]". The cancel date and the past_due notice can show together.
- AT11: after cancel_at_period_end=true, the user keeps Plus until the end date, then drops to free through the subscription.deleted event.

**Step 10: Trial reminder email.** A daily cron emails trialing users 3 days before the first charge, using the Ops wording "You'll be charged A$[PRICE] on [DATE] unless you cancel.", through Resend. It's transactional only, and each user gets it at most once.
- AT12: the mocked Resend is called once per eligible user, and a second cron run sends nothing.

**Step 11: Privacy, export and delete.** `GET /api/me/export` returns JSON of every row for the user. `DELETE /api/me` cancels the Stripe subscription straight away, deletes sessions, and sets deleted_requested_at. A daily cron hard-deletes users marked more than 30 days ago, along with all their rows. Logs never contain email addresses, tokens or save contents.
- AT13: the export includes users, saves, ledger and chore_bonus. After delete, sign-in is blocked and the mocked Stripe cancel is called. After the cron runs at day 31, no rows remain.

**Step 11b: Analytics.** `POST /api/events` takes batches of up to 50 events from the GAME-DESIGN.md list, with an anonymous install id, the user id only when signed in, and no email or chore text. It's rate-limited, dropped when the player has turned analytics off, and kept for 13 months.
- AT17: unknown event names and fields carrying an email address are rejected, and nothing is stored when analytics is off.

**Step 12: Hardening.** Add CSRF protection (an Origin check against PUBLIC_ORIGIN on state-changing routes from the browser. The native apps use a Bearer session token kept in Keychain or Keystore instead of a cookie), a JSON body size limit, rate limits (auth from step 2, saves 60 per minute per user, chore claims as in step 4), security headers, and a uniform error shape `{error:"code"}`.
- AT14: a cross-origin POST gets 403, and requests over the limits get 429.

## 4. Done checklist
- Every acceptance test from AT1 to AT17, including AT4b, passes locally with no keys.
- A real Stripe test-mode run (checkout, renewal through a test clock, failed card 4000 0000 0000 0341, cancel and refund) is only done after Blake adds the test keys as Worker secrets.
- QA Group signs off before anything is called done, and nothing goes to production or public without Blake's yes.
