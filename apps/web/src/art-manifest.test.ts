import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const artRoot = join(dirname(fileURLToPath(import.meta.url)), '../public/art');

interface AssetEntry {
  path: string;
  size: string;
  transparency: boolean;
  status: string;
  placeholder: boolean;
}

function pngsIn(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) pngsIn(path, found);
    else if (entry.endsWith('.png')) found.push(relative(artRoot, path));
  }
  return found;
}

describe('art manifest', () => {
  const manifest = JSON.parse(readFileSync(join(artRoot, 'manifest.json'), 'utf8')) as { assets: AssetEntry[] };

  it('lists the 96 named assets as missing real art', () => {
    expect(manifest.assets).toHaveLength(96);
    expect(manifest.assets[0]?.path).toBe('puff/puff_model_sheet.png');
    expect(manifest.assets[14]?.path).toBe('rooms/kitchen_nook_clean.png');
    expect(manifest.assets[95]?.path).toBe('share/share_bg_photo_mode.png');

    const paths = new Set<string>();
    for (const asset of manifest.assets) {
      expect(asset.status).toBe('missing');
      expect(asset.placeholder).toBe(true);
      expect(asset.size).toMatch(/^\d+x\d+$/);
      expect(typeof asset.transparency).toBe('boolean');
      expect(paths.has(asset.path)).toBe(false);
      paths.add(asset.path);
      const bytes = readFileSync(join(artRoot, asset.path));
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(bytes.toString('latin1')).toContain('PLACEHOLDER');
    }

    expect(pngsIn(artRoot).sort()).toEqual([...paths].sort());
  });
});
