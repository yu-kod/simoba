## ADDED Requirements

### Requirement: Fury skill definition
The system SHALL define `blade-fury` as a self-targeting buff skill with cooldown 18s, applying `attackDamage` +25 and `attackSpeed` +0.5 for 5 seconds.

#### Scenario: Fury activation
- **WHEN** a BLADE hero activates Fury
- **THEN** an `attackDamage` status effect (+25) and an `attackSpeed` status effect (+0.5) SHALL be applied to the caster for 5s

#### Scenario: Fury refresh
- **WHEN** Fury is activated while an existing Fury buff is active
- **THEN** both buff durations SHALL be refreshed to 5s

### Requirement: Multi-buff support in BuffEffectParams
BuffEffectParams SHALL support an optional `additionalBuffs` array to apply multiple status effects from a single skill activation.

#### Scenario: Additional buffs applied
- **WHEN** a buff skill with `additionalBuffs` is activated
- **THEN** all additional buffs SHALL be applied as separate status effects keyed by `${skillId}:${buffType}`

### Requirement: Attack speed status effect integration
ServerCombatManager SHALL apply `attackSpeed` status effects when calculating attack cooldown.

#### Scenario: Attack with Fury active
- **WHEN** a hero with attackSpeed 1.0 and Fury (+0.5) attacks
- **THEN** the attack cooldown SHALL be 1 / 1.5 = 0.667s instead of 1 / 1.0 = 1.0s

## MODIFIED Requirements

### Modified: skill-execution
BuffEffectParams gains `additionalBuffs` field. buffEffectHandler applies extra status effects.
