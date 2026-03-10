## ADDED Requirements

### Requirement: Fortify skill definition
The system SHALL define `blade-fortify` as a self-targeting buff skill with cooldown 14s, applying `damageReduction` buffType with value 0.3 (30%) for 4 seconds.

#### Scenario: Fortify activation
- **WHEN** a BLADE hero activates Fortify
- **THEN** a `damageReduction` status effect SHALL be applied to the caster with value 0.3 and duration 4s

#### Scenario: Fortify refresh
- **WHEN** Fortify is activated while an existing Fortify buff is active
- **THEN** the buff duration SHALL be refreshed to 4s (not stacked)

### Requirement: Damage reduction mechanic
HeroSchema.applyDamage SHALL consult `damageReduction` status effects and reduce incoming damage accordingly.

#### Scenario: Damage with active Fortify
- **WHEN** a hero with 30% damageReduction takes 100 damage
- **THEN** the hero SHALL receive 70 damage (100 * (1 - 0.3))

#### Scenario: Damage without Fortify
- **WHEN** a hero with no damageReduction takes 100 damage
- **THEN** the hero SHALL receive 100 damage (unchanged)

#### Scenario: Damage reduction expires
- **WHEN** the Fortify buff expires
- **THEN** subsequent damage SHALL be applied at full value

### Requirement: Talent tree integration
The `blade-fortify` talent node SHALL grant the Fortify skill (grant_skill) instead of a stat modifier.

#### Scenario: Talent unlocks skill
- **WHEN** a BLADE hero selects the Fortify talent
- **THEN** `blade-fortify` SHALL appear in the hero's skill slots

## MODIFIED Requirements

### Modified: skill-execution
The skill execution system already handles `buff` effectType via `buffEffectHandler`. No behavioral changes required — `blade-fortify` uses the existing buff pipeline with a new `buffType: 'damageReduction'`.
