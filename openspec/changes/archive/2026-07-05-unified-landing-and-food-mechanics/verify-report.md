# Verify Report: unified-landing-and-food-mechanics

| Field      | Value                              |
| ---------- | ---------------------------------- |
| Change     | unified-landing-and-food-mechanics |
| Project    | world-simulation                   |
| Verifier   | SDD verify executor                |
| Date       | 2026-07-05                         |
| Strict TDD | Active                             |

## Summary

All required verification commands pass. The implementation matches the proposal, design, and delta specs for the landing/config/world-view split and the food mechanics API. Tests exist for every TDD-reported task and all 27 unit tests pass. Coverage is excellent for the new UI components and acceptable for `WorldView`, but the legacy-heavy `SimulationService` and `WebSocketService` files show low overall coverage because the change only added a small surface to large existing files. A few scope-creep and triangulation gaps are noted below.

## Verification Commands

| Command                                                | Result  | Evidence                                  |
| ------------------------------------------------------ | ------- | ----------------------------------------- |
| `pnpm ng test --watch=false --browsers=ChromeHeadless` | ✅ PASS | 27/27 SUCCESS                             |
| `npx tsc --noEmit`                                     | ✅ PASS | No type errors (only npm config warnings) |
| `npx prettier --check .`                               | ✅ PASS | All matched files use Prettier style      |
| `pnpm ng build`                                        | ✅ PASS | Bundle generated in `dist/iacanvas`       |
| `cd server && npm run build`                           | ✅ PASS | `tsc` compiled with no errors             |

## TDD Compliance

| Check                         | Result | Details                                                                  |
| ----------------------------- | ------ | ------------------------------------------------------------------------ |
| TDD Evidence reported         | ✅     | Found in `apply-progress.md`                                             |
| All tasks have tests          | ✅     | 5/5 implementation tasks with test files                                 |
| RED confirmed (tests exist)   | ✅     | All reported test files exist in codebase                                |
| GREEN confirmed (tests pass)  | ✅     | All 27 tests pass on execution                                           |
| Triangulation adequate        | ⚠️     | Generally good; minor FIFO gap in event-log test (see SUGGESTION)        |
| Safety Net for modified files | ✅     | Baseline 2/3 documented; pre-existing `h1` assertion removed as expected |

**TDD Compliance**: 5/6 checks passed (1 warning, no blockers).

### TDD Cycle Evidence Cross-Check

| Task | Test File                                           | RED        | GREEN     | TRIANGULATE (reported) | TRIANGULATE (actual) |
| ---- | --------------------------------------------------- | ---------- | --------- | ---------------------- | -------------------- |
| 1.2  | `src/app/libs/factories/simulation-service.spec.ts` | ✅ Written | ✅ Passed | ✅ 6 cases             | 6 cases              |
| 2.1  | `src/app/world-config/world-config.spec.ts`         | ✅ Written | ✅ Passed | ✅ 2 cases             | 2 cases              |
| 2.2  | `src/app/landing/landing.spec.ts`                   | ✅ Written | ✅ Passed | ✅ 4 cases             | 4 cases              |
| 2.3  | `src/app/world-view/world-view.spec.ts`             | ✅ Written | ✅ Passed | ✅ 10 cases            | 11 cases             |
| 3.1  | `src/app/app.spec.ts`                               | ✅ Written | ✅ Passed | ✅ 3 cases             | 4 cases              |
| 3.3  | Covered by `world-view.spec.ts` WS routing          | ✅ Written | ✅ Passed | ✅ 2 cases             | 2 cases              |
| 4.1  | `src/app/libs/factories/simulation-service.spec.ts` | ✅ Written | ✅ Passed | ✅ 6 cases             | 6 cases              |
| 4.2  | `src/app/app.spec.ts`                               | ✅ Written | ✅ Passed | ✅ 3 cases             | 4 cases              |

## Test Layer Distribution

| Layer       | Tests  | Files | Tools           |
| ----------- | ------ | ----- | --------------- |
| Unit        | 27     | 5     | Karma + Jasmine |
| Integration | 0      | 0     | Not installed   |
| E2E         | 0      | 0     | Not installed   |
| **Total**   | **27** | **5** |                 |

All tests are unit tests using Angular `TestBed`, Karma, and Jasmine. No integration or E2E tooling is configured in the project.

## Changed File Coverage

Coverage generated with `pnpm ng test --watch=false --browsers=ChromeHeadless --code-coverage`.

| File                                           | Line % | Branch % | Uncovered Lines                                                                                                   | Rating        |
| ---------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------- | ------------- |
| `src/app/app.ts`                               | 100%   | 100%     | —                                                                                                                 | ✅ Excellent  |
| `src/app/landing/landing.ts`                   | 100%   | 100%     | —                                                                                                                 | ✅ Excellent  |
| `src/app/world-config/world-config.ts`         | 100%   | 50%      | branch-only (clamp fallbacks)                                                                                     | ✅ Excellent  |
| `src/app/world-view/world-view.ts`             | 84.37% | 66.66%   | L100-104 (handleVictory), L113 (onResize), L118-126 (interval +/-), L159-160 (canvas guard), L503 fallback branch | ⚠️ Acceptable |
| `src/app/libs/factories/simulation-service.ts` | 47.17% | 9.39%    | New food helpers covered; uncovered mass is legacy render/update/game-loop code                                   | ⚠️ Low        |
| `src/app/libs/services/websocket.service.ts`   | 2.32%  | 0%       | Only declaration of `foodEvents$` subject covered via WorldView mock                                              | ⚠️ Low        |

**Average changed file coverage (lines)**: ~72%.

The `SimulationService` and `WebSocketService` numbers look low because both files are large legacy files with only a small API surface added by this change. The new food-helper methods (`addFoodBatch`, `removeFoodBatch`, `placeFoodAt`) and `getEventLog` are exercised by dedicated tests; the remaining uncovered lines are the pre-existing render loop, AI update logic, and WebSocket connection/reconnection code.

## Assertion Quality

All test files were scanned for tautologies, ghost loops, type-only assertions, empty-collection assertions without companions, smoke-test-only cases, and implementation-detail coupling.

**Assertion quality**: ✅ All assertions verify real behavior.

No trivial assertions were found. Every test exercises production code and asserts an observable outcome (DOM content, emitted values, service method calls, or coordinate mapping).

## Quality Metrics

| Tool         | Result           | Notes                                                              |
| ------------ | ---------------- | ------------------------------------------------------------------ |
| Linter       | ➖ Not available | No linter configured in `openspec/config.yaml`                     |
| Type Checker | ✅ No errors     | `npx tsc --noEmit` passes (npm user-config warnings are unrelated) |
| Formatter    | ✅ No errors     | `npx prettier --check .` passes                                    |

## Spec Scenario Mapping

| Spec                   | Scenario                                                        | Test File                           | Test Case                                                             |
| ---------------------- | --------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `landing-page`         | App opened → hero/intro/CTA visible                             | `landing.spec.ts`                   | renders hero, title, intro, and call-to-action initially              |
| `landing-page`         | Begin setup → start event emitted, config appears               | `landing.spec.ts`                   | emits start and reveals the config panel when the CTA is activated    |
| `landing-page`         | Repeated activation → one start event                           | `landing.spec.ts`                   | emits only one start event on repeated activation                     |
| `world-config-panel`   | Edit settings → config updates                                  | `world-config.spec.ts`              | emits the current configuration when create is requested              |
| `world-config-panel`   | Invalid value → creation blocked or clamped                     | `world-config.spec.ts`              | clamps invalid dimensions and counts to safe defaults                 |
| `world-config-panel`   | Start world → create-world emitted                              | `world-config.spec.ts`              | emits the current configuration when create is requested              |
| `world-config-panel`   | Reset without reload → new create-world emitted                 | `app.spec.ts`                       | re-initializes the world view when it emits a new create-world event  |
| `world-view`           | World starts → canvas renders, stats update                     | `world-view.spec.ts`                | creates and starts the simulation service after view init             |
| `world-view`           | World-view destroyed → loop stops, WS cleanup                   | `world-view.spec.ts`                | stops the service and disconnects on destroy                          |
| `world-view`           | Batch add → addFoodBatch(10)                                    | `world-view.spec.ts`                | calls addFoodBatch when batch add buttons are clicked                 |
| `world-view`           | Click-to-drop → food at mapped world coords                     | `world-view.spec.ts`                | places food at mapped world coordinates when placement mode is active |
| `world-view`           | Event log capacity → oldest removed                             | `simulation-service.spec.ts`        | keeps the event log capped at the last entries                        |
| `food-mechanics`       | Add batch → 10 food, event logged                               | `simulation-service.spec.ts`        | adds a batch of food and logs the event                               |
| `food-mechanics`       | Remove over available → all removed, no error                   | `simulation-service.spec.ts`        | removes a batch clamped to available food and logs the event          |
| `food-mechanics`       | Place outside world → clamped to edge                           | `simulation-service.spec.ts`        | clamps placeFoodAt coordinates to world bounds                        |
| `food-mechanics`       | Logged batch → "+10 food added"                                 | `simulation-service.spec.ts`        | adds a batch of food and logs the event                               |
| `simulation-lifecycle` | Start world → service starts, WS connects, config stays visible | `world-view.spec.ts`, `app.spec.ts` | creates/starts service; app renders WorldView with embedded config    |
| `simulation-lifecycle` | Re-initialize → old stops, new starts, no reload                | `app.spec.ts`                       | re-initializes the world view when it emits a new create-world event  |
| `simulation-lifecycle` | Teardown → loop stops, WS unsubscribes                          | `world-view.spec.ts`                | stops the service and disconnects on destroy                          |

## Design Coherence

| Design Decision                                                       | Implementation                                                                                | Verdict |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- |
| Component split (Landing / WorldConfig / WorldView)                   | ✅ Implemented as standalone components; App orchestrates                                     | Pass    |
| SimulationService lifecycle in WorldView                              | ✅ Created in `ngAfterViewInit`, stopped in `ngOnDestroy`                                     | Pass    |
| Stats in DOM panels + decorative canvas HUD                           | ✅ DOM stats/civ cards/event log in WorldView; canvas HUD still rendered by SimulationService | Pass    |
| Food mechanics API (`addFoodBatch`, `removeFoodBatch`, `placeFoodAt`) | ✅ Implemented and reused by buttons, canvas clicks, and WS events                            | Pass    |
| Reuse existing batch WebSocket events                                 | ✅ `WorldView` subscribes to `onFoodEvent()` and forwards to service                          | Pass    |
| Single-page, no routing                                               | ✅ App uses conditional rendering with a signal                                               | Pass    |

## Task Completion

| Phase | Task                                                | Status                           |
| ----- | --------------------------------------------------- | -------------------------------- |
| 1.1   | Define `WorldConfig` interface                      | ✅ Complete                      |
| 1.2   | Add food helpers + event log to `SimulationService` | ✅ Complete                      |
| 1.3   | Update `AGENTS.md`                                  | ✅ Complete                      |
| 2.1   | Create `WorldConfig` component + tests              | ✅ Complete                      |
| 2.2   | Create `Landing` component + tests                  | ✅ Complete                      |
| 2.3   | Create `WorldView` component + tests                | ✅ Complete                      |
| 3.1   | Refactor `App` to orchestrate Landing/WorldView     | ✅ Complete                      |
| 3.2   | Migrate/delete `Canvas`                             | ✅ Complete (deleted)            |
| 3.3   | Update `WebSocketService` routing                   | ✅ Complete (no protocol change) |
| 4.1   | `SimulationService` food tests                      | ✅ Complete                      |
| 4.2   | Update `App` tests                                  | ✅ Complete                      |
| 4.3   | Verify test/type/format commands                    | ✅ Complete                      |

## Issues

### CRITICAL

None.

### WARNING

1. **Scope creep / large diff outside change boundary**
   - `git diff --stat` shows modifications to many files not listed in the proposal/design: `src/app/libs/factories/civilization-factory.ts`, `food-factory.ts`, `individual-factory.ts`, `world-factory.ts`, `src/app/libs/models/*.ts`, `src/app/libs/services/sound-service.ts`, `src/app/libs/services/ia/process-world.ts`, `src/index.html`, `src/main.ts`, config files, and the entire `server/` tree.
   - `simulation-service.ts` alone shows ~2,278 line changes while the file is ~1,278 lines, strongly suggesting line-ending or whole-file reformatting.
   - This makes review harder and obscures what actually changed for this feature. It does not fail verification, but it should be flagged for the orchestrator.

2. **Low coverage on modified legacy files**
   - `SimulationService` line coverage is 47.17% and `WebSocketService` is 2.32%. The new behavior is covered, but because these files were modified, the overall ratios are below the 80% guideline.
   - Note: `openspec/config.yaml` sets `coverage_threshold: 0`, so this is not a blocking failure.

3. **`WebSocketService` has no dedicated tests**
   - Task 3.3 modified `WebSocketService`, but it is only exercised through `WorldView` tests with a mocked service. The real parsing/broadcast/reconnection logic is untested.

### SUGGESTION

1. **Improve event-log triangulation**
   - `simulation-service.spec.ts` verifies the log stays capped at 5 entries but does not verify that the _oldest_ entry is removed (FIFO). Add a test that pushes distinct messages and asserts the earliest message is dropped.

2. **Cover uncovered `WorldView` interactions**
   - The following `WorldView` behaviors are implemented but not exercised by tests:
     - `increaseFoodInterval()` / `decreaseFoodInterval()`
     - `handleVictory()` (20-second auto-reset)
     - `onResize()` host listener
   - Adding tests would push `WorldView` coverage above 95%.

3. **Add dedicated `WebSocketService` unit tests**
   - Test that a raw `ADD_FOOD` / `REMOVE_FOOD` message is parsed and emitted through `onFoodEvent()`, and that malformed messages do not crash the subscriber.

4. **Investigate line-ending churn**
   - The git warnings about LF/CRLF replacement and the oversized `simulation-service.ts` diff suggest the apply phase normalized line endings across the repo. Consider committing a separate formatting-only change first in future work to keep feature diffs reviewable.

## Final Verdict

**PASS with warnings.**

The implementation satisfies the requirements of the `unified-landing-and-food-mechanics` change: the landing page, reusable config panel, world view, and batch/click-to-drop food mechanics are all implemented and covered by passing unit tests. All required verification commands pass. The main concerns are reviewability due to scope creep/line-ending churn and low coverage on large legacy files that were only lightly touched by the change. None of these are blocking under the configured coverage threshold and strict-TDD rules.
