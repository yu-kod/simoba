## ADDED Requirements

### Requirement: Sanctuary skill definition
The system SHALL register `aura-sanctuary` in `SKILL_DEFINITIONS` with `targeting: 'self'`, `effectType: 'zone'`, `cooldown: 20`, `zoneRadius: 160`, `zoneDuration: 5`, `tickHeal: 15`, `tickInterval: 1.0`, and `followCaster: true`.

#### Scenario: Skill definition is registered
- **WHEN** `getSkillDefinition('aura-sanctuary')` is called
- **THEN** it SHALL return a valid `SkillDefinition` with `effectType: 'zone'`, `cooldown: 20`, `zoneRadius: 160`, `zoneDuration: 5`

### Requirement: Sanctuary creates a follow zone on activation
When an AURA hero activates `aura-sanctuary`, the server SHALL create a zone centered on the caster's position with `followHeroId` set to the caster's session ID. The zone SHALL move with the caster each tick.

#### Scenario: Zone is created at caster position
- **WHEN** an AURA hero at position (400, 300) activates `aura-sanctuary`
- **THEN** a zone SHALL be created with `x: 400`, `y: 300`, `radius: 160`, `followHeroId` set to the caster's session ID, and `remainingDuration: 5`

#### Scenario: Zone follows caster movement
- **WHEN** the caster moves from (400, 300) to (500, 350) during Sanctuary
- **THEN** the zone's coordinates SHALL update to (500, 350) on each tick

### Requirement: Sanctuary applies damage reduction to allies in radius
The zone SHALL apply a `damageReduction` status effect with `value: 0.25` to all ally heroes within its radius. The effect SHALL refresh while in range and expire shortly after leaving (via `ZONE_EFFECT_DURATION`).

#### Scenario: Ally receives damage reduction
- **WHEN** an ally hero is within 160px of the Sanctuary zone center
- **THEN** the ally SHALL have a `damageReduction` status effect with `value: 0.25`

#### Scenario: Damage reduction expires after leaving zone
- **WHEN** an ally hero moves outside the zone radius
- **THEN** the `damageReduction` status effect SHALL expire within `ZONE_EFFECT_DURATION` (0.1s)

#### Scenario: Enemies are not affected by damage reduction
- **WHEN** an enemy hero is within the Sanctuary zone radius
- **THEN** the enemy SHALL NOT receive any status effect from the zone

### Requirement: Sanctuary heals allies periodically
The zone SHALL heal all ally heroes within its radius by `tickHeal` HP at each `tickInterval`. Healing SHALL NOT exceed `maxHp`.

#### Scenario: Ally receives tick healing
- **WHEN** an ally hero is within 160px of the zone center and 1.0 seconds have elapsed since the last tick
- **THEN** the ally SHALL be healed for 15 HP (capped at maxHp)

#### Scenario: Healing does not exceed maxHp
- **WHEN** an ally hero at 645/650 HP is within the Sanctuary zone on a heal tick
- **THEN** the ally's HP SHALL be set to 650 (not 660)

#### Scenario: Multiple allies healed simultaneously
- **WHEN** two ally heroes are both within the zone radius on a heal tick
- **THEN** both allies SHALL each be healed for 15 HP

#### Scenario: Total healing over full duration
- **WHEN** an ally remains inside the Sanctuary zone for the full 5-second duration
- **THEN** the ally SHALL receive approximately 75 total healing (15 HP × 5 ticks at 1.0s intervals)

#### Scenario: Enemies are not healed
- **WHEN** an enemy hero is within the Sanctuary zone radius on a heal tick
- **THEN** the enemy SHALL NOT receive any healing

### Requirement: Sanctuary zone is removed on caster death
If the caster dies while Sanctuary is active, the zone SHALL be immediately removed.

#### Scenario: Caster dies during Sanctuary
- **WHEN** the caster's HP reaches 0 while Sanctuary zone is active
- **THEN** the zone SHALL be removed in the same tick

### Requirement: Sanctuary is blocked during dash
Sanctuary activation SHALL be rejected if the caster is currently dashing.

#### Scenario: Activation rejected while dashing
- **WHEN** a hero with `dashTimer > 0` attempts to activate `aura-sanctuary`
- **THEN** the activation SHALL return null and no zone SHALL be created

### Requirement: Sanctuary cooldown
After successful activation, the skill's cooldown SHALL be set to 20 seconds.

#### Scenario: Cooldown is applied after activation
- **WHEN** `aura-sanctuary` is successfully activated on slot Q
- **THEN** the caster's `cooldownQ` SHALL be set to 20

### Requirement: Sanctuary zone visual
The client SHALL render the Sanctuary zone with a blue-gold color scheme in `ZONE_VISUALS`. The zone SHALL be visible to all players.

#### Scenario: Zone is visible to all players
- **WHEN** a Sanctuary zone is active
- **THEN** both ally and enemy players SHALL see the zone rendered as a filled circle with border

### Requirement: Sanctuary does not apply self-debuff
Unlike Whirlwind, Sanctuary SHALL NOT apply any debuff to the caster. The caster retains full movement speed during the zone's duration.

#### Scenario: No self-slow on activation
- **WHEN** an AURA hero activates `aura-sanctuary`
- **THEN** the caster SHALL NOT have any new debuff status effects applied
