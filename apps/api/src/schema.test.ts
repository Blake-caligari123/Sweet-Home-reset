import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../migrations/0001_initial.sql'), 'utf8');

const TABLES = [
  'users',
  'sessions',
  'magic_links',
  'saves',
  'chore_bonus',
  'wallet',
  'energy',
  'ledger',
  'billing_events',
  'rate_limits',
  'founding_counter',
  'packs',
  'pack_progress',
  'items'
];

describe('D1 schema', () => {
  it('creates every table from the backend plan', () => {
    for (const name of TABLES) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${name} (`);
    }
  });

  it('keeps Stripe and RevenueCat idempotency in billing_events', () => {
    expect(sql).toContain("CHECK (source IN ('stripe', 'revenuecat'))");
    expect(sql).not.toContain('CREATE TABLE IF NOT EXISTS stripe_events');
  });

  it('rejects an energy balance below zero', () => {
    expect(sql).toContain('balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)');
  });
});
