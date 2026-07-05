# Proposal: Unified Landing and Food Mechanics

## Intent

Replace config-first screen with a polished single-page flow: landing intro → always-visible configuration → live world view. Improve food delivery with batch controls and click-to-drop placement.

## Scope

### In Scope

- Finalize `AGENTS.md`.
- Add `landing-page`, `world-config-panel`, `world-view` components.
- Keep config above canvas and accessible after start.
- Improve food mechanics: batch add/remove, click-to-drop mode, event log.
- Add/update Karma + Jasmine tests.

### Out of Scope

- Routing or multiple pages.
- New backend endpoints; reuse existing WebSocket batch events.
- AI behavior changes.

### Assumptions

- "Visually appealing" = dark hero header, summary cards, smooth transitions.
- Re-initialization resets state without reload; click-to-drop uses world coords with no zoom/pan.
- Batch sizes are `+1`, `+10`, `+50` and `-10`, `-50`.

## Capabilities

### New Capabilities

- `landing-page`: hero, intro, call-to-action.
- `world-config-panel`: config form visible before/during simulation; create/reset.
- `world-view`: canvas, stats, food controls, event log.
- `food-mechanics`: batch add/remove, click-to-drop placement mode, DOM event log.

### Modified Capabilities

- `simulation-lifecycle`: config stays reachable after start; re-initialize without reload; lifecycle moves to orchestrator/`WorldView`.

## Approach

Use **Option B**: a single top-level page orchestrates `Landing`, `WorldConfig`, and `WorldView`. `Canvas` becomes a thin orchestrator or `WorldPage`. `SimulationService` is created/torn down inside `WorldView` via lifecycle hooks. Add `addFoodBatch`, `removeFoodBatch`, and `placeFoodAt` helpers reused by buttons, canvas clicks, and WebSocket events.

## Affected Areas

| Area                                           | Impact   | Description                             |
| ---------------------------------------------- | -------- | --------------------------------------- |
| `AGENTS.md`                                    | Modified | Project agent guide.                    |
| `src/app/app.ts`                               | Modified | Orchestrates landing/config/world view. |
| `src/app/landing/*`                            | New      | Landing + tests.                        |
| `src/app/world-config/*`                       | New      | Config form + tests.                    |
| `src/app/world-view/*`                         | New      | Canvas/stats/controls + tests.          |
| `src/app/canvas/*`                             | Modified | Becomes thin orchestrator or removed.   |
| `src/app/libs/factories/simulation-service.ts` | Modified | Batch/targeted food helpers.            |
| `src/app/libs/services/websocket.service.ts`   | Modified | Routes batch food events.               |

## Risks

| Risk                                 | Likelihood | Mitigation                                  |
| ------------------------------------ | ---------- | ------------------------------------------- |
| `SimulationService` lifecycle breaks | Med        | Pass canvas ref; teardown in `ngOnDestroy`. |
| Click-to-drop coordinate drift       | Med        | Map via `getBoundingClientRect` and scale.  |
| Existing tests fail during refactor  | High       | TDD first; update specs before DOM changes. |

## Rollback Plan

Revert the commit, restore `Canvas` as the all-in-one component, and delete the new components.

## Dependencies

None.

## Success Criteria

- [ ] Landing view renders before first start.
- [ ] Config controls stay visible and functional after start.
- [ ] New world initializes without reload.
- [ ] Batch and click-to-drop food work with an event log.
- [ ] `ng test --watch=false --browsers=ChromeHeadless` passes.
- [ ] `npx prettier --check .` passes.
