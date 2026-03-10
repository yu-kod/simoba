## Why

BLADE has no defensive skill. Fortify adds a self-cast damage reduction buff, giving BLADE survivability in fights. This rounds out the hero's toolkit and is a straightforward buff using the existing StatusEffect system.

## What Changes

- Add `blade-fortify` skill definition to `shared/skills/skillDefinitions.ts`
- Override `applyDamage` in `HeroSchema` to apply `damageReduction` status effect
- Add skill to BLADE's talent tree
- Add tests for damage reduction logic

## Capabilities

### New Capabilities
- `blade-fortify`: Self-cast buff that reduces incoming damage by a percentage for a duration

### Modified Capabilities
- `skill-execution`: HeroSchema.applyDamage must consult damageReduction status effects before applying damage

## Impact

- `server/src/schema/HeroSchema.ts` — override applyDamage to check damageReduction buff
- `shared/skills/skillDefinitions.ts` — new skill entry
- `shared/talents/` — BLADE talent tree entry for Fortify
- No client changes needed (buff rendering uses existing StatusEffect sync)

## Non-goals

- Fortify does not block/parry specific attacks (flat percentage reduction only)
- No visual shield effect on client (future enhancement)
- No stacking with other damage reduction sources (single buff, refreshes on recast)
