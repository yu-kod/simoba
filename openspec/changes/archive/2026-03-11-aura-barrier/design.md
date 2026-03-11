## Overview

Barrier is a point-placed ally-protection zone for AURA. Unlike Sanctuary (follow caster, heal+DR), Barrier is a fixed-position zone that provides higher damage reduction but no healing. It's a simpler, earlier-available alternative (Depth 2 vs Depth 7).

## Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| cooldown | 14s | Mid-tier, same as slow-field |
| range | 500px | Point targeting range |
| radius | 180px | Larger than Sanctuary (160) — fixed position needs wider coverage |
| duration | 4s | Same as slow-field |
| damageReduction | 0.30 (30%) | Higher than Sanctuary (25%) to compensate for no healing and fixed position |
| target | ally | Only affects allied heroes |

## Key Design Decisions

### Decision #1: No new infrastructure needed
Barrier is a pure skill definition + zone visual registration. The existing zone system already supports:
- Point-placed zones (`targeting: 'point'`, no `followCaster`)
- Ally targeting (`target: 'ally'`, `shouldAffect()` handles this)
- Damage reduction buff (`buffType: 'damageReduction'`)
- Zone status effect refresh (allies in range keep the buff, expires on leaving)

### Decision #2: Fixed position (not follow caster)
Unlike Sanctuary, Barrier is placed at a target point. This creates a strategic choice: place it on an ally being focused, on a choke point, or on an objective. The tradeoff vs Sanctuary is mobility — Barrier doesn't move but has higher DR.

### Decision #3: No healing component
Barrier provides pure damage reduction. Healing is covered by Heal (single target) and Sanctuary (zone). This keeps each skill focused on one thing.

## Files to Modify

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | Register `aura-barrier` definition |
| `shared/zone/zoneVisuals.ts` | Add visual entry (green-cyan) |
| `server/src/__tests__/auraBarrier.test.ts` | New test file |
