# Tasks: Unified Landing and Food Mechanics

## Review Workload Forecast

| Field                   | Value                         |
| ----------------------- | ----------------------------- |
| Estimated changed lines | ~900–1100                     |
| Provided review budget  | 800                           |
| 400-line budget risk    | High                          |
| Chained PRs recommended | Yes                           |
| Suggested split         | Single PR with size:exception |
| Delivery strategy       | single-pr                     |
| Chain strategy          | size-exception                |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                         | Likely PR | Notes                              |
| ---- | -------------------------------------------- | --------- | ---------------------------------- |
| 1    | Foundation: food API, config interface, docs | PR 1      | Base for all UI; includes tests    |
| 2    | Landing + WorldConfig components             | PR 1      | Config form reusable in both views |
| 3    | WorldView + App orchestration                | PR 1      | Lifecycle, controls, event log     |

## Phase 1: Foundation

- [ ] 1.1 Define `WorldConfig` interface in `src/app/libs/models/world-config.ts`.
- [ ] 1.2 Add `addFoodBatch`, `removeFoodBatch`, `placeFoodAt`, and event log to `src/app/libs/factories/simulation-service.ts`.
- [ ] 1.3 Update `AGENTS.md` with new component architecture.

## Phase 2: Core Components

- [ ] 2.1 Create `src/app/world-config/world-config.ts`, `.html`, `.scss`, `.spec.ts` with form outputs.
- [ ] 2.2 Create `src/app/landing/landing.ts`, `.html`, `.scss`, `.spec.ts` with hero and CTA.
- [ ] 2.3 Create `src/app/world-view/world-view.ts`, `.html`, `.scss`, `.spec.ts` owning `SimulationService` lifecycle.

## Phase 3: Integration / Wiring

- [ ] 3.1 Refactor `src/app/app.ts` and `src/app/app.html` to orchestrate `Landing`/`WorldView` via `simulationStarted` signal.
- [ ] 3.2 Migrate `src/app/canvas/canvas.ts` to thin wrapper or delete after moving logic to `WorldView`.
- [ ] 3.3 Update `src/app/libs/services/websocket.service.ts` to route batch food events to `WorldView`.

## Phase 4: Testing

- [ ] 4.1 Add `SimulationService` tests for batch add/remove, clamped `placeFoodAt`, and event log.
- [ ] 4.2 Update `src/app/app.spec.ts` to assert landing-first and world-view-after-start orchestration.
- [ ] 4.3 Verify `ng test --watch=false --browsers=ChromeHeadless`, `npx tsc --noEmit`, and `npx prettier --check .`.
