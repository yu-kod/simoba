## ADDED Requirements

### Requirement: Whirlwind skill definition
The system SHALL register `blade-whirlwind` in `SKILL_DEFINITIONS` with `targeting: 'self'`, `effectType: 'zone'`, `cooldown: 12`, `zoneRadius: 120`, `zoneDuration: 3`, `tickDamage: 30`, `tickInterval: 0.5`, and `followCaster: true`.

#### Scenario: Skill definition is registered
- **WHEN** `getSkillDefinition('blade-whirlwind')` is called
- **THEN** it SHALL return a valid `SkillDefinition` with `effectType: 'zone'`, `cooldown: 12`, `zoneRadius: 120`, `zoneDuration: 3`

### Requirement: Whirlwind creates a follow zone on activation
When a BLADE hero activates `blade-whirlwind`, the server SHALL create a zone centered on the caster's position with `followHeroId` set to the caster's session ID. The zone SHALL move with the caster each tick.

#### Scenario: Zone is created at caster position
- **WHEN** a BLADE hero at position (500, 300) activates `blade-whirlwind`
- **THEN** a zone SHALL be created with `x: 500`, `y: 300`, `radius: 120`, `followHeroId` set to the caster's session ID, and `remainingDuration: 3`

#### Scenario: Zone follows caster movement
- **WHEN** the caster moves from (500, 300) to (600, 350) during Whirlwind
- **THEN** the zone's coordinates SHALL update to (600, 350) on each tick

### Requirement: Whirlwind deals tick damage to enemies in radius
The zone SHALL deal `tickDamage` to all enemies within its radius at each `tickInterval`. Allies and the caster SHALL NOT take damage.

#### Scenario: Enemy takes tick damage inside zone
- **WHEN** an enemy hero is within 120px of the zone center and 0.5 seconds have elapsed since the last tick
- **THEN** the enemy SHALL take 30 damage and the zone's `lastAttackerSessionId` SHALL be set on the victim

#### Scenario: Ally is not damaged by friendly Whirlwind
- **WHEN** an ally hero is within 120px of a friendly Whirlwind zone
- **THEN** the ally SHALL NOT take any damage

#### Scenario: Multiple enemies take damage simultaneously
- **WHEN** two enemy heroes are both within the zone radius on a damage tick
- **THEN** both enemies SHALL each take 30 damage

#### Scenario: Total damage over full duration
- **WHEN** an enemy remains inside the Whirlwind zone for the full 3-second duration
- **THEN** the enemy SHALL take approximately 180 total damage (30 damage x 6 ticks at 0.5s intervals)

### Requirement: Whirlwind applies movement speed reduction to caster
When Whirlwind is activated, the caster SHALL receive a speed debuff status effect for the duration of the zone. The caster's movement speed SHALL be reduced by 40.

#### Scenario: Caster is slowed during Whirlwind
- **WHEN** a BLADE hero activates `blade-whirlwind`
- **THEN** the caster SHALL have a `speed` status effect with `value: -40` and `duration: 3`

#### Scenario: Speed returns to normal after Whirlwind ends
- **WHEN** Whirlwind's 3-second duration expires
- **THEN** the caster's speed debuff SHALL be removed by the existing `tickBuffs` system

### Requirement: Whirlwind zone is removed on caster death
If the caster dies while Whirlwind is active, the zone SHALL be immediately removed.

#### Scenario: Caster dies during Whirlwind
- **WHEN** the caster's HP reaches 0 while Whirlwind zone is active
- **THEN** the zone SHALL be removed in the same tick

### Requirement: Whirlwind is blocked during dash
Whirlwind activation SHALL be rejected if the caster is currently dashing (consistent with existing skill execution guards).

#### Scenario: Activation rejected while dashing
- **WHEN** a hero with `dashTimer > 0` attempts to activate `blade-whirlwind`
- **THEN** the activation SHALL return null and no zone SHALL be created

### Requirement: Whirlwind cooldown
After successful activation, the skill's cooldown SHALL be set to 12 seconds.

#### Scenario: Cooldown is applied after activation
- **WHEN** `blade-whirlwind` is successfully activated on slot Q
- **THEN** the caster's `cooldownQ` SHALL be set to 12

### Requirement: Whirlwind zone visual
The client SHALL render the Whirlwind zone with a distinct visual style in `ZONE_VISUALS` using a red-orange color scheme.

#### Scenario: Zone is visible to all players
- **WHEN** a Whirlwind zone is active
- **THEN** both ally and enemy players SHALL see the zone rendered as a filled circle with border

### Requirement: Whirlwind damages minions
The Whirlwind zone SHALL also deal tick damage to enemy minions within its radius.

#### Scenario: Enemy minion takes tick damage
- **WHEN** an enemy minion is within the Whirlwind zone radius on a damage tick
- **THEN** the minion SHALL take 30 damage
