---
name: post-feature-cleanup
description: Post-Feature Cleanup. A code review of the work just done in Sweet Home Reset, checking it meets the project's standard. Readable, no unnecessary functions, no orphaned or dead code, no leftovers, files within budget, docs up to date. Run it automatically after finishing ANY feature, milestone step, area, bug fix or refactor, before committing or opening a PR, without waiting to be asked. Also use when asked to review, tidy or clean up code.
---

# Post-Feature Cleanup

After building something, review what was built, the way a careful reviewer would, and fix what falls short **before** it's committed. This runs every time without being asked: the work isn't done until it's clean.

Cleanup never changes behaviour. If a fix needs a behaviour change, make it a separate, named change (with tests) or raise it with Blake.

## 1. Run the checker

From the repo root:

```sh
node .claude/skills/post-feature-cleanup/check.mjs
```

It scans `apps/web/src` and reports:
- **Problems** (exit code 1). Fix all of them:
  - files over 600 lines (the frozen `room/` game is exempt);
  - files nothing imports (orphans);
  - exports never used anywhere (dead code);
  - `console.log` / `debugger` left in;
  - loose `any` types.
- **Notes.** Triage each one, and fix it if it's in code you touched:
  - files over 400 lines (plan the split with the factorisation-and-organisation skill);
  - exports only used in their own file (drop `export`);
  - TODOs;
  - CSS classes nothing uses.

Pre-existing notes in untouched code can wait. Don't widen the change to chase them, but list them in the report.

## 2. Review your own diff

```sh
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

Read every changed line as a reviewer would, against this standard.

**Structure** (see `docs/ARCHITECTURE.md`)
- [ ] Rules live in pure, tested modules; UI in a feature class or function with a host interface; `game.ts` only wires.
- [ ] Each new file has one job you can say in one sentence. No file grew past budget.
- [ ] Saved state goes through `TownState`, `TownSave`, a migration if needed, and `toSave()` / `load()`.

**No unnecessary code**
- [ ] No functions called once that just wrap one line. Inline them.
- [ ] No near-duplicate blocks. Three or more copies become a helper; two can stay.
- [ ] No unused parameters, fields, imports, CSS classes, pack fields, string ids, items or debug hooks.
- [ ] No orphans left from replaced code: stand-ins, temporary schedules, old fields, commented-out code.
- [ ] No defensive checks for things that can't happen. Do validate at the edges (pack, save, user input).

**Readable**
- [ ] Names say what they mean in the game. Comments say why, in plain English, matching the surrounding density.
- [ ] Functions ≤ ~40 lines, nesting ≤ 3, early returns over deep `if`s.
- [ ] Types are precise: no `any`, and no `!` where a check reads better.

**Project rules** (CLAUDE.md)
- [ ] Gameplay numbers in `claude/config/tuning.json`; player text in `strings['en-AU']` (60 characters max for dialogue).
- [ ] Copy is a kind friend: no "failed", "lost" or "overdue", and no body or appearance talk. The talk test's banned list covers pack strings; check UI strings by eye.
- [ ] Tests sit beside the code and test behaviour, including the edge that bit us: out-of-order play, save and load, unreachable spots.
- [ ] Pack changes are validated, and the pack tests cover reachability of new doors, mess, props, stops and pickups.

## 3. Prove it still works

From `apps/web`:

```sh
npx tsc --noEmit && npm run lint && npm test && npm run build && npm run size
```

Then play the feature in the browser at 390×844 (Playwright with the `?debug` hooks), plus the random-tap monkey test if input, dialogs or areas changed. Clean console required.

**Feature tour (Blake: always).** Every new player-facing feature gets a card in `apps/web/src/town/tour/tour.ts`: a title, 1–3 steps saying what to try, and a `setup` that jumps to the right day, time and place and gives what's needed. Click its Try it button in the browser and check the feature shows itself there.

## 4. Keep the docs true

- New or moved files: the folder map in `docs/ARCHITECTURE.md`.
- Milestone work: tick and note in `claude/M2-PLAN.md` (or that milestone's plan).
- New player text: `claude/DIALOGUE-REVIEW.md` for Blake's review.
- Changed conventions or layout: `CLAUDE.md`.

## 5. Report

Add a short **Cleanup** section to the PR (and summarise it in plain words to Blake):

```
Cleanup: checker <clean / N fixed>; removed <dead code>; split <file> (<before> → <after> lines);
left for later: <notes in untouched code>.
```
