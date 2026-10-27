// F1 acceptance: initial JS for each page stays under 300 KB gzipped (art and packs excluded).
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const LIMIT = 300 * 1024;
const dist = new URL('../dist/', import.meta.url).pathname;
const pages = ['index.html', 'test/index.html'];
let failed = false;
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  const scripts = [...html.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const total = [...new Set(scripts)].reduce((sum, f) => sum + gzipSync(readFileSync(join(dist, f))).length, 0);
  const ok = total <= LIMIT;
  failed ||= !ok;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${page}: ${(total / 1024).toFixed(1)} KB gzipped initial JS (limit 300 KB)`);
}
if (failed) process.exit(1);
