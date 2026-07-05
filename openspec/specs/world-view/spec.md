# World View Specification

## Purpose

Render the live simulation, stats, food controls, and event log.

## Requirements

### Requirement: Simulation display

The world-view MUST render canvas, live stats, and civilization cards.

#### Scenario: World starts

- GIVEN create-world event emitted
- WHEN world-view initializes
- THEN canvas renders and stats update

#### Scenario: World-view destroyed

- GIVEN simulation running
- WHEN world-view destroyed
- THEN loop stops and WebSocket cleanup runs

### Requirement: Food controls

The world-view MUST expose batch add/remove controls and click-to-drop mode.

#### Scenario: Batch add

- GIVEN simulation running
- WHEN user selects +10
- THEN addFoodBatch(10) invoked

#### Scenario: Click-to-drop

- GIVEN click-to-drop mode active
- WHEN user clicks canvas
- THEN food placed at mapped world coordinates

### Requirement: Event log

The world-view MUST display recent simulation events in DOM list.

#### Scenario: Log capacity

- GIVEN log full
- WHEN new event arrives
- THEN oldest entry removed
