## Why

BLADE currently has Fortify (percentage damage reduction) but no flat damage absorption. Block adds a complementary defensive skill at Depth 1 in the talent tree, giving tanky BLADE builds early access to damage mitigation that is especially strong against rapid low-damage attacks (e.g. BOLT auto-attacks).

## What Changes

- Add `blade-block` skill definition — self-targeting buff that absorbs a fixed amount of damage per hit for a duration
- Introduce `blockAmount` buffType — a new status effect that subtracts flat damage before HP is reduced
- Integrate `blockAmount` into `HeroSchema.applyDamage` alongside existing `damageReduction`
- Add `blade-block` talent node at Depth 1 (Cost 1, prerequisite: `blade-toughness`)

## Capabilities

### New Capabilities
- `blade-block`: Block skill definition, blockAmount mechanic, and talent tree integration

### Modified Capabilities
- `blade-fortify`: `HeroSchema.applyDamage` gains `blockAmount` handling (applied after damageReduction)

## Impact

- `shared/skills/skillDefinitions.ts` — add `blade-block` definition
- `server/src/schema/HeroSchema.ts` — extend `applyDamage` to apply `blockAmount` after `damageReduction`
- `shared/talents/bladeTalents.ts` — add `blade-block` talent node at Depth 1
- `server/src/__tests__/` — new tests for blockAmount mechanic and skill execution

## Non-goals

- No visual shield/block indicator (future)
- No interaction with block and critical hits
- Block does not stack with multiple casts (refreshes duration)
