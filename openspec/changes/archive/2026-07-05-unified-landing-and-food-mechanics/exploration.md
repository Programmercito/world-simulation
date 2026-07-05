# Exploration: unified-landing-and-food-mechanics

## Quick summary

Unify the current configuration form and the running simulation into a polished single-page experience, add a real landing state, and improve how food is added to the world. The world-creation controls must remain reachable after the simulation starts so a new world can be initialized at any time without leaving the page.

## Requirements

1. Create a project-level `AGENTS.md` for OpenCode agents.
2. Add a landing view that presents the world/simulation and its initialization.
3. The landing must lead to initialization and then to the world view; initialization controls must be above the world view on the same page, always accessible.
4. Keep everything on a single page; make it visually appealing.
5. Improve the way food is given to the simulation.

## Current state

### Frontend (`src/app`)

| Concern           | What exists now                                                                                                                                        | Where                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Bootstrapping     | Standalone `App` component renders `<app-canvas>` directly; router has no routes.                                                                      | `src/main.ts`, `src/app/app.ts`, `src/app/app.routes.ts` |
| Landing / init    | The `Canvas` component conditionally shows a `config-panel` (`*ngIf="!simulationStarted"`) with world-size, food, civilization, and individual inputs. | `src/app/canvas/canvas.html`, `src/app/canvas/canvas.ts` |
| World view        | Once `simulationStarted` is true, the canvas and stats panels appear; the config panel disappears.                                                     | `src/app/canvas/canvas.html`                             |
| Simulation engine | `SimulationService` owns the `requestAnimationFrame` loop, world state, and rendering.                                                                 | `src/app/libs/factories/simulation-service.ts`           |
| Factories         | `WorldFactory`, `CivilizationFactory`, `IndividualFactory`, `FoodFactory` generate initial state.                                                      | `src/app/libs/factories/*.ts`                            |
| Models            | `World`, `Civilization`, `Individual`, `Food` interfaces.                                                                                              | `src/app/libs/models/*.ts`                               |
| AI                | `ProcessWorld` updates individual state each tick.                                                                                                     | `src/app/libs/services/ia/process-world.ts`              |
| Remote food       | `WebSocketService` connects to `ws://localhost:3000` and forwards `ADD_FOOD` / `REMOVE_FOOD` events to `SimulationService`.                            | `src/app/libs/services/websocket.service.ts`             |
| Local food        | `+ Agregar Comida` button calls `SimulationService.addFood()` (single food).                                                                           | `src/app/canvas/canvas.html`                             |
| Styling           | Dark theme, component-scoped SCSS, inline canvas UI for alerts/stats.                                                                                  | `src/app/canvas/canvas.scss`                             |
| Tests             | Minimal `Canvas` spec (`should create`) and `App` spec that expects an `h1` that does not exist.                                                       | `src/app/canvas/canvas.spec.ts`, `src/app/app.spec.ts`   |

### Backend (`server/src`)

| Concern   | What exists now                                                              | Where                             |
| --------- | ---------------------------------------------------------------------------- | --------------------------------- |
| Server    | Express + WebSocket server on port 3000.                                     | `server/src/server.ts`            |
| Food API  | `GET /api/food/add/:quantity` and `GET /api/food/remove/:quantity` (1-1000). | `server/src/server.ts`            |
| Broadcast | `WebSocketManager` broadcasts events to all clients.                         | `server/src/websocket-manager.ts` |
| Types     | `FoodEvent`, `WebSocketMessage`, `ApiResponse`.                              | `server/src/types.ts`             |
| Tests     | None. `server/package.json` has no test runner or test scripts.              | `server/package.json`             |

### Notable gaps

- There is no dedicated landing view; the first thing the user sees is a plain configuration form.
- Once the simulation starts, the configuration form is gone. To create a new world, the user must wait for victory (auto-restart after 20 s) or refresh the page.
- The world canvas and stats are not shown before starting, so the "landing" does not actually display the world.
- Food can only be added one unit at a time locally, or in large remote batches via the WebSocket API. There is no local batch control, no targeted placement, and no visual feedback beyond a temporary canvas notification.
- The existing `App` test asserts an `h1` that is not rendered; it will fail once the component is exercised.

## Options considered

### Option A: Refactor `Canvas` into three sections on one page

- Keep a single `Canvas` component but always render:
  1. A hero/landing header.
  2. The configuration panel (sticky or collapsible at the top).
  3. The canvas + stats below.
- Use an `isConfigured` signal to show/hide the canvas area; allow re-initialization by editing config and clicking **Reiniciar / Nueva simulación**.

**Pros:**

- Minimal routing changes.
- Reuses all existing simulation lifecycle code.
- Initialization stays on the same page as requested.

**Cons:**

- `Canvas` remains a large component with mixed responsibilities.
- Less separation between landing, config, and world view.

### Option B: Extract `Landing`, `WorldConfig`, and `WorldView` as separate standalone components

- `App` renders `Landing` (or conditionally `WorldView`) on the single route.
- `Landing` shows intro + a `WorldConfig` form.
- `WorldView` shows the canvas + stats + a smaller floating `WorldConfig` to re-initialize.

**Pros:**

- Cleaner component boundaries.
- Easier to test each part in isolation.
- Landing can be visually richer without polluting the canvas component.

**Cons:**

- More files to touch.
- Requires passing simulation state or callbacks between components.

### Option C: Use the router with a single route and query params

- Add a route (e.g., `/world`) but keep only one route active.
- Store config in query parameters so refresh preserves settings.

**Pros:**

- Makes the URL shareable.
- Natural Angular pattern.

**Cons:**

- Violates the explicit "single page" requirement if it feels like navigation.
- Overkill for the current scope.

### Recommendation

Adopt **Option B** with a single top-level component (`App` or `WorldPage`) that orchestrates `Landing`, `WorldConfig`, and `WorldView`. This satisfies the single-page constraint, keeps initialization always accessible, and makes testing easier.

## Proposed food-mechanics improvements

| Improvement                  | Why                                                                | How                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Add food in batches locally  | One-click single food is too slow during crises.                   | Add `+1`, `+10`, `+50` buttons that call `SimulationService.addFoodBatch(n)`.                                          |
| Click-to-drop food on canvas | Lets the user target hungry areas.                                 | Add a canvas click handler that creates food at the clicked coordinates (respecting world scale if canvas is resized). |
| Food placement mode          | Avoids accidental clicks starting other actions.                   | Toggle a "Modo comida" button; cursor changes while active.                                                            |
| Remote and local parity      | The WebSocket API already supports batches; local UI should match. | Reuse `addFoodBatch` / `removeFoodBatch` for all batch operations.                                                     |
| Visual feedback              | Make donations feel satisfying without cluttering the canvas.      | Keep the temporary canvas notification but add a small toast/log panel in the DOM for accessibility and persistence.   |
| Remove food control          | Useful for testing / balancing.                                    | Add a small `-10` / `-50` control behind a collapse or only when debugging.                                            |

## Risks and concerns

- `SimulationService` is instantiated inside `Canvas.startSimulation()` and tightly coupled to a live `<canvas>` element. Moving it into a separate `WorldView` component requires careful lifecycle handling (`ngAfterViewInit`, `ngOnDestroy`).
- `App.spec.ts` currently expects an `h1` with "Hello, iacanvas"; any landing redesign must update or remove that test.
- `Canvas.spec.ts` is essentially a smoke test. Stricter TDD means adding meaningful tests for initialization, food controls, and re-initialization.
- The backend has no test runner. If food endpoints are extended (e.g., targeted placement, new event types), tests must be added first.
- Canvas sizing is currently fixed to `worldWidth` x `worldHeight`. A responsive landing may need CSS scaling, which could conflict with click-to-drop coordinate mapping.
- The canvas already draws a lot of UI text (stats, alerts, global hunger bar). Adding a DOM-based stats panel will reduce canvas clutter and improve testability.

## Suggested implementation outline

1. **Create `AGENTS.md`** (project-level guide) — done as part of this exploration.
2. **Update tests first**
   - Fix `App.spec.ts` to assert the new landing structure.
   - Expand `Canvas.spec.ts` (or its successor `WorldView.spec.ts`) to cover start/restart/food controls.
3. **Extract components**
   - `src/app/landing/landing.ts` — hero, intro, call-to-action.
   - `src/app/world-config/world-config.ts` — reusable configuration form.
   - `src/app/world-view/world-view.ts` — canvas + stats + food controls.
   - Keep `Canvas` as a thin orchestrator or rename it to `WorldPage`.
4. **Unify layout**
   - Single page: landing header → config panel → world view.
   - Config panel remains visible but collapsible; a "Nueva simulación" button resets state.
5. **Improve food mechanics**
   - Batch buttons (`+1`, `+10`, `+50`).
   - Click-to-drop mode.
   - DOM-based event log/toast panel.
6. **Backend parity**
   - Optionally add `POST /api/food/place` with `{x, y, quantity}` for remote targeted drops.
   - Add Jest/Mocha + ts-node test runner if backend changes occur.

## Verification checklist

- [ ] `AGENTS.md` exists at repo root and covers stack, architecture, conventions, and commands.
- [ ] The application renders on a single route (`/`).
- [ ] A landing view is shown before the first simulation starts.
- [ ] Configuration controls remain reachable after the simulation starts.
- [ ] A new world can be initialized without a full page reload.
- [ ] Food can be added locally in batches and by clicking on the canvas.
- [ ] Client tests pass: `ng test --watch=false --browsers=ChromeHeadless`.
- [ ] `npx prettier --check .` passes.
- [ ] If backend endpoints change, a test runner and tests exist and pass.

## Next step

Move to the `sdd-design` phase to produce component diagrams, the final component split, and the food-mechanics API contract.
