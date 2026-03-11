## Context

BLADE has Whirlwind (AoE DPS) and Fury (self-buff) in the fire-power path, but no finisher. Execute fills this role as a high-risk, high-reward melee skill that punishes low-HP targets.

## Goals / Non-Goals

**Goals:**
- New `strike` effect type for instant melee single-target damage
- Execute threshold mechanic: bonus damage when target HP% is below threshold
- Reuse existing `enemy` targeting with melee range

**Non-Goals:**
- Direction-based melee targeting (would need cone detection logic — not needed for prototype)
- Kill reset mechanic (cooldown resets on kill — too strong for 2v2, defer)

## Decisions

### 1. New `StrikeEffectParams` effect type

A `strike` is an instant melee damage skill targeting a single enemy. Fields:
- `damage`: base damage
- `executeThreshold`: HP ratio (0-1) below which bonus damage applies
- `executeBonusDamage`: additional damage when target is below threshold

**Why not reuse `projectile`?** Strike is instant melee — no projectile entity, no travel time, no collision. Fundamentally different from projectile mechanics.

### 2. Use `enemy` targeting with melee range

The skill uses `targeting: 'enemy'` with `range: 150` (melee). The existing `resolveHeroTarget` already handles nearest-enemy selection within range. If no enemy is in range, the skill fails without consuming cooldown (existing behavior).

### 3. Parameter values

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| cooldown | 20s | Depth 7, Cost 3 — ultimate tier finisher |
| damage | 100 | Base damage (BLADE base attack = 60) |
| range | 150 | Melee range |
| executeThreshold | 0.3 | 30% HP — forces commitment to finish |
| executeBonusDamage | 150 | Total 250 on low HP target = nearly lethal |

### 4. Damage application

Uses `hero.applyDamage()` which runs through the existing damage pipeline (damageReduction → blockAmount → clamp). The handler also sets `lastAttackerSessionId` for kill credit.

## Risks / Trade-offs

- **250 total damage on low HP is very high** → Intentional: 20s cooldown is the balancing factor. Can tune later.
- **`enemy` targeting requires clicking near enemy** → Acceptable UX for melee; BLADE is already close-range.
