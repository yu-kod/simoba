## Overview

Sanctuary is a caster-following ally buff zone for AURA. It reuses the follow-zone infrastructure from Whirlwind (#200) and extends `tickZones()` with a `tickHeal` path that mirrors the existing `tickDamage` path but targets allies.

## Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| cooldown | 20s | High-tier (Depth 7), long commitment |
| radius | 160px | Slightly larger than Whirlwind (120) — support needs wider coverage |
| duration | 5s | Longer than Whirlwind (3s) — sustain over burst |
| damageReduction | 0.25 (25%) | Applied as zone status effect to allies |
| tickHeal | 15 HP | Per tick to each ally in radius |
| tickInterval | 1.0s | 5 ticks over 5s = 75 HP total per ally |
| followCaster | true | Moves with AURA |
| self slow | none | AURA is support — needs mobility to stay near team. Long cooldown is the tradeoff. |

## Key Design Decisions

### Decision #1: Extend zone system with `tickHeal` (not new effectType)
`tickDamage` damages enemies on interval. `tickHeal` heals allies on the same interval using the same `tickTimer`. Symmetric design, minimal new code.

**Alternative rejected:** Using `tickDamage` with negative values for healing — confusing semantics, breaks the damage/heal distinction.

### Decision #2: No self-slow on Sanctuary
Unlike Whirlwind (which slows the caster), Sanctuary has no self-debuff. AURA is a support who needs to position with the team. The tradeoff is the 20s cooldown. This also avoids the self-debuff coupling issue (#241) entirely — `zoneEffect.isDebuff` is `false`, so the existing handler code won't apply a self-effect.

### Decision #3: Damage reduction via zone status effect
Uses existing `zoneEffect` with `buffType: 'damageReduction'` and `target: 'ally'`. The `shouldAffect()` function already handles ally targeting. Status effect refreshes every tick while in range, expires via `ZONE_EFFECT_DURATION` (0.1s) when leaving — identical to how slow-field works.

### Decision #4: tickHeal uses the same tickTimer as tickDamage
One zone can have both `tickDamage` and `tickHeal`. Timer is shared. For Sanctuary, only `tickHeal` is set (tickDamage = 0). This keeps the timer logic simple and avoids a second timer.

## Data Flow

```
executeSkill → zoneEffectHandler
  → creates ZoneSchema with followHeroId, tickHeal, zoneEffect(damageReduction, ally)
  → no self-debuff (isDebuff = false)

tickZones (each frame):
  → follow zone: update x,y from caster
  → tickTimer: count down, fire on interval
  → heroes loop (shouldAffect = ally):
    → apply/refresh damageReduction status effect
    → if tickHealThisTick: hero.hp = min(hero.hp + tickHeal, hero.maxHp)
  → minion heal: skip (tickHeal does not affect minions — heroes only)
```

## Files to Modify

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | Add `tickHeal?: number` to `ZoneEffectParams`, register `aura-sanctuary` |
| `server/src/schema/ZoneSchema.ts` | Add `tickHeal: number` (server-only, no `@type`) |
| `server/src/game/ServerZoneSystem.ts` | Add ally heal loop in `tickZones()` |
| `server/src/game/skills/handlers/zoneEffectHandler.ts` | Set `zone.tickHeal` from params |
| `shared/zone/zoneVisuals.ts` | Add `aura-sanctuary` visual (blue-gold) |
| `server/src/__tests__/auraSanctuary.test.ts` | New test file |
