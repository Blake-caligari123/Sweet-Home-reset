#!/usr/bin/env node
// Post-feature cleanup check for apps/web/src (see SKILL.md beside this file).
// Usage, from the repo root: node .claude/skills/post-feature-cleanup/check.mjs [--all]
// Reports: oversized files, orphaned files, exports nothing else uses, debug leftovers, `any`,
// and CSS classes no code uses.
// It only reports; deciding what to change is the review's job. Exit code 1 if anything is flagged
// as a problem (not just a note), so it can gate a PR.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'apps/web/src');
const LIMITS = { note: 400, problem: 600 }; // lines, non-test source files
// The original room game is frozen (docs/ARCHITECTURE.md): its size is noted, never a problem.
const FROZEN = (f) => f.startsWith('room/');
// Entries and files loaded by tooling rather than imported.
const ENTRIES = ['town/main.ts', 'room/main.ts', 'vite-env.d.ts', 'shared/pwa-config.ts'];

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(ts|css)$/.test(f) ? [p] : [];
});
const files = walk(ROOT);
const src = files.filter((f) => f.endsWith('.ts'));
const text = new Map(src.map((f) => [f, readFileSync(f, 'utf8')]));
const rel = (f) => relative(ROOT, f);
const isTest = (f) => /\.test\.ts$|test-pack\.ts$/.test(f);

const problems = []; const notes = [];

// 1. Size.
for (const f of src.filter((x) => !isTest(x))) {
  const n = text.get(f).split('\n').length;
  if (n > LIMITS.problem && !FROZEN(rel(f))) problems.push(`size: ${rel(f)} is ${n} lines (over ${LIMITS.problem}): split it by responsibility`);
  else if (n > LIMITS.note) notes.push(`size: ${rel(f)} is ${n} lines (over ${LIMITS.note}): watch it, plan the next split`);
}

// 2. Orphans: files nothing imports (tests and entries aside).
const importRe = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
const imported = new Set();
for (const [f, t] of text) for (const m of t.matchAll(importRe)) {
  const base = resolve(dirname(f), m[1]);
  for (const c of [base, `${base}.ts`, join(base, 'index.ts')]) imported.add(c);
}
for (const f of files) {
  if (isTest(f) || ENTRIES.includes(rel(f)) || imported.has(f)) continue;
  problems.push(`orphan: ${rel(f)} is not imported anywhere: delete it or wire it in`);
}

// 3. Exports nothing else uses.
const exportRe = /^export\s+(?:async\s+)?(function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;
const others = (f) => [...text.entries()].filter(([g]) => g !== f);
for (const [f, t] of text) {
  if (isTest(f)) continue;
  for (const m of t.matchAll(exportRe)) {
    const kind = m[1]; const name = m[2]; const word = new RegExp(`\\b${name}\\b`);
    const usedElsewhere = others(f).some(([, u]) => word.test(u));
    if (usedElsewhere) continue;
    const usedHere = (t.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length > 1;
    // Exported types document a module's shape; only values used nowhere else are worth a note.
    if (usedHere) { if (kind !== 'interface' && kind !== 'type') notes.push(`export: ${name} in ${rel(f)} is only used in its own file: drop \`export\` unless it's public on purpose`); }
    else problems.push(`dead: ${name} in ${rel(f)} is never used: remove it`);
  }
}

// 4. Leftovers and loose types.
for (const [f, t] of text) {
  // Look at code only: strings and comments can say "any" or "TODO" in plain words.
  const codeOnly = (l) => (/^\s*(\/\*|\*)/.test(l) ? '' : l.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""').replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, ''));
  t.split('\n').forEach((raw, i) => {
    const line = codeOnly(raw);
    const at = `${rel(f)}:${i + 1}`;
    if (/\bconsole\.(log|debug)\(|\bdebugger\b/.test(line)) problems.push(`leftover: ${at}: ${raw.trim()}`);
    if (/\b(TODO|FIXME|XXX|HACK)\b/.test(raw)) notes.push(`todo: ${at}: ${raw.trim()}`);
    if (!isTest(f) && /:\s*any\b|as any\b|<any>/.test(line) && !/eslint-disable/.test(t.split('\n')[i - 1] ?? '')) problems.push(`any: ${at}: give it a real type`);
  });
}

// 5. CSS classes no code uses any more (in the town and shared stylesheets).
const allCode = [...text.values()].join('\n') + readFileSync(resolve(ROOT, '../index.html'), 'utf8') + readFileSync(resolve(ROOT, '../test/index.html'), 'utf8');
for (const css of files.filter((f) => f.endsWith('.css'))) {
  const classes = new Set([...readFileSync(css, 'utf8').matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]));
  for (const c of classes) if (!new RegExp(`['"\` ]${c}['"\` ]|class(Name)?=["'][^"']*\\b${c}\\b|classList\\.\\w+\\([^)]*['"]${c}['"]`).test(allCode) && !allCode.includes(c)) notes.push(`css: .${c} in ${rel(css)} is not used by any code: remove it`);
}

const show = (title, list) => { if (list.length) console.log(`\n${title} (${list.length})\n${list.map((l) => `  - ${l}`).join('\n')}`); };
show('Problems', problems);
show('Notes', notes);
if (!problems.length && !notes.length) console.log('Clean: nothing flagged.');
process.exit(problems.length ? 1 : 0);
