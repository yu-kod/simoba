## Tasks

### Backend
- [x] Extend `DashEffectParams` with optional `invulnerable` field in `skillDefinitions.ts`
- [x] Add `blade-dodge` skill definition to `skillDefinitions.ts`
- [x] Add `dashInvulnerable` server-only field to `HeroSchema`
- [x] Update `HeroSchema.applyDamage` to ignore damage when `dashInvulnerable` is true
- [x] Update `dashEffectHandler` to set `dashInvulnerable` from params
- [x] Update `ServerMovementSystem` to clear `dashInvulnerable` when dash ends
- [x] Add tests for invulnerability during dodge (damage ignored, clears on end, non-invulnerable dash unaffected)
- [x] Add test for blade-dodge skill execution (dash state, cooldown)
