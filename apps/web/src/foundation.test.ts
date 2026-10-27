import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_BUNDLE_ID, ROOM_CLEAN_THRESHOLD } from '@sweet-home-reset/shared';
import { describe, expect, it } from 'vitest';
import { HOME_ROOMS } from './rooms';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const webRoot = join(repoRoot, 'apps/web');
const pricePattern = /(?:7\.99|44\.99|34\.99)/;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.wrangler' || entry === 'coverage') continue;
    const path = join(dir, entry);
    const info = statSync(path);
    if (info.isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

describe('foundation config', () => {
  it('locks the bundle id and leaves the domain as a placeholder', () => {
    const app = readJson(join(repoRoot, 'config/app.json')) as {
      appName: string;
      publisher: string;
      bundleId: string;
      appleWebServicesId: string;
      appDomain: string;
    };
    expect(app).toEqual({
      appName: 'Sweet Home Reset',
      publisher: 'PixelVortex Games',
      bundleId: APP_BUNDLE_ID,
      appleWebServicesId: 'com.pixelvortexgames.sweethomereset.web',
      appDomain: '{APP_DOMAIN}'
    });
    const capacitor = readFileSync(join(webRoot, 'capacitor.config.ts'), 'utf8');
    expect(capacitor).toContain(APP_BUNDLE_ID);
    expect(capacitor).not.toContain('{APP_DOMAIN}');
  });

  it('keeps the clean threshold and the energy rule in tuning data', () => {
    const tuning = readJson(join(repoRoot, 'config/tuning.json')) as {
      roomCleanPercent: number;
      scrubbingCostsEnergy: boolean;
      miniTasksCostEnergy: boolean;
    };
    expect(tuning.roomCleanPercent).toBe(ROOM_CLEAN_THRESHOLD);
    expect(tuning.scrubbingCostsEnergy).toBe(false);
    expect(tuning.miniTasksCostEnergy).toBe(false);
  });

  it('keeps price literals out of the app code', () => {
    const offenders: string[] = [];
    const roots = [join(repoRoot, 'apps'), join(repoRoot, 'packages'), join(repoRoot, 'config')];
    for (const root of roots) {
      for (const file of walk(root)) {
        const rel = relative(repoRoot, file);
        if (rel === 'config/pricing.json') continue;
        if (!/\.(?:ts|tsx|js|mjs|cjs|json|css|html|toml|yml|yaml)$/.test(file)) continue;
        const text = readFileSync(file, 'utf8');
        if (pricePattern.test(text)) offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('marks the kitchen playable and the other starter rooms not built yet', () => {
    expect(HOME_ROOMS.map((room) => room.id)).toEqual(['kitchen-nook', 'living-room', 'bedroom']);
    expect(HOME_ROOMS.filter((room) => room.playable).map((room) => room.id)).toEqual(['kitchen-nook']);
    const pack = readJson(join(webRoot, 'public/packs-bundled/starter-home/1/pack.json')) as {
      rooms: { id: string }[];
    };
    for (const room of pack.rooms) {
      expect(HOME_ROOMS.find((entry) => entry.id === room.id)?.playable).toBe(true);
    }
  });
});
