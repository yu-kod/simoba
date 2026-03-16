## Why

BOLT's talent tree includes a "Turret" zone-control skill at Depth 6 (Issue #210). This adds a unique summoned-entity mechanic — placing an auto-attacking turret that provides area denial and sustained damage. It enriches BOLT's kit beyond direct-fire skills and leverages existing tower combat infrastructure.

## What Changes

- Add new `turret` effectType to `SkillEffectParams` with HP, duration, attack stats
- Add `remainingDuration` and `ownerId` fields to `TowerSchema` (reuse tower for turret — same combat AI)
- Add `towers` to `SkillExecutionContext` so handlers can spawn tower entities
- Create `turretEffectHandler` that spawns a TowerSchema with a limited lifetime
- Add turret lifetime expiry logic to `GameRoom` update tick
- Register `bolt-turret` skill definition and talent node

## Capabilities

### New Capabilities
- `bolt-turret`: Turret skill definition, summoning behavior, and auto-attack integration

### Modified Capabilities
- `skill-execution`: Add `towers` to SkillExecutionContext for turret spawning
- `tower-entity`: Add `remainingDuration` (float32, default 0 = permanent) and `ownerId` (string) fields for summoned turrets

## Impact

- **Server schema**: TowerSchema gets 2 new fields (backward-compatible, defaults to 0/empty)
- **Skill system**: SkillExecutionContext interface change — all callers must pass `towers`
- **GameRoom**: Small addition to update tick for turret lifetime
- **Client**: Existing tower rendering handles turrets automatically (same TowerSchema)
