# Tasks — bolt-barrage

## Backend

- [x] Add `projectileCount` and `spreadAngle` optional fields to `ProjectileEffectParams` in `shared/skills/skillDefinitions.ts`
- [x] Add `bolt-barrage` skill definition to `SKILL_DEFINITIONS` registry
- [x] Extend `projectileEffectHandler` to spawn multiple projectiles with angular spread when `projectileCount > 1`
- [x] Write unit tests for bolt-barrage (skill definition, multi-projectile spawn, cooldown, dash rejection, spread angles)

## Frontend

- [x] Add barrage projectile visual entry to `shared/projectile/projectileVisuals.ts` (already exists — uses 'circle')
