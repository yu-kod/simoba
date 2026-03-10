## Technical Approach

Fortify is a self-cast buff that reduces incoming damage by 30% for 4 seconds. It reuses the existing StatusEffect system (same pattern as aura-haste, aura-weaken).

### Key Decision: Damage Reduction via StatusEffect

The `damageReduction` buffType stores a fractional reduction value (e.g., 0.3 = 30%). HeroSchema overrides `applyDamage` to consult this effect before subtracting HP.

**Why override in HeroSchema instead of CombatEntitySchema:**
- Only heroes have `statusEffects` (MapSchema)
- Towers/minions don't need damage reduction
- Keeps CombatEntitySchema simple

### Skill Definition

```typescript
'blade-fortify': {
  id: 'blade-fortify',
  targeting: 'self',
  cooldown: 14,
  effect: {
    effectType: 'buff',
    buffType: 'damageReduction',
    value: 0.3,           // 30% reduction
    duration: 4,
    isDebuff: false,
  },
}
```

### Talent Tree Change

The existing `blade-fortify` node (Depth 3, Cost 2) changes from `stat_modifier` (HP+120) to `grant_skill`. The HP bonus is redistributed to maintain tree balance — `blade-iron-will` is nearby and provides HP.

### Damage Reduction Flow

```
attacker.applyDamage(hero, amount)
  → HeroSchema.applyDamage(amount)
    → check statusEffects for 'damageReduction'
    → reducedAmount = amount * (1 - reductionValue)
    → super.applyDamage(reducedAmount)
```

### Files to Change

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | Add `blade-fortify` definition |
| `shared/talents/bladeTalents.ts` | Change node from stat_modifier to grant_skill |
| `server/src/schema/HeroSchema.ts` | Override `applyDamage` to apply damageReduction |
| `server/src/game/StatusEffectSystem.ts` | No change needed (getStatusEffectValue already generic) |
| `server/src/game/skills/handlers/buffEffectHandler.ts` | No change needed (handles all buff types) |

### Tests

- HeroSchema: `applyDamage` with/without damageReduction status effect
- Skill execution: blade-fortify applies buff to self
- Talent tree integrity: existing tests validate structure automatically
