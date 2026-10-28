---
name: factorisation-and-organisation
description: Factorisation and Organisation. Plan where new code goes before writing it, so no file grows messy, tangled or longer than it needs to be. Use at the start of every feature, milestone step, area, system or sizeable fix in Sweet Home Reset (before writing code), whenever a new file is being added, and whenever a file is getting long (over 400 lines) or doing more than one job.
---

# Factorisation and Organisation

Build things in clean, deliberate pieces, planned ahead, so the game stays easy to work on as it grows (6 neighbours, 4 seasons, many areas and shops). Every new feature gets a **file plan** before any code is written.

Read `docs/ARCHITECTURE.md` first. It is the map this skill keeps true.

## 1. Write a file plan first (before any code)

Write it in your working notes, and in the PR when the feature lands:

```
Feature: <name>
Rules (pure, tested):  town/<feature>/<rules>.ts + .test.ts: <one sentence of what it decides>
UI:                    town/<feature>/<ui>.ts: <class or function>, host: <the few things it needs from the game>
Content:               pack.json: <new fields>; strings['en-AU']: <new text ids>; tuning.json: <new numbers>
Wiring in game.ts:     <the 2–5 lines that construct it and call it: taps, the loop, the day>
Files that grow:       <file>: now N lines, +M expected
Splits needed first:   <none / which file, and how>
```

If a line of that plan can't be written in one sentence without "and", the piece is doing too much. Split it.

## 2. Budgets (checked by the post-feature-cleanup script)

| Thing | Aim | Hard limit | When over |
|---|---|---|---|
| Source file | ≤ 300 lines | 600 (a note from 400) | Split by responsibility *before* adding more |
| Function or method | ≤ 40 lines | ~60 | Pull out named steps |
| Class | one job, ≤ ~15 methods | | Split into a rules module plus a UI class |
| Parameters | ≤ 4 | | Pass a small options or host object |
| Nesting | ≤ 3 levels | | Return early, or pull out a helper |

Forward planning: if this milestone will push a file past 400 lines, split it **now**, while it's small and the seams are obvious. Don't wait until it hurts. `town/game.ts` is the coordinator: it may only *wire* features together. New behaviour never goes in it.

## 3. Where things go (this project)

- **Rules** (decisions, maths, state changes): a pure module in the feature folder (`town/neighbours/talk.ts`, `town/shops/shops.ts`). No DOM, no Pixi. Tested beside it (`*.test.ts`), tests first.
- **Feature UI** (sheets, dialogs, flows): one class or function per feature. It receives a small **host interface** listing exactly what it needs (`ConversationHost`, `JobsHost`, `ShopHost`) and never reaches into `TownGame`.
- **Saved progress**: a field on `TownState` (`town/state.ts`) plus `TownSave` (`data/save.ts`), with a migration if old saves need a value, and `toSave()` / `load()` in `state.ts`.
- **Screen chrome**: through `View` (`ask`, `sheet`, `banner`, `say`, `feedback`). Never manage the busy hold by hand outside `View`.
- **Content is data**: areas, mess, neighbours, routines, dialogue, scenes, requests, shops, items and pickups go in the pack (`public/packs-bundled/hollowfern/1/pack.json`), validated in `data/area.ts`, with a pack test.
  - Player-facing text goes in `strings['en-AU']` with ids; logic uses ids, never names.
  - Every gameplay number goes in `claude/config/tuning.json`. Never hard-code.
- **Drawing**: `world/`. Code-drawn placeholders go in `world/art/` by subject (`ground`, `props`, `items`, `characters`) until art lands.
- **Shared code** (`src/shared/`) only if both the town and room games use it. `src/room/` is frozen: no new features.
- **A new feature folder** when a feature has rules plus UI plus content (`town/shops/` is the model). Small helpers live with the feature that owns them, not in a grab-bag `utils`.

## 4. Clever, but readable

- **Prefer data over code paths.** If something will have many variants (neighbours, shops, mess types, areas), make it a table or pack entry read by one small engine, not a growing `switch`.
- **Duplication:** the rule of three. Don't abstract on the first or second copy. On the third, pull out a well-named helper.
- **No frameworks inside the game:** plain functions, small classes, explicit wiring.
- **Name things after what they mean in the game** (`stockToday`, `heartsOf`, `freshMess`), not how they work.
- **Comments say why,** in the project's voice: short, plain English, a doc comment on anything exported.
- **Pick the simplest thing that fits the next milestone too.** Check the GDD (`claude/GAME-DESIGN.md`) and `claude/M2-PLAN.md` for what's coming, so today's shape doesn't need tearing up next week.

## 5. Splitting an existing file safely

1. Find the seams: the groups of methods and fields that change together, each describable in one sentence.
2. Move one group at a time into its new file, with a host interface for what it needs. Keep behaviour identical.
3. Update every import, then run `npx tsc --noEmit`, `npm run lint`, `npm test` and the browser playthroughs for the moved code. Any behaviour change belongs in a separate commit.
4. Update the folder map in `docs/ARCHITECTURE.md`.

## 6. Before writing code: quick checklist

- [ ] File plan written; every piece has one job.
- [ ] Nothing new goes into `game.ts` except wiring.
- [ ] No file in the plan will pass 400 lines this milestone, or its split is planned first.
- [ ] Content in the pack, text in strings, numbers in tuning.
- [ ] Tests planned for the rules module.

When the feature is built, run the **post-feature-cleanup** skill before committing.
