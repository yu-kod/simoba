## Why

BLADE lacks a defensive mobility option. Dodge Roll provides a short invulnerable dash, giving skilled players a way to dodge key abilities. This complements the existing dash system (blade-charge, bolt-dash) by adding invulnerability frames as a new dash feature.

## What Changes

- Add `blade-dodge` skill definition — direction-targeting dash with invulnerability frames
- Extend `DashEffectParams` with optional `invulnerable` flag
- Add `dashInvulnerable` server-only field to HeroSchema
- Update `dashEffectHandler` to set invulnerability when `invulnerable: true`
- Update `HeroSchema.applyDamage` to ignore damage during invulnerable dash
- Clear invulnerability when dash ends in `ServerMovementSystem`
- Talent node already exists at Depth 3 (`blade-dodge` → `grant_skill: 'blade-dodge'`)

## Capabilities

### New Capabilities
- `blade-dodge`: Dodge Roll skill definition and invulnerability frame mechanic

### Modified Capabilities

## Impact

- `shared/skills/skillDefinitions.ts` — extend DashEffectParams, add blade-dodge
- `server/src/game/skills/handlers/dashEffectHandler.ts` — set dashInvulnerable
- `server/src/schema/HeroSchema.ts` — add dashInvulnerable field, update applyDamage
- `server/src/game/ServerMovementSystem.ts` — clear dashInvulnerable on dash end

## Non-goals

- No visual invulnerability indicator (future)
- No interaction with CC/debuffs during invulnerability (future)
