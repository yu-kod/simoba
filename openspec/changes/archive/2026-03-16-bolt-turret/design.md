## Context

BOLT's talent tree has a Turret skill at Depth 6 that summons an auto-attacking turret. The codebase already has tower auto-attack AI (`ServerTowerSystem.processTowerCombat`) and `TowerSchema` with full combat fields. Turrets are mechanically identical to towers — they auto-target, fire projectiles, have HP, and can be destroyed.

## Goals / Non-Goals

**Goals:**
- Summon a turret at a target point that auto-attacks enemies
- Reuse existing tower combat infrastructure (no duplicate AI)
- Turret has limited lifetime and can be destroyed
- Balance: sustained DPS comparable to other Depth 6 skills

**Non-Goals:**
- Turret limit per player (Phase 1 — no cap, cooldown is the natural limiter)
- Client-side turret visual distinction from towers (future: add `towerType` rendering)
- Turret aggro/priority system beyond existing tower targeting

## Decisions

### §1 Reuse TowerSchema for turrets

Turrets share all mechanics with towers (HP, attack, targeting, projectiles). Rather than creating a separate `TurretSchema`, extend `TowerSchema` with:
- `remainingDuration` (float32, default 0) — 0 = permanent map tower, >0 = summoned turret
- `ownerId` (string, default '') — who summoned it

This lets `processTowerCombat` handle turret AI with zero changes.

### §2 New `turret` effectType

Add `TurretEffectParams` to the skill effect union:
```typescript
interface TurretEffectParams {
  effectType: 'turret'
  hp: number
  duration: number        // seconds
  attackDamage: number
  attackSpeed: number     // attacks per second
  attackRange: number     // px
  radius: number          // collision/render radius
  projectileSpeed: number // px/sec
}
```

### §3 SkillExecutionContext expansion

Add `towers: MapSchema<TowerSchema>` to `SkillExecutionContext`. The turret handler needs to add entities to the towers collection.

### §4 Turret lifetime management

In `GameRoom.update()`, iterate towers where `remainingDuration > 0`, decrement by deltaTime, mark dead and remove when expired. Extract this to a pure function `processTurretLifetime()` for testability.

### §5 Balance parameters

| Param | Value | Rationale |
|-------|-------|-----------|
| cooldown | 20s | Long CD for a sustained damage summon |
| duration | 10s | Meaningful uptime but not permanent |
| HP | 200 | Killable — about 3-4 hero attacks |
| attackDamage | 25 | Per-hit; DPS = 25 × 1.5 = 37.5/s |
| attackSpeed | 1.5 | Moderate fire rate |
| attackRange | 250px | Shorter than hero attack range |
| radius | 18 | Smaller than towers (24) |
| projectileSpeed | 600 | Homing projectile speed |
| placement range | 400px | point-targeting range |
| Talent | Depth 6, Cost 2 | prereq: bolt-minefield |

Total potential damage over 10s: 375 (comparable to bolt-ricochet's 200 instant burst).

### §6 Talent tree placement

`bolt-turret` node at Depth 6, Cost 2, prerequisite `bolt-minefield` (Depth 5, trap/zone branch). Thematically consistent with zone-control.

## Risks / Trade-offs

- **SkillExecutionContext change is breaking** — All callers of `executeSkill` must pass `towers`. Contained to `GameRoom` and tests.
- **Client rendering** — Turrets will look identical to map towers initially. Acceptable for Phase 1; can add `towerType` distinction later.
- **Tower cleanup** — Must ensure turret removal cleans up projectiles in flight. Existing tower death handling + `processTowerCombat` dead check covers this.
