## ADDED Requirements

### Requirement: Block skill definition
The system SHALL define `blade-block` as a self-targeting buff skill with cooldown 10s, applying `blockAmount` buffType with value 30 for 3 seconds.

#### Scenario: Block activation
- **WHEN** a BLADE hero activates Block
- **THEN** a `blockAmount` status effect SHALL be applied to the caster with value 30 and duration 3s

#### Scenario: Block refresh
- **WHEN** Block is activated while an existing Block buff is active
- **THEN** the buff duration SHALL be refreshed to 3s (not stacked)

### Requirement: Block damage absorption mechanic
HeroSchema.applyDamage SHALL consult `blockAmount` status effects and subtract the flat value from incoming damage after `damageReduction` is applied.

#### Scenario: Damage with active Block
- **WHEN** a hero with blockAmount 30 takes 100 damage (no damageReduction)
- **THEN** the hero SHALL receive 70 damage (100 - 30)

#### Scenario: Block absorbs more than incoming damage
- **WHEN** a hero with blockAmount 30 takes 20 damage
- **THEN** the hero SHALL receive 0 damage (clamped, block absorbs all)

#### Scenario: Block combined with Fortify
- **WHEN** a hero with damageReduction 0.3 and blockAmount 30 takes 100 damage
- **THEN** the hero SHALL receive 40 damage (100 * 0.7 = 70, then 70 - 30 = 40)

#### Scenario: Damage without Block
- **WHEN** a hero with no blockAmount takes 100 damage
- **THEN** the hero SHALL receive 100 damage (unchanged)

#### Scenario: Block expires
- **WHEN** the Block buff expires
- **THEN** subsequent damage SHALL be applied without flat absorption

### Requirement: Talent tree integration
The `blade-block` talent node SHALL be added at Depth 1 (Cost 1, prerequisite: `blade-toughness`) granting the Block skill.

#### Scenario: Talent unlocks skill
- **WHEN** a BLADE hero selects the Block talent
- **THEN** `blade-block` SHALL appear in the hero's skill slots

## MODIFIED Requirements

### Modified: blade-fortify
HeroSchema.applyDamage gains `blockAmount` handling applied after `damageReduction`. Order: raw damage → damageReduction (percentage) → blockAmount (flat subtraction) → clamped to 0.
