## Why

BLADE has no offensive steroid skill. Fury adds a self-cast buff boosting both attack damage and attack speed, enabling burst windows for aggressive plays. This requires extending BuffEffectParams to support multiple stat buffs from a single skill.

## What Changes

- Add `blade-fury` skill definition with dual buffs (attackDamage + attackSpeed)
- Extend `BuffEffectParams` with optional `additionalBuffs` array
- Update `buffEffectHandler` to apply additional buffs
- Apply `getEffectiveStat` to attack speed in `ServerCombatManager`
- Update talent tree node from stat_modifier to grant_skill

## Capabilities

### New Capabilities
- `blade-fury`: Self-cast buff that temporarily increases attack damage and attack speed

### Modified Capabilities
- `skill-execution`: BuffEffectParams gains `additionalBuffs` for multi-stat buffs; ServerCombatManager uses getEffectiveStat for attackSpeed

## Impact

- `shared/skills/skillDefinitions.ts` — extend BuffEffectParams, add skill
- `server/src/game/skills/handlers/buffEffectHandler.ts` — handle additionalBuffs
- `server/src/game/ServerCombatManager.ts` — apply attackSpeed status effects
- `shared/talents/bladeTalents.ts` — update talent node

## Non-goals

- No visual attack speed animation changes (future)
- No interaction with attack range
