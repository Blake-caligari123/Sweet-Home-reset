# Architecture

Sweet Home Reset is a local-first monorepo. `apps/web` owns rendering and the DOM shell. `apps/api` owns server-authoritative account, entitlement, save, and ledger operations. `packages/shared` contains types that must agree on both sides.

The room renderer has one Pixi application and scene classes. Pack JSON supplies room layers, dirt masks, tasks, decor, and chore suggestions; the renderer interprets a safe, whitelisted shape vocabulary and never evaluates pack code.

The local save is authoritative while offline. After sign-in it is merged with the server by taking the highest room progress and unioning owned cosmetic IDs. Currency and paid entitlement remain server-authoritative.

## First milestones

1. Room scene, procedural Puff, scrub-reveal mask, bundled starter pack, and local save.
2. D1 migration harness and `GET /api/health`.
3. Optional magic-link sync, then the chore ledger and pack catalogue.
4. Add Capacitor and billing only after product-account approval.
