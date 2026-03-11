## Context

BOLT currently has Pierce Shot as its only fire-power active skill. The skill catalog defines Barrage as a burst-fire skill (Depth 3, Cost 2) that fires multiple projectiles. The existing `projectileEffectHandler` creates a single projectile per activation. We need to extend it to support multi-shot.

## Goals / Non-Goals

**Goals:**
- Extend `ProjectileEffectParams` to support multi-projectile spawning
- Implement Barrage as a fan-spread burst (all projectiles spawn simultaneously)
- Reuse existing linear projectile movement, collision, and pierce logic

**Non-Goals:**
- Channeling or cast-time system (all shots fire instantly)
- Staggered burst with delay between shots (adds server-side scheduling complexity)
- New effect type (reuse `projectile`)

## Decisions

### 1. Extend `ProjectileEffectParams` with optional multi-shot fields

Add `projectileCount` (default 1) and `spreadAngle` (total fan angle in radians) to `ProjectileEffectParams`. When `projectileCount > 1`, the handler distributes projectiles evenly across `spreadAngle` centered on the cursor direction.

**Why not a new effect type?** Barrage projectiles behave identically to existing linear projectiles (move, collide, pierce). Only the spawn logic differs. Adding 2 optional fields is simpler than duplicating an entire effect type.

### 2. Simultaneous spawn (no burst delay)

All projectiles spawn in the same tick. This avoids needing a server-side timer/scheduler for delayed spawns. The visual "burst" effect comes from the angular spread — projectiles fan out naturally.

**Alternative considered:** Staggered spawn with `burstDelay` — would require tracking pending projectile spawns per hero across ticks (similar to channeling). Too complex for the prototype phase.

### 3. Parameter values

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| cooldown | 10s | Depth 3, Cost 2 — expensive skill |
| projectileCount | 5 | Visible fan, rewarding aim |
| damage/projectile | 25 | Total 125 max (if all hit), comparable to Pierce Shot's 60×3 |
| speed | 700 px/s | Slightly slower than Pierce Shot (800) for readability |
| range | 450 px | Shorter than Pierce Shot (600) — close-mid range burst |
| radius | 4 px | Slightly smaller than Pierce Shot (5) |
| pierceCount | 0 | Single-hit per projectile — balanced by count |
| spreadAngle | 25° (0.436 rad) | Tight enough to hit 1-2 targets at range, wide enough to be distinct |

### 4. Visual type

Reuse `'circle'` projectile visual. All 5 projectiles render as small circles in team color — visually distinct from Pierce Shot's diamonds.

## Risks / Trade-offs

- **5 simultaneous projectiles → more entities per tick** → Mitigation: 2v2 arena means max ~10 projectiles from Barrage across both teams. Well within performance budget.
- **All-at-once spawn less visually dramatic than staggered** → Mitigation: Fan spread provides visual drama. Can add stagger later if desired.
- **pierceCount=0 means each bullet is single-hit** → Intentional: total projectile count compensates. Pierce + count would be overpowered.
