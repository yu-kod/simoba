## Technical Approach

Block is a self-cast buff that absorbs flat damage per hit. It uses the existing buff system with a new `blockAmount` buffType, integrated into `HeroSchema.applyDamage` after `damageReduction`.

### Skill Definition

```typescript
'blade-block': {
  id: 'blade-block',
  targeting: 'self',
  cooldown: 10,
  effect: {
    effectType: 'buff',
    buffType: 'blockAmount',
    value: 30,
    duration: 3,
    isDebuff: false,
  },
}
```

### HeroSchema.applyDamage Change

```typescript
override applyDamage(amount: number): void {
  if (this.dead) return
  const reduction = getStatusEffectValue(this, 'damageReduction')
  const reduced = reduction > 0 ? amount * (1 - Math.min(reduction, 1)) : amount
  const block = getStatusEffectValue(this, 'blockAmount')
  const final = block > 0 ? Math.max(0, reduced - block) : reduced
  super.applyDamage(final)
}
```

Damage pipeline order: raw → damageReduction (%) → blockAmount (flat) → clamp to 0.

### Talent Tree

New node at Depth 1:
```typescript
{
  id: 'blade-block',
  name: 'Block',
  description: 'Unlock Block — absorb damage per hit',
  cost: 1,
  prerequisites: ['blade-toughness'],
  effects: [{ type: 'grant_skill', skillId: 'blade-block' }],
}
```

### Files to Change

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | Add `blade-block` definition |
| `server/src/schema/HeroSchema.ts` | Extend `applyDamage` with `blockAmount` |
| `shared/talents/bladeTalents.ts` | Add `blade-block` talent node at Depth 1 |
