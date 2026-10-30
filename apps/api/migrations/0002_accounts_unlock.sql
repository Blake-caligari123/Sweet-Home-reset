-- Accounts, sync history, the one unlock, billing events, analytics and rate limits (BACKEND-PLAN §3,
-- adapted to VISION §10: a single non-consumable unlock instead of a subscription).
ALTER TABLE users ADD COLUMN apple_sub TEXT;
ALTER TABLE users ADD COLUMN apple_refresh_token TEXT;
ALTER TABLE users ADD COLUMN apple_client_id TEXT;
ALTER TABLE users ADD COLUMN full_game INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN full_game_via TEXT;
ALTER TABLE users ADD COLUMN full_game_at TEXT;
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN deleted_requested_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_apple_sub ON users(apple_sub);

ALTER TABLE saves ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE saves ADD COLUMN saved_at TEXT;

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  age_confirmed INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS save_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  saved_at TEXT,
  device_id TEXT NOT NULL,
  kept_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  install_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  props_json TEXT,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
