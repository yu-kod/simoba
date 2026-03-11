# Tasks — blade-execute

## Backend

- [x] Add `StrikeEffectParams` interface to `shared/skills/skillDefinitions.ts` and extend `SkillEffectParams` union
- [x] Add `blade-execute` skill definition to `SKILL_DEFINITIONS` registry
- [x] Create `strikeEffectHandler.ts` with execute threshold logic
- [x] Register `strikeEffectHandler` in handler index
- [x] Write unit tests for blade-execute (definition, base damage, execute bonus, threshold edge cases, dash rejection, out-of-range rejection, kill credit)
