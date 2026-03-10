## Tasks

### Backend
- [x] Add `blade-fortify` skill definition to `shared/skills/skillDefinitions.ts`
- [x] Override `applyDamage` in `HeroSchema` to apply `damageReduction` from status effects
- [x] Update `blade-fortify` talent node in `bladeTalents.ts` from `stat_modifier` to `grant_skill`
- [x] Add tests for HeroSchema.applyDamage with damageReduction
- [x] Add test for blade-fortify skill execution (buff applied to self)

### Frontend
- [x] No client changes needed (StatusEffect sync already handles buff display)
