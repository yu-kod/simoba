## MODIFIED Requirements

### Requirement: Linear projectile bounce behavior
The linear projectile processing system SHALL support bounce behavior when `bounceRemaining > 0`. On hit, instead of pierce behavior, the projectile SHALL:
1. Deal damage to the hit target
2. Add the target to the hitSet
3. Find the nearest unhit enemy hero within `bounceRange`
4. If found: redirect the projectile's direction toward that enemy, decrement `bounceRemaining`, reset `distanceTraveled`
5. If not found: remove the projectile

Bounce and pierce SHALL be mutually exclusive. When `bounceRemaining > 0`, pierce logic SHALL NOT apply.

#### Scenario: Bounce takes priority over pierce
- **WHEN** a projectile has both `bounceRemaining > 0` and `pierceRemaining > 0`
- **THEN** the system SHALL execute bounce logic, not pierce logic

#### Scenario: Distance traveled resets on bounce
- **WHEN** a projectile bounces to a new target
- **THEN** `distanceTraveled` SHALL be reset to 0 so the projectile can travel `maxRange` toward the new target

## ADDED Requirements

### Requirement: ProjectileSchema bounce fields
`ProjectileSchema` SHALL include `bounceRemaining` (int16, default 0) and `bounceRange` (float32, default 0) fields.

#### Scenario: New projectile has default bounce values
- **WHEN** a new ProjectileSchema is created
- **THEN** `bounceRemaining` SHALL be 0 and `bounceRange` SHALL be 0

### Requirement: ProjectileEffectParams bounce fields
`ProjectileEffectParams` SHALL include optional `bounceCount` (number) and `bounceRange` (number) fields. The `projectileEffectHandler` SHALL set `bounceRemaining` and `bounceRange` on the schema from these params.

#### Scenario: Handler sets bounce fields from params
- **WHEN** a projectile effect with `bounceCount: 3` and `bounceRange: 300` is executed
- **THEN** the created ProjectileSchema SHALL have `bounceRemaining: 3` and `bounceRange: 300`
