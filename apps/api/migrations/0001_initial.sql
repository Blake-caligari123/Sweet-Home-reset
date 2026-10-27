-- Sweet Home Reset D1 schema.
-- Source: docs/BACKEND-PLAN.md section 2, the billing_events rename in section 2b,
-- and the items catalogue described in step 4b.
-- Timestamps are ISO-8601 text. Email is stored lowercased by the route, not by a constraint.
-- Saves reject bodies over 256 KB in the API (step 3). Secrets never belong in this file.
-- billing_events is the renamed stripe_events table: one idempotency log for Stripe and RevenueCat.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL,
  age_confirmed_at TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus')),
  plan_status TEXT NOT NULL DEFAULT 'none' CHECK (plan_status IN ('none', 'trialing', 'active', 'past_due', 'canceled', 'refunded')),
  plan_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0, 1)),
  first_failed_at TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  deleted_requested_at TEXT,
  apple_sub TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS saves (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  device_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chore_bonus (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  chore_key TEXT NOT NULL,
  claimed_on TEXT NOT NULL,
  sparkles INTEGER NOT NULL,
  UNIQUE (user_id, chore_key, claimed_on)
);

CREATE TABLE IF NOT EXISTS wallet (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  sparkles_balance INTEGER NOT NULL DEFAULT 0 CHECK (sparkles_balance >= 0)
);

CREATE TABLE IF NOT EXISTS energy (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  currency TEXT NOT NULL CHECK (currency IN ('sparkles', 'energy')),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('stripe', 'revenuecat')),
  type TEXT NOT NULL,
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE IF NOT EXISTS founding_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  redeemed INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO founding_counter (id, redeemed) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS packs (
  id TEXT NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'plus')),
  released_at TEXT NOT NULL,
  manifest_url TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  min_app_version TEXT NOT NULL,
  PRIMARY KEY (id, version)
);

CREATE TABLE IF NOT EXISTS pack_progress (
  user_id TEXT NOT NULL REFERENCES users(id),
  pack_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  stage INTEGER NOT NULL,
  mask_progress REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, pack_id, room_id)
);

-- Step 4b. Fixed Sparkle prices or Plus inclusion. No random rewards.
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  slot TEXT NOT NULL CHECK (slot IN ('puff_tool', 'puff_outfit')),
  sparkles_price INTEGER CHECK (sparkles_price IS NULL OR sparkles_price >= 0),
  plus_included INTEGER NOT NULL DEFAULT 0 CHECK (plus_included IN (0, 1))
);
