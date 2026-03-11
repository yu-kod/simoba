## Why

AURA has no sustained protective ability. Current kit (heal, haste, weaken, nova, slow-field) lacks a high-commitment team-fight zone. Sanctuary fills the Depth 7 / Cost 3 slot with a caster-following ally zone that rewards positioning and team coordination. The follow-zone infrastructure from Whirlwind (Issue #200) is already in place, making this a natural next step.

## What Changes

- Register `aura-sanctuary` as a self-targeting follow zone skill (`followCaster: true`, `target: 'ally'`)
- Extend zone system with `tickHeal` — periodic healing for allies within radius (mirrors `tickDamage` for enemies)
- Add `tickHeal` field to `ZoneSchema` (server-only) and `ZoneEffectParams`
- Extend `tickZones()` to heal allies when `tickHeal > 0` on tick intervals
- Add blue-gold zone visual for Sanctuary in `ZONE_VISUALS`

## Capabilities

### New Capabilities
- `aura-sanctuary`: AURA's sustained protective follow-zone skill — damage reduction buff + periodic healing for allies in radius

### Modified Capabilities
_(none — reuses and extends existing zone infrastructure without changing existing behavior)_

## Impact

- **Server:** `ServerZoneSystem.ts` (add ally heal loop), `ZoneSchema.ts` (+tickHeal field), `zoneEffectHandler.ts` (set tickHeal), `skillDefinitions.ts` (+definition)
- **Client:** `zoneVisuals.ts` (+visual entry). No new rendering logic needed — reuses existing ZoneRenderer.
- **Shared:** `skillDefinitions.ts` (ZoneEffectParams +tickHeal)
- **Tests:** New test file for Sanctuary covering creation, follow tracking, tick healing, damage reduction, and edge cases
