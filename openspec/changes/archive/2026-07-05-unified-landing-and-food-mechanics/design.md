# Design: Unified Landing and Food Mechanics

## Technical Approach

Adopt **Option B** from exploration: split the current monolithic `Canvas` into three standalone components orchestrated by a single top-level page. `App` becomes the orchestrator, rendering `Landing` before the first start and `WorldView` afterwards. `WorldConfig` is reusable: it appears inside `Landing` for initial setup and stays reachable inside `WorldView` for re-initialization. `SimulationService` moves its construction and teardown into `WorldView` lifecycle hooks. Food mechanics are unified around a small API in `SimulationService` (`addFoodBatch`, `removeFoodBatch`, `placeFoodAt`) used by local buttons, canvas clicks, and WebSocket events.

## Architecture Decisions

### Decision: Component split

| Option                                                    | Tradeoff                                                                          | Decision   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| Single `Canvas` with sections                             | Minimal churn, but keeps mixed responsibilities                                   | Rejected   |
| Separate `Landing`, `WorldConfig`, `WorldView` (Option B) | Cleaner boundaries, easier testing, richer landing                                | **Chosen** |
| Router with query params                                  | Natural Angular pattern but feels like navigation and violates single-page intent | Rejected   |

### Decision: SimulationService lifecycle ownership

| Option                                                          | Tradeoff                                                   | Decision   |
| --------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| Keep service creation in `startSimulation()`                    | Tight coupling to button click, harder teardown            | Rejected   |
| Create in `WorldView.ngAfterViewInit`, destroy in `ngOnDestroy` | Clean lifecycle, supports re-initialization without reload | **Chosen** |

### Decision: Stats rendering

| Option                                                       | Tradeoff                                               | Decision   |
| ------------------------------------------------------------ | ------------------------------------------------------ | ---------- |
| Keep all stats drawn on canvas                               | Existing pattern, but hard to test and clutters canvas | Rejected   |
| Move primary stats to DOM panels, keep decorative canvas HUD | Better testability, less canvas clutter                | **Chosen** |

### Decision: Food mechanics API

| Option                                                            | Tradeoff                                          | Decision         |
| ----------------------------------------------------------------- | ------------------------------------------------- | ---------------- |
| Add new backend endpoint for targeted placement                   | Requires backend test runner and extends scope    | Rejected for now |
| Reuse existing batch WebSocket events and add local `placeFoodAt` | Scope-safe, parity between local and remote flows | **Chosen**       |

## Data Flow

```
User ──→ Landing ──→ WorldConfig ──┐
                                    ▼
                              App (orchestrator)
                                    │
         ┌──────────────────────────┘
         ▼
   WorldView (creates/destroys SimulationService)
         │
   ┌─────┴─────┐
   ▼           ▼
Canvas DOM   WebSocketService
   │           │
   └─────┬─────┘
         ▼
SimulationService.addFoodBatch(n)
SimulationService.removeFoodBatch(n)
SimulationService.placeFoodAt(x,y)
```

1. `App` holds `simulationStarted` signal.
2. Before start, `App` renders `Landing` containing a large `WorldConfig` form.
3. On submit, `App` flips the signal and renders `WorldView`.
4. `WorldView` queries the canvas element, instantiates `SimulationService`, and starts the loop.
5. `WorldView` subscribes to `WebSocketService.onFoodEvent()` and forwards batch events to `SimulationService`.
6. Local food buttons and canvas clicks call the same `SimulationService` food helpers.
7. `WorldView` exposes stats and event log as signals for DOM binding.
8. Re-initialization destroys `WorldView` (which stops the service), then `App` shows `Landing` again.

## File Changes

| File                                           | Action           | Description                                                                  |
| ---------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `src/app/app.ts`                               | Modify           | Orchestrates `Landing`/`WorldView`; owns `simulationStarted` signal.         |
| `src/app/app.html`                             | Modify           | Replace `<app-canvas>` with conditional landing/world view.                  |
| `src/app/app.spec.ts`                          | Modify           | Remove `h1` assertion; test orchestration state.                             |
| `src/app/landing/landing.ts`                   | Create           | Hero, intro, call-to-action; imports `WorldConfig`.                          |
| `src/app/landing/landing.html`                 | Create           | Landing layout and copy.                                                     |
| `src/app/landing/landing.scss`                 | Create           | Dark hero styling.                                                           |
| `src/app/landing/landing.spec.ts`              | Create           | Smoke + output tests.                                                        |
| `src/app/world-config/world-config.ts`         | Create           | Reusable config form with outputs.                                           |
| `src/app/world-config/world-config.html`       | Create           | Form fields extracted from current canvas.                                   |
| `src/app/world-config/world-config.scss`       | Create           | Form styling.                                                                |
| `src/app/world-config/world-config.spec.ts`    | Create           | Form binding and output tests.                                               |
| `src/app/world-view/world-view.ts`             | Create           | Canvas, stats, food controls, event log; owns `SimulationService` lifecycle. |
| `src/app/world-view/world-view.html`           | Create           | Canvas + DOM stats + food controls + event log.                              |
| `src/app/world-view/world-view.scss`           | Create           | World view layout.                                                           |
| `src/app/world-view/world-view.spec.ts`        | Create           | Lifecycle, food controls, click-to-drop tests.                               |
| `src/app/canvas/canvas.ts`                     | Modify or Delete | Thin wrapper or removed; logic migrated to `WorldView`.                      |
| `src/app/libs/factories/simulation-service.ts` | Modify           | Add `placeFoodAt(x, y)` and expose `eventLog` for DOM rendering.             |
| `src/app/libs/services/websocket.service.ts`   | Modify           | Optionally expose connection status for UI; no protocol changes.             |
| `AGENTS.md`                                    | Modify           | Finalize project guide.                                                      |

## Interfaces / Contracts

```typescript
// WorldConfig output
export interface WorldConfig {
  worldWidth: number;
  worldHeight: number;
  initialFood: number;
  initialCivilizations: number;
  initialIndividuals: number;
  foodSpawnInterval: number;
}

// SimulationService food helpers
class SimulationService {
  addFoodBatch(quantity: number): void;
  removeFoodBatch(quantity: number): void;
  placeFoodAt(x: number, y: number): void;
  setFoodSpawnInterval(seconds: number): void;
  getStats(): { population: number; food: number; seekingMate: number; tick: number };
  getCivilizations(): Array<{ name: string; color: string; population: number; kills: number }>;
  getEventLog(): Array<{ message: string; tick: number }>;
}
```

## Testing Strategy

| Layer   | What to Test                    | Approach                                                                                                                  |
| ------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Unit    | `App` orchestration             | Assert `Landing` renders initially and `WorldView` renders after start event.                                             |
| Unit    | `WorldConfig` form              | Bind inputs, emit config via output spy.                                                                                  |
| Unit    | `WorldView` lifecycle           | Mock canvas context; assert `SimulationService` is constructed in `ngAfterViewInit` and `stop()` called in `ngOnDestroy`. |
| Unit    | `WorldView` food controls       | Click batch buttons; assert `SimulationService` helpers called with correct quantities.                                   |
| Unit    | `WorldView` click-to-drop       | Simulate canvas click; assert `placeFoodAt` called with scaled world coordinates.                                         |
| Unit    | `SimulationService.placeFoodAt` | Assert food is created at the requested coordinates and event is logged.                                                  |
| Unit    | `WebSocketService`              | No behavior changes; existing food-event routing remains covered implicitly by `WorldView` tests.                         |
| Quality | Formatting / types              | `npx prettier --check .` and `npx tsc --noEmit`.                                                                          |

## Migration / Rollout

No migration required. This is a client-only refactor. Rollback is a single revert that restores `Canvas` as the all-in-one component.

## Open Questions

- None blocking.
