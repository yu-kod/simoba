## Backend Tasks

- [x] 1. Add `tickHeal?: number` to `ZoneEffectParams` in `shared/skills/skillDefinitions.ts`
- [x] 2. Register `aura-sanctuary` skill definition in `SKILL_DEFINITIONS`
- [x] 3. Add `tickHeal: number = 0` server-only field to `ZoneSchema` (no `@type` decorator)
- [x] 4. Set `zone.tickHeal` from params in `zoneEffectHandler.ts`
- [x] 5. Extend `tickZones()` in `ServerZoneSystem.ts` to heal ally heroes when `tickHeal > 0` on tick interval (cap at maxHp)
- [x] 6. Write server tests: skill definition, zone creation, follow tracking, tick healing (single/multi ally, maxHp cap, total healing, enemy not healed), damage reduction applied to allies, caster death removal, no self-debuff

## Frontend Tasks

- [x] 7. Add `aura-sanctuary` entry in `shared/zone/zoneVisuals.ts` (blue-gold color scheme, visible to all)
