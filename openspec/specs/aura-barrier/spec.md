## ADDED Requirements

### Requirement: Barrier skill definition
The system SHALL register `aura-barrier` in `SKILL_DEFINITIONS` with `targeting: 'point'`, `effectType: 'zone'`, `cooldown: 14`, `range: 500`, `zoneRadius: 180`, `zoneDuration: 4`.

#### Scenario: Skill definition is registered
- **WHEN** `getSkillDefinition('aura-barrier')` is called
- **THEN** it SHALL return a valid `SkillDefinition` with `effectType: 'zone'`, `cooldown: 14`, `zoneRadius: 180`, `zoneDuration: 4`

### Requirement: Barrier creates a fixed zone at target position
When an AURA hero activates `aura-barrier`, the server SHALL create a zone at the target position. The zone SHALL NOT follow the caster.

#### Scenario: Zone is created at target position
- **WHEN** an AURA hero activates `aura-barrier` targeting position (600, 400)
- **THEN** a zone SHALL be created with `x: 600`, `y: 400`, `radius: 180`, `remainingDuration: 4`, and `followHeroId: ''`

### Requirement: Barrier applies damage reduction to allies in radius
The zone SHALL apply a `damageReduction` status effect with `value: 0.30` to all ally heroes within its radius. The effect SHALL refresh while in range and expire shortly after leaving.

#### Scenario: Ally receives damage reduction
- **WHEN** an ally hero is within 180px of the Barrier zone center
- **THEN** the ally SHALL have a `damageReduction` status effect with `value: 0.30`

#### Scenario: Enemies are not affected
- **WHEN** an enemy hero is within the Barrier zone radius
- **THEN** the enemy SHALL NOT receive any status effect from the zone

#### Scenario: Effect expires after leaving zone
- **WHEN** an ally hero moves outside the zone radius
- **THEN** the `damageReduction` effect SHALL expire within `ZONE_EFFECT_DURATION` (0.1s)

### Requirement: Barrier cooldown
After successful activation, the skill's cooldown SHALL be set to 14 seconds.

#### Scenario: Cooldown is applied after activation
- **WHEN** `aura-barrier` is successfully activated on slot Q
- **THEN** the caster's `cooldownQ` SHALL be set to 14

### Requirement: Barrier is blocked during dash
Barrier activation SHALL be rejected if the caster is currently dashing.

#### Scenario: Activation rejected while dashing
- **WHEN** a hero with `dashTimer > 0` attempts to activate `aura-barrier`
- **THEN** the activation SHALL return null and no zone SHALL be created

### Requirement: Barrier zone visual
The client SHALL render the Barrier zone with a green-cyan color scheme in `ZONE_VISUALS`. The zone SHALL be visible to all players.

#### Scenario: Zone is visible to all players
- **WHEN** a Barrier zone is active
- **THEN** both ally and enemy players SHALL see the zone rendered as a filled circle with border

### Requirement: Barrier zone expires after duration
The zone SHALL be removed after its duration expires (4 seconds).

#### Scenario: Zone removed after duration
- **WHEN** 4 seconds have elapsed since Barrier was placed
- **THEN** the zone SHALL be removed
