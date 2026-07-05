# Project-level Agent Guide — world-simulation / iacanvas

This guide helps OpenCode agents work effectively on the iacanvas project.

## Project at a glance

| Area                    | Technology                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Frontend                | Angular 20, TypeScript 5.9, SCSS, standalone components, signals                                  |
| State / communication   | RxJS for WebSocket events; component state via plain fields and Angular signals where appropriate |
| Build / package manager | pnpm workspace (root `package.json` + `pnpm-workspace.yaml`)                                      |
| Backend                 | Node.js, Express, `ws`, ts-node (in `server/`, managed with npm)                                  |
| Tests                   | Karma + Jasmine for Angular unit tests; backend has no test runner yet                            |
| Formatting              | Prettier configured in root `package.json`                                                        |

## Architecture

- The Angular app bootstraps as a standalone application (`src/main.ts`).
- `App` is the single-page orchestrator: it renders `Landing` before the first start and `WorldView` afterwards.
- `Landing` shows the hero, intro, and a large `WorldConfig` form.
- `WorldConfig` is a reusable configuration panel used by both `Landing` and `WorldView`.
- `WorldView` owns the simulation lifecycle: it queries the canvas element, instantiates `SimulationService`, starts the loop, and tears it down on destroy.
- `Canvas` is removed; its logic has migrated to `WorldView`.
- `SimulationService` drives the world loop (`requestAnimationFrame`), renders to a `<canvas>`, and exposes `onStats` / `onVictory` callbacks plus food helpers (`addFoodBatch`, `removeFoodBatch`, `placeFoodAt`).
- `WorldFactory`, `CivilizationFactory`, `IndividualFactory`, and `FoodFactory` build the initial state.
- `ProcessWorld` implements individual AI logic.
- `WebSocketService` connects to `ws://localhost:3000` and translates `ADD_FOOD` / `REMOVE_FOOD` events into `SimulationService` batch actions.
- The Express server (`server/src/server.ts`) exposes `/api/food/add/:quantity` and `/api/food/remove/:quantity`, which broadcast food events to all connected WebSocket clients.

## Conventions to preserve

- Use **standalone components**; avoid `NgModule` unless there is a strong reason.
- Prefer **signals** for reactive UI state, but keep the existing imperative simulation code intact unless refactoring is part of the task.
- Keep styles **component-scoped** (`styleUrl`). Global styles live in `src/styles.scss` (currently minimal).
- Use `crypto.randomUUID()` for entity IDs.
- Follow the existing factory pattern for new world entities.
- Spanish is acceptable in existing UI copy and comments; new UI copy and comments should match the surrounding context.

## Testing requirements

- **Strict TDD is enabled** for the client. Add or update Karma + Jasmine tests for any component, service, or model change.
- Run client tests with: `ng test --watch=false --browsers=ChromeHeadless`
- The backend currently has no test runner. If you change backend logic, add a test runner and tests before claiming the work is done.
- Existing tests live next to the files they cover (`.spec.ts`). Keep them green.

## Common commands

```bash
# Install frontend dependencies
pnpm install

# Run the Angular dev server
pnpm ng serve

# Run client tests
pnpm ng test --watch=false --browsers=ChromeHeadless

# Run the backend
pnpm run server

# Run frontend + backend together
pnpm run dev:all
```

## Important files

| File                                           | Purpose                                           |
| ---------------------------------------------- | ------------------------------------------------- |
| `openspec/config.yaml`                         | SDD configuration, test commands, and constraints |
| `src/app/app.ts`                               | Single-page orchestrator for landing/world view   |
| `src/app/landing/landing.ts`                   | Hero, intro, and call-to-action landing page      |
| `src/app/world-config/world-config.ts`         | Reusable world configuration form                 |
| `src/app/world-view/world-view.ts`             | Canvas, stats, food controls, and event log       |
| `src/app/libs/factories/simulation-service.ts` | Simulation engine and render loop                 |
| `src/app/libs/services/websocket.service.ts`   | Client WebSocket wrapper                          |
| `server/src/server.ts`                         | Express + WebSocket HTTP server                   |
| `server/src/websocket-manager.ts`              | WebSocket client management and broadcast         |

## When making changes

1. Read `openspec/config.yaml` and the relevant `openspec/changes/*/exploration.md` first.
2. Follow existing code patterns; do not introduce new abstractions unless the change genuinely needs them.
3. Keep the UI on a **single page** unless routing is explicitly requested.
4. Any food-related feature should consider both the local `+ Agregar Comida` flow and the remote WebSocket `/api/food/add/:quantity` flow.
5. Update tests alongside implementation.
6. Run `ng test` and `npx prettier --check .` before finishing.
