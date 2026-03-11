## Why

AURA lacks an early-game protective tool. Heal and Haste are Depth 1 support skills, but there's no mid-tier zone-based protection. Barrier fills the Depth 2 / Cost 2 slot as a point-placed damage reduction zone, giving AURA a strategic area-denial/protection tool that complements the late-game Sanctuary (Depth 7 follow zone).

## What Changes

- Register `aura-barrier` as a point-targeting fixed zone skill (`target: 'ally'`, `damageReduction`)
- Add green-cyan zone visual for Barrier in `ZONE_VISUALS`
- No infrastructure changes — reuses existing zone system entirely

## Capabilities

### New Capabilities
- `aura-barrier`: AURA's point-placed protective zone — damage reduction buff for allies standing in the area

### Modified Capabilities
_(none — pure registration, no infrastructure changes)_

## Impact

- **Shared:** `skillDefinitions.ts` (+definition), `zoneVisuals.ts` (+visual entry)
- **Tests:** New test file for Barrier
- **No server code changes** — existing zone system handles everything
