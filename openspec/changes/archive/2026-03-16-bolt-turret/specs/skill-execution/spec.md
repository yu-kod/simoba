## MODIFIED Requirements

### Requirement: SkillExecutionContext includes towers
`SkillExecutionContext` SHALL include a `towers` field of type `MapSchema<TowerSchema>` to allow skill handlers to spawn tower-type entities (turrets).

#### Scenario: Turret handler accesses towers from context
- **WHEN** a turret effect handler is executed
- **THEN** it SHALL access `ctx.towers` to add the spawned turret entity

#### Scenario: Existing handlers unaffected
- **WHEN** a non-turret skill handler is executed
- **THEN** the `towers` field SHALL be available but not used
