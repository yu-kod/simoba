## ADDED Requirements

### Requirement: Dodge Roll skill definition
The system SHALL define `blade-dodge` as a direction-targeting dash skill with cooldown 8s, distance 150px, duration 0.15s, damage 0, and invulnerable true.

#### Scenario: Dodge Roll activation
- **WHEN** a BLADE hero activates Dodge Roll in a direction
- **THEN** the hero SHALL dash 150px over 0.15s in that direction with 0 damage

#### Scenario: Invulnerability during Dodge Roll
- **WHEN** a hero is dashing with invulnerable frames (dashInvulnerable = true)
- **THEN** all incoming damage SHALL be ignored until the dash ends

#### Scenario: Invulnerability clears on dash end
- **WHEN** the dash timer reaches 0
- **THEN** dashInvulnerable SHALL be set to false and damage applies normally

#### Scenario: Dodge Roll cooldown
- **WHEN** Dodge Roll is activated
- **THEN** the cooldown SHALL be set to 8 seconds

### Requirement: DashEffectParams invulnerable extension
DashEffectParams SHALL support an optional `invulnerable` boolean field. When true, the dashEffectHandler sets `dashInvulnerable` on the hero.

#### Scenario: Non-invulnerable dashes unaffected
- **WHEN** a dash skill without `invulnerable: true` is activated (e.g. blade-charge, bolt-dash)
- **THEN** dashInvulnerable SHALL remain false

### Requirement: Talent tree integration
The `blade-dodge` talent node at Depth 3 already grants `blade-dodge` skill via `grant_skill`. No talent tree changes needed.
