# Architecture

Sweet Home Reset is a local-first monorepo. `apps/web` owns rendering and the DOM shell. `apps/api` owns server-authoritative account, entitlement, save, and ledger operations. `packages/shared` contains types that must agree on both sides.

The web app boots into a placeholder home scene and can open the code-drawn kitchen nook. That kitchen is a spot-grid prototype, not the RenderTexture scrub in `docs/FRONTEND-PLAN.md` F5. Real pictures are named in `docs/ASSET-PROMPTS.md` and listed in `apps/web/public/art/manifest.json`. Until a file's manifest status is `ready`, the game draws with code.

One Pixi application hosts one scene at a time. Pack JSON will supply room layers, dirt masks, tasks, decor, and chore suggestions. The renderer must interpret a whitelisted shape vocabulary and never evaluate pack code. The bundled starter file is still a stub.

The local save is authoritative while offline. The kitchen currently stores cleaned spot indexes. The shared `SaveBlob` is the shape sync will use. After sign-in, merge by taking the highest room progress and unioning owned cosmetic ids. Currency and paid entitlement stay server-authoritative.

Capacitor wraps the same web build. The bundle id is `com.pixelvortexgames.sweethomereset`. Native `ios/` and `android/` projects are not generated yet. The deep-link domain stays the placeholder in `config/app.json`.

The Worker exposes `GET /api/health`. `apps/api/migrations/0001_initial.sql` is the D1 schema from `docs/BACKEND-PLAN.md`. Routes after health are not implemented.

## Where the plans go next

1. Scene lifecycle, pack schema, and the real scrub reveal.
2. Workers test pool against the migration, then auth, save, and the chore ledger.
3. Optional sync, the pack catalogue, and the screens around the kitchen.
4. Capacitor platform projects and billing only after Blake approves the accounts.
