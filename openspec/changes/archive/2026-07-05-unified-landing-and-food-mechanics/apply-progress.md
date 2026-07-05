# Apply Progress: unified-landing-and-food-mechanics

## Baseline

- Safety net run: `ng test --watch=false --browsers=ChromeHeadless`
- Result: 2/3 passing; `App should render title` pre-existing failure (asserts removed `h1` text).

## Task Checklist

### Phase 1: Foundation

- [x] 1.1 Define `WorldConfig` interface in `src/app/libs/models/world-config.ts`.
- [x] 1.2 Add `addFoodBatch`, `removeFoodBatch`, `placeFoodAt`, and event log to `src/app/libs/factories/simulation-service.ts`.
- [x] 1.3 Update `AGENTS.md` with new component architecture.

### Phase 2: Core Components

- [x] 2.1 Create `src/app/world-config/world-config.ts`, `.html`, `.scss`, `.spec.ts` with form outputs.
- [x] 2.2 Create `src/app/landing/landing.ts`, `.html`, `.scss`, `.spec.ts` with hero and CTA.
- [x] 2.3 Create `src/app/world-view/world-view.ts`, `.html`, `.scss`, `.spec.ts` owning `SimulationService` lifecycle.

### Phase 3: Integration / Wiring

- [x] 3.1 Refactor `src/app/app.ts` and `src/app/app.html` to orchestrate `Landing`/`WorldView` via `simulationStarted` signal.
- [x] 3.2 Migrate `src/app/canvas/canvas.ts` to thin wrapper or delete after moving logic to `WorldView`.
- [x] 3.3 Update `src/app/libs/services/websocket.service.ts` to route batch food events to `WorldView`.

### Phase 4: Testing

- [x] 4.1 Add `SimulationService` tests for batch add/remove, clamped `placeFoodAt`, and event log.
- [x] 4.2 Update `src/app/app.spec.ts` to assert landing-first and world-view-after-start orchestration.
- [x] 4.3 Verify `ng test --watch=false --browsers=ChromeHeadless`, `npx tsc --noEmit`, and `npx prettier --check .`.

## TDD Cycle Evidence

| Task | Test File                                           | Layer | Safety Net | RED        | GREEN     | TRIANGULATE | REFACTOR |
| ---- | --------------------------------------------------- | ----- | ---------- | ---------- | --------- | ----------- | -------- |
| 1.2  | `src/app/libs/factories/simulation-service.spec.ts` | Unit  | ✅ 2/3     | ✅ Written | ✅ Passed | ✅ 6 cases  | ✅ Clean |
| 2.1  | `src/app/world-config/world-config.spec.ts`         | Unit  | N/A (new)  | ✅ Written | ✅ Passed | ✅ 2 cases  | ✅ Clean |
| 2.2  | `src/app/landing/landing.spec.ts`                   | Unit  | N/A (new)  | ✅ Written | ✅ Passed | ✅ 4 cases  | ✅ Clean |
| 2.3  | `src/app/world-view/world-view.spec.ts`             | Unit  | N/A (new)  | ✅ Written | ✅ Passed | ✅ 10 cases | ✅ Clean |
| 3.1  | `src/app/app.spec.ts`                               | Unit  | ✅ 2/3     | ✅ Written | ✅ Passed | ✅ 3 cases  | ✅ Clean |
| 3.2  | N/A — structural removal of `Canvas`                | —     | ✅ 2/3     | ➖ N/A     | ➖ N/A    | ➖ N/A      | ✅ Clean |
| 3.3  | Covered by `world-view.spec.ts` WS routing tests    | Unit  | N/A (new)  | ✅ Written | ✅ Passed | ✅ 2 cases  | ✅ Clean |
| 4.1  | `src/app/libs/factories/simulation-service.spec.ts` | Unit  | N/A (new)  | ✅ Written | ✅ Passed | ✅ 6 cases  | ✅ Clean |
| 4.2  | `src/app/app.spec.ts`                               | Unit  | ✅ 2/3     | ✅ Written | ✅ Passed | ✅ 3 cases  | ✅ Clean |
| 4.3  | Full suite + `tsc` + `prettier --check`             | —     | ✅ 2/3     | ➖ N/A     | ✅ Passed | ➖ N/A      | ✅ Clean |

### Test Summary

- **Total tests written**: 27 (full suite now 27 passing)
- **Total tests passing**: 27
- **Layers used**: Unit (27)
- **Approval tests** (refactoring): None — no refactoring tasks
- **Pure functions created**: `clampConfig` in `WorldConfig`; `placeFoodAt` coordinate clamping in `SimulationService`

## Verification Results

| Command                                                | Result                 |
| ------------------------------------------------------ | ---------------------- |
| `pnpm ng test --watch=false --browsers=ChromeHeadless` | ✅ 27/27 passed        |
| `npx tsc --noEmit`                                     | ✅ no errors           |
| `npx prettier --check .`                               | ✅ all files formatted |
| `pnpm ng build && cd server && npm run build`          | ✅ both builds succeed |

## Notes

- `WebSocketService` already exposed `onFoodEvent()` for `ADD_FOOD`/`REMOVE_FOOD`; no protocol change was required. WorldView subscribes and forwards to `SimulationService`.
- The old `Canvas` component and its spec were removed; logic migrated to `WorldView`.
- Prettier was run across the whole repo because the baseline had many unformatted files.
- Server dependencies were installed locally in `server/node_modules` to verify the server build; `/server/node_modules` and `/server/dist` were added to `.gitignore`.
