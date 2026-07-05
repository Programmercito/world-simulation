# Food Mechanics Specification

## Purpose

Provide batch and targeted food operations with event logging.

## Requirements

### Requirement: Batch operations

SimulationService MUST expose addFoodBatch and removeFoodBatch for positive integers.

#### Scenario: Add batch

- GIVEN simulation running
- WHEN addFoodBatch(10) called
- THEN 10 food items appear and event logged

#### Scenario: Remove over available

- GIVEN 20 food items exist
- WHEN removeFoodBatch(50) called
- THEN all 20 items removed without error

### Requirement: Targeted placement

SimulationService MUST expose placeFoodAt(x, y) creating one food at world coordinates.

#### Scenario: Place outside world

- GIVEN coordinates outside bounds
- WHEN placeFoodAt called
- THEN coordinates clamped to nearest edge

### Requirement: Food event log

Each batch and placement MUST append a descriptive entry to event log.

#### Scenario: Logged batch

- GIVEN addFoodBatch(10) invoked
- THEN log contains "+10 food added"
