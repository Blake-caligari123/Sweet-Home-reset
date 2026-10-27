# Free movement + front layer: progress note

Blake asked (27 Oct 2026) to fix Puff walking through walls/furniture and not reaching some walls in the
painted burrow. Agreed fix: free (non-grid) movement on a fine nav grid traced to the painting, plus a
front layer so Puff walks *behind* tall furniture. Live game is untouched until this is merged.
If a session ends mid-way: read this, check `git log`, carry on from the first unticked step.

## Design
- **Nav grid** (`apps/web/src/town/nav.ts`): 4 world-px cells (4×4 per tile). Code-drawn areas build it
  from their tiles; painted areas from `nav.floor` / `nav.blockers` polygons (world px) in the pack.
  Puff's feet get a small clearance. A* (8 directions, no corner cutting) then line-of-sight smoothing.
- **Puff position**: feet point in world px (`fx`, `fy`); `x`/`y` stay as the tile under the feet for
  mess, doors, onboarding and saves. Taps walk to the exact point; acting walks to the nearest spot
  within reach of the target's tile or prop.
- **Front layer**: pack `occluders` (rect + base line, world px); the tool cuts each object out of the
  painting into `areas/<area>_front.webp`; the game draws those pieces above Puff when Puff's feet are
  above the base line, greyed per tile like the floor.

## Steps
- [x] 1. nav.ts with tests (grid from tiles and polygons, A*, smoothing, nearest point, multi-goal)
- [x] 2. Free movement in the game (all areas, nav from tiles); saves keep working; browser check
- [x] 3. Burrow nav polygons traced over the painting; reachability tests
- [~] 4. Front layer: **deferred to the outdoor areas.** In the burrow every object sits against a wall or is low, and
  its blocker covers its whole painted shape, so Puff can never overlap furniture from behind: no front layer
  needed there. It is needed for tree canopies and shop roofs; build it with the yard/square paintings.
- [x] 5. Docs, full test/build/size, PR, deploy (Blake approved going ahead)
