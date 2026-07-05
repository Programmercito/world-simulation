# Delta for Simulation Lifecycle

## MODIFIED Requirements

### Requirement: Lifecycle ownership and persistent configuration

The world-view (or orchestrator) MUST own SimulationService lifecycle and WebSocket subscription. The world-config-panel MUST stay visible and editable after start.

(Previously: Canvas owned lifecycle and config hidden after start.)

#### Scenario: Start world

- GIVEN valid configuration
- WHEN user starts simulation
- THEN service starts, WebSocket connects, and config panel remains visible

#### Scenario: Re-initialize

- GIVEN world running
- WHEN user resets with new configuration
- THEN old service stops, new service starts, and page does not reload

#### Scenario: Teardown

- GIVEN world-view active
- WHEN it is destroyed
- THEN loop stops and WebSocket unsubscribes
