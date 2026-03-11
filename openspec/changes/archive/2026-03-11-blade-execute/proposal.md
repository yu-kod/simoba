## Why

BLADE's fire-power build path needs a finisher skill to reward aggressive play. Execute (Depth 7, Cost 3) is the capstone — a high-cooldown melee strike that deals massive bonus damage to low-HP enemies. This completes BLADE's "火力" branch alongside Whirlwind and Fury.

## What Changes

- Add new `strike` effect type for melee single-target damage with conditional bonus
- Add `blade-execute` skill definition (enemy targeting, melee range)
- Register `strikeEffectHandler` in the handler index

## Non-goals

- Animation/cast-time system — Execute is instant (no wind-up)
- Direction-based target selection — uses existing `enemy` targeting for simplicity
- Kill confirmation VFX — deferred to visual polish pass

## Capabilities

### New Capabilities
- `blade-execute`: BLADE melee finisher with execute threshold bonus damage

### Modified Capabilities

## Impact

- `shared/skills/skillDefinitions.ts` — New `StrikeEffectParams` interface, `blade-execute` entry
- `server/src/game/skills/handlers/` — New `strikeEffectHandler.ts`
- `server/src/game/skills/handlers/index.ts` — Register new handler
