# Landing Page Specification

## Purpose

Introduce the app and move the user to configuration.

## Requirements

### Requirement: Display landing content

The landing-page MUST show hero, title, intro, and CTA.

#### Scenario: App opened

- GIVEN app loaded
- WHEN landing phase active
- THEN hero, intro, and call-to-action visible

### Requirement: Start configuration

The landing-page MUST emit a start event when call-to-action activated.

#### Scenario: Begin setup

- GIVEN landing page displayed
- WHEN user activates call-to-action
- THEN start event emitted and config panel appears

#### Scenario: Repeated activation

- GIVEN call-to-action already activated
- WHEN activated again
- THEN one start event emitted
