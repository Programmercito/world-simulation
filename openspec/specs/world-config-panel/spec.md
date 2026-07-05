# World Config Panel Specification

## Purpose

Collect world settings and trigger world creation or reset.

## Requirements

### Requirement: Config form

panel MUST expose width, height, initial food, civilizations, individuals, and spawn interval.

#### Scenario: Edit settings

- GIVEN panel visible
- WHEN user changes value
- THEN configuration updates

#### Scenario: Invalid value

- GIVEN non-positive count or dimension
- WHEN creation requested
- THEN creation blocked or value clamped

### Requirement: Create or reset world

panel MUST emit a create-world event with current settings.

#### Scenario: Start world

- GIVEN valid settings
- WHEN user confirms creation
- THEN create-world event emitted

#### Scenario: Reset without reload

- GIVEN world running
- WHEN user resets with new settings
- THEN new create-world event emitted without page reload
