# Specification

## Purpose

Bolt Turret skill — BOLTヒーローが設置型タレットを召喚するスキル。タレットは指定地点に出現し、一定時間の間、射程内の敵に自動攻撃を行う。破壊可能で、持続時間経過後に消滅する。

## Requirements

### Requirement: Bolt Turret skill definition
The system SHALL register a `bolt-turret` skill in `SKILL_DEFINITIONS` with targeting `point`, range 400, cooldown 20, and `turret` effectType.

The turret SHALL have: hp 200, duration 10, attackDamage 25, attackSpeed 1.5, attackRange 250, radius 18, projectileSpeed 600.

#### Scenario: Skill definition exists with correct parameters
- **WHEN** `getSkillDefinition('bolt-turret')` is called
- **THEN** it SHALL return a definition with id `bolt-turret`, targeting `point`, cooldown 20, range 400, and turret effect with hp 200, duration 10, attackDamage 25

### Requirement: Turret spawns at target position
The `turretEffectHandler` SHALL create a TowerSchema entity at `targetPosition` with the turret's combat parameters and add it to the towers collection.

#### Scenario: Turret is created with correct fields
- **WHEN** a turret skill is executed with targetPosition (500, 300)
- **THEN** a TowerSchema SHALL be created at (500, 300) with hp 200, attackDamage 25, attackSpeed 1.5, attackRange 250, remainingDuration 10, and ownerId set to the caster's id

#### Scenario: Turret inherits caster's team
- **WHEN** a blue team hero uses bolt-turret
- **THEN** the spawned turret SHALL have team `blue`

### Requirement: Turret auto-attacks enemies
Turrets SHALL use the existing tower combat system (`processTowerCombat`) for auto-attack behavior, targeting enemies within attackRange.

#### Scenario: Turret fires at nearest enemy
- **WHEN** an enemy hero is within the turret's attackRange
- **THEN** the turret SHALL fire homing projectiles at the enemy using the tower combat system

### Requirement: Turret lifetime expires
Turrets with `remainingDuration > 0` SHALL have their duration decremented each tick. When duration reaches 0, the turret SHALL be marked dead and removed.

#### Scenario: Turret expires after duration
- **WHEN** a turret with remainingDuration 10 has 10 seconds of game time pass
- **THEN** the turret SHALL be marked dead and removed from the towers collection

#### Scenario: Turret can be destroyed before expiry
- **WHEN** a turret's HP reaches 0 from enemy damage
- **THEN** the turret SHALL be marked dead (same as any tower)

### Requirement: Bolt Turret talent node
The BOLT talent tree SHALL have a `bolt-turret` node at Depth 6, Cost 2, with prerequisite `bolt-minefield` and effect `grant_skill: bolt-turret`.

#### Scenario: Talent node exists with correct properties
- **WHEN** the BOLT talent tree is queried for `bolt-turret`
- **THEN** it SHALL have cost 2, prerequisite `bolt-minefield`, and grant_skill effect
