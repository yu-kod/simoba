## ADDED Requirements

### Requirement: Bolt Ricochet skill definition
The system SHALL register a `bolt-ricochet` skill in `SKILL_DEFINITIONS` with targeting `direction`, cooldown 8s, and `projectile` effectType.

The projectile SHALL have: damage 50, speed 700, range 500, radius 5, pierceCount 0, homing false, visualType `diamond`, bounceCount 3, bounceRange 300.

#### Scenario: Skill definition exists with correct parameters
- **WHEN** `getSkillDefinition('bolt-ricochet')` is called
- **THEN** it SHALL return a definition with id `bolt-ricochet`, targeting `direction`, cooldown 8, and projectile effect with damage 50, bounceCount 3, bounceRange 300

### Requirement: Ricochet projectile bounces between enemies
The system SHALL redirect the projectile toward the nearest unhit enemy hero within `bounceRange` after each hit, decrementing `bounceRemaining`.

#### Scenario: Projectile bounces to nearest enemy after hitting first target
- **WHEN** a ricochet projectile hits an enemy hero and bounceRemaining > 0
- **THEN** the projectile SHALL redirect toward the nearest unhit enemy hero within bounceRange and decrement bounceRemaining by 1

#### Scenario: Projectile is removed when no bounce target is available
- **WHEN** a ricochet projectile hits an enemy hero and bounceRemaining > 0 but no unhit enemy is within bounceRange
- **THEN** the projectile SHALL be removed after dealing damage to the current target

#### Scenario: Projectile is removed when bounceRemaining reaches 0
- **WHEN** a ricochet projectile hits an enemy hero and bounceRemaining is 0
- **THEN** the projectile SHALL be removed after dealing damage

### Requirement: Ricochet does not hit the same enemy twice
The system SHALL track which enemies have been hit and exclude them from bounce target selection.

#### Scenario: Previously hit enemy is excluded from bounce targets
- **WHEN** a ricochet projectile looks for the next bounce target
- **THEN** it SHALL NOT select an enemy that was already hit by this projectile
