## ADDED Requirements

### Requirement: Zone visual definition registry
The system SHALL provide a `ZONE_VISUALS` registry that maps skillId to visual definition (color, alpha, border style). New zone skills SHALL be added by appending an entry to this registry without modifying renderer code.

#### Scenario: Slow Field visual lookup
- **WHEN** a zone with skillId `aura-slow-field` is rendered
- **THEN** the renderer SHALL use the visual definition registered for `aura-slow-field` (purple tone)

#### Scenario: Bolt Trap visual lookup
- **WHEN** a zone with skillId `bolt-trap` is rendered
- **THEN** the renderer SHALL use the visual definition registered for `bolt-trap` (yellow tone)

#### Scenario: Unknown skillId fallback
- **WHEN** a zone has a skillId not found in the registry
- **THEN** the renderer SHALL use a default fallback visual (gray) instead of crashing

### Requirement: Zone state synchronization
The system SHALL synchronize zone state from server to client via Colyseus onAdd/onRemove callbacks on `GameRoomState.zones`.

#### Scenario: Zone created on server
- **WHEN** the server adds a zone to `GameRoomState.zones`
- **THEN** the client SHALL receive the zone state and begin rendering it in the same frame or next frame

#### Scenario: Zone removed on server
- **WHEN** the server removes a zone from `GameRoomState.zones`
- **THEN** the client SHALL stop rendering the zone immediately

### Requirement: Zone circle rendering
The system SHALL render each active zone as a filled semi-transparent circle at the zone's (x, y) position with the zone's radius. The fill color and alpha SHALL be determined by the zone's skillId via the visual registry.

#### Scenario: Persistent zone rendering
- **WHEN** a slow-field zone (radius 200) exists at position (300, 100)
- **THEN** the renderer SHALL draw a filled circle at (300, 100) with radius 200, using the slow-field's registered color and alpha

#### Scenario: Trap zone rendering
- **WHEN** a bolt-trap zone (radius 80) exists at position (400, 200)
- **THEN** the renderer SHALL draw a filled circle at (400, 200) with radius 80, using the trap's registered color and alpha

### Requirement: Zone rendering depth
The system SHALL render zones below heroes and projectiles but above the ground layer, ensuring zones do not obscure gameplay-critical entities.

#### Scenario: Zone depth ordering
- **WHEN** a zone and a hero overlap at the same position
- **THEN** the hero SHALL be rendered on top of the zone

### Requirement: GameMode zone callback interface
The `GameMode` interface SHALL expose `onServerZoneAdd` and `onServerZoneRemove` callbacks so that `GameScene` can react to zone lifecycle events.

#### Scenario: GameScene subscribes to zone events
- **WHEN** GameScene calls `gameMode.onServerZoneAdd(callback)`
- **THEN** the callback SHALL be invoked with a `ServerZoneState` object whenever a zone is added

#### Scenario: GameScene unsubscribes on dispose
- **WHEN** the game mode is disposed
- **THEN** all zone listeners SHALL be cleaned up
