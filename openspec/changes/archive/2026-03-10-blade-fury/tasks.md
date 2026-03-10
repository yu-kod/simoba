## Tasks

### Backend
- [x] Extend `BuffEffectParams` with optional `additionalBuffs` array in `skillDefinitions.ts`
- [x] Add `blade-fury` skill definition to `skillDefinitions.ts`
- [x] Update `buffEffectHandler` to apply additional buffs keyed by `${skillId}:${buffType}`
- [x] Apply `getEffectiveStat` for `attackSpeed` in `ServerCombatManager`
- [x] Add tests for buffEffectHandler with additionalBuffs
- [x] Add test for blade-fury skill execution (both buffs applied)
- [x] Add test for attack speed buff integration in ServerCombatManager
