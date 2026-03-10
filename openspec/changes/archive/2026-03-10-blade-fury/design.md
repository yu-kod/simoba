## Technical Approach

Fury is a self-cast buff that boosts attackDamage and attackSpeed simultaneously. The existing buff system supports one buffType per skill, so we extend it with `additionalBuffs`.

### Skill Definition

```typescript
'blade-fury': {
  id: 'blade-fury',
  targeting: 'self',
  cooldown: 18,
  effect: {
    effectType: 'buff',
    buffType: 'attackDamage',
    value: 25,
    duration: 5,
    isDebuff: false,
    additionalBuffs: [
      { buffType: 'attackSpeed', value: 0.5 },
    ],
  },
}
```

### BuffEffectParams Extension

```typescript
export interface BuffEffectParams {
  // ... existing fields
  readonly additionalBuffs?: readonly {
    readonly buffType: string
    readonly value: number
  }[]
}
```

### buffEffectHandler Changes

After applying the primary buff (keyed by skillId), iterate `additionalBuffs` and create additional StatusEffectSchema entries keyed by `${skillId}:${buffType}`.

### ServerCombatManager Change

```typescript
// Before: hero.attackCooldown = 1 / hero.attackSpeed
// After:
const effectiveAS = getEffectiveStat(hero.attackSpeed, hero, 'attackSpeed')
hero.attackCooldown = 1 / effectiveAS
```

### Talent Tree

`blade-fury` node (Depth 6, Cost 3) changes from `grant_skill: 'blade-fury'` — it already is a grant_skill. Verified: no change needed to talent tree.

### Files to Change

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | Extend BuffEffectParams, add blade-fury |
| `server/src/game/skills/handlers/buffEffectHandler.ts` | Apply additionalBuffs |
| `server/src/game/ServerCombatManager.ts` | Use getEffectiveStat for attackSpeed |
| `shared/talents/bladeTalents.ts` | Already grant_skill — no change |
