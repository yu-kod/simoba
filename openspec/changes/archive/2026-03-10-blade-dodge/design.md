## Technical Approach

Dodge Roll reuses the existing dash system with a new `invulnerable` flag. No new effectType needed.

### Skill Definition

```typescript
'blade-dodge': {
  id: 'blade-dodge',
  targeting: 'direction',
  cooldown: 8,
  effect: {
    effectType: 'dash',
    distance: 150,
    duration: 0.15,
    damage: 0,
    invulnerable: true,
  },
}
```

### DashEffectParams Extension

```typescript
export interface DashEffectParams {
  // ... existing fields
  readonly invulnerable?: boolean  // true = invulnerable during dash
}
```

### dashEffectHandler Change

```typescript
hero.dashInvulnerable = params.invulnerable ?? false
```

### HeroSchema Change

```typescript
// Server-only field (no @type decorator)
dashInvulnerable: boolean = false

override applyDamage(amount: number): void {
  if (this.dead) return
  if (this.dashInvulnerable) return  // invulnerable during dodge
  // ... existing pipeline
}
```

### ServerMovementSystem Change

When dash ends (`dashTimer <= 0`), clear invulnerability:
```typescript
if (hero.dashTimer <= 0) {
  hero.dashDamage = 0
  hero.dashInvulnerable = false  // add this
}
```

### Files to Change

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | Extend DashEffectParams, add blade-dodge |
| `server/src/game/skills/handlers/dashEffectHandler.ts` | Set dashInvulnerable |
| `server/src/schema/HeroSchema.ts` | Add dashInvulnerable field, update applyDamage |
| `server/src/game/ServerMovementSystem.ts` | Clear dashInvulnerable on dash end |
| `shared/talents/bladeTalents.ts` | No change (node already exists) |
