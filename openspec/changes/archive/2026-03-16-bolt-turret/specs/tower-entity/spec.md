## MODIFIED Requirements

### Requirement: TowerSchema supports summoned turrets
`TowerSchema` SHALL include `remainingDuration` (float32, default 0) and `ownerId` (string, default '').

When `remainingDuration` is 0, the tower is permanent (map tower). When > 0, it is a summoned turret with a limited lifetime.

#### Scenario: Map towers have default values
- **WHEN** a TowerSchema is created for a map tower
- **THEN** `remainingDuration` SHALL be 0 and `ownerId` SHALL be ''

#### Scenario: Summoned turrets have duration and owner
- **WHEN** a TowerSchema is created for a summoned turret
- **THEN** `remainingDuration` SHALL be set to the turret's duration and `ownerId` to the caster's id
