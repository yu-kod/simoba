## ADDED Requirements

### Requirement: Bolt Snipe skill definition
The system SHALL register a `bolt-snipe` skill in `SKILL_DEFINITIONS` with targeting `self`, cooldown 16s, and `buff` effectType.

The primary buff SHALL be `attackDamage` with value +20, duration 5s, `isDebuff: false`.

The skill SHALL include `additionalBuffs`:
- `attackSpeed` with value +0.4 (40%)
- `speed` with value -60

#### Scenario: Skill definition exists with correct parameters
- **WHEN** `getSkillDefinition('bolt-snipe')` is called
- **THEN** it SHALL return a definition with id `bolt-snipe`, targeting `self`, cooldown 16, and buff effect with attackDamage +20, duration 5

#### Scenario: Additional buffs include attack speed and speed penalty
- **WHEN** the skill definition's `additionalBuffs` is inspected
- **THEN** it SHALL contain exactly 2 entries: attackSpeed +0.4 and speed -60

### Requirement: Snipe applies all three status effects on activation
The system SHALL apply three status effects to the caster when `bolt-snipe` is activated:
1. `attackDamage` buff (+20) for 5 seconds
2. `attackSpeed` buff (+0.4) for 5 seconds
3. `speed` debuff (-60) for 5 seconds

All three effects SHALL share the same duration and be removed simultaneously.

#### Scenario: Full HP caster activates Snipe
- **WHEN** a BOLT hero with 0 cooldown activates bolt-snipe
- **THEN** the hero SHALL receive 3 status effects (attackDamage, attackSpeed, speed) with correct values and 5s duration

#### Scenario: Cooldown is set after activation
- **WHEN** bolt-snipe is activated successfully
- **THEN** the caster's cooldown for the skill slot SHALL be set to 16 seconds

#### Scenario: Activation rejected during dash
- **WHEN** a hero with active dashTimer attempts to activate bolt-snipe
- **THEN** the activation SHALL be rejected and no status effects SHALL be applied

### Requirement: Bolt Snipe talent node placement
The system SHALL include a `bolt-snipe` talent node in the BOLT talent tree at Depth 5 with cost 2, granting the `bolt-snipe` skill.

The node SHALL require `bolt-eagle-eye` as a prerequisite.

#### Scenario: Talent node exists in BOLT tree
- **WHEN** the BOLT talent tree is inspected
- **THEN** it SHALL contain a node with id `bolt-snipe`, cost 2, prerequisite `bolt-eagle-eye`, and effect `grant_skill` with skillId `bolt-snipe`
