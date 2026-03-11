## Why

BOLT's fire-power build path currently has only Pierce Shot as an active skill. Adding Barrage (Depth 3, Cost 2) gives BOLT a high-commitment burst damage option that rewards good aim — firing multiple projectiles in a fan spread. This fulfills the skill catalog's "火力" branch (#207).

## What Changes

- Add `bolt-barrage` skill definition to the shared skill registry
- Extend `ProjectileEffectParams` with optional multi-shot fields (`projectileCount`, `spreadAngle`)
- Modify `projectileEffectHandler` to spawn multiple projectiles when `projectileCount > 1`
- Add visual entry for barrage projectiles in `PROJECTILE_VISUALS`
- Register in BOLT's talent tree

## Non-goals

- Channeling/cast-time system — Barrage fires all projectiles instantly (no channeling)
- New effect type — Reuses and extends existing `projectile` effectType
- Burst delay between shots — All projectiles spawn simultaneously with angular spread

## Capabilities

### New Capabilities
- `bolt-barrage`: BOLT burst-fire skill that spawns multiple projectiles in a fan spread

### Modified Capabilities
- `projectile-system`: Extend ProjectileEffectParams to support multi-shot (projectileCount, spreadAngle)

## Impact

- `shared/skills/skillDefinitions.ts` — Add optional fields to `ProjectileEffectParams`, add `bolt-barrage` entry
- `server/src/game/skills/handlers/projectileEffectHandler.ts` — Multi-projectile spawn logic
- `shared/projectile/projectileVisuals.ts` — Add barrage visual entry
- `openspec/specs/heroes.md` — BOLT skill list update
