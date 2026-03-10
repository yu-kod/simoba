import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { ZoneSchema } from '../schema/ZoneSchema.js'
import type { SkillEvent } from '@shared/messages'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { getEffectHandler } from './skills/skillEffectRegistry.js'
import { createServerLogger } from '@shared/logging'
import type { ProjectileTracker } from './ProjectileTracker.js'

const logger = createServerLogger('skill')

type SkillSlot = 'Q' | 'E' | 'R'

function getSlotSkillId(hero: HeroSchema, slot: SkillSlot): string {
  switch (slot) {
    case 'Q': return hero.skillSlotQ
    case 'E': return hero.skillSlotE
    case 'R': return hero.skillSlotR
  }
}

function getSlotCooldown(hero: HeroSchema, slot: SkillSlot): number {
  switch (slot) {
    case 'Q': return hero.cooldownQ
    case 'E': return hero.cooldownE
    case 'R': return hero.cooldownR
  }
}

function setSlotCooldown(hero: HeroSchema, slot: SkillSlot, value: number): void {
  switch (slot) {
    case 'Q': hero.cooldownQ = value; break
    case 'E': hero.cooldownE = value; break
    case 'R': hero.cooldownR = value; break
  }
}

function normalizeDirection(
  heroX: number, heroY: number, targetX: number, targetY: number
): { x: number; y: number } {
  const dx = targetX - heroX
  const dy = targetY - heroY
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return { x: 1, y: 0 }
  return { x: dx / len, y: dy / len }
}

/**
 * Resolve the target hero for ally/enemy-targeting skills.
 * Finds the nearest hero matching `filter` within `range` of the click position.
 * Returns null if no matching hero is in range.
 */
export function resolveHeroTarget(
  target: { x: number; y: number },
  heroes: MapSchema<HeroSchema>,
  range: number,
  filter: (candidate: HeroSchema, candidateId: string) => boolean,
): HeroSchema | null {
  let bestHero: HeroSchema | null = null
  let bestDistSq = Infinity

  heroes.forEach((candidate, sid) => {
    if (!filter(candidate, sid)) return

    const dx = candidate.x - target.x
    const dy = candidate.y - target.y
    const distSq = dx * dx + dy * dy
    if (distSq < bestDistSq) {
      bestDistSq = distSq
      bestHero = candidate
    }
  })

  if (bestHero && bestDistSq <= range * range) {
    return bestHero
  }
  return null
}

/**
 * Execute a skill from a hero's slot.
 * Returns a SkillEvent on success, or null if validation fails.
 */
export function executeSkill(
  hero: HeroSchema,
  sessionId: string,
  slot: SkillSlot,
  target: { x: number; y: number },
  projectiles: MapSchema<ProjectileSchema>,
  heroes: MapSchema<HeroSchema>,
  tracker: ProjectileTracker,
  zones: MapSchema<ZoneSchema> = new MapSchema<ZoneSchema>(),
): SkillEvent | null {
  // Validation: hero must be alive
  if (hero.dead) return null

  // Validation: cannot cast during a dash
  if (hero.dashTimer > 0) return null

  // Validation: slot must have a skill equipped
  const skillId = getSlotSkillId(hero, slot)
  if (skillId === '') return null

  // Validation: cooldown must be 0
  if (getSlotCooldown(hero, slot) > 0) return null

  // Get skill definition
  const def = getSkillDefinition(skillId)
  if (!def) return null

  // Calculate direction from hero to target
  const direction = normalizeDirection(hero.x, hero.y, target.x, target.y)

  // Resolve target hero for ally/enemy targeting
  let targetHero: HeroSchema | undefined
  const range = def.range ?? 0
  if (def.targeting === 'self') {
    targetHero = hero
  } else if (def.targeting === 'ally' && heroes) {
    const allyFilter = (c: HeroSchema, sid: string) => sid !== sessionId && c.team === hero.team && !c.dead
    targetHero = resolveHeroTarget(target, heroes, range, allyFilter) ?? hero
  } else if (def.targeting === 'enemy' && heroes) {
    const enemyFilter = (c: HeroSchema) => c.team !== hero.team && !c.dead
    const resolved = resolveHeroTarget(target, heroes, range, enemyFilter)
    if (!resolved) return null // No enemy in range — skill fails, no CD consumed
    targetHero = resolved
  } else if (def.targeting === 'point' && range > 0) {
    const dx = target.x - hero.x
    const dy = target.y - hero.y
    if (dx * dx + dy * dy > range * range) return null
  }

  // Dispatch to registered effect handler by effectType
  const handler = getEffectHandler(def.effect.effectType)
  if (!handler) {
    logger.warn('No effect handler registered', { effectType: def.effect.effectType, skillId })
    return null
  }

  handler.execute(
    {
      hero,
      casterId: sessionId,
      skillId,
      direction,
      targetPosition: target,
      projectiles,
      heroes,
      zones,
      projectileTracker: tracker,
      targetHero,
    },
    def.effect,
  )

  // Set cooldown
  setSlotCooldown(hero, slot, def.cooldown)

  return {
    casterId: sessionId,
    skillId,
    position: { x: hero.x, y: hero.y },
    direction,
  }
}

/**
 * Tick down all skill cooldowns for a hero.
 */
export function tickCooldowns(hero: HeroSchema, dt: number): void {
  if (hero.cooldownQ > 0) hero.cooldownQ = Math.max(0, hero.cooldownQ - dt)
  if (hero.cooldownE > 0) hero.cooldownE = Math.max(0, hero.cooldownE - dt)
  if (hero.cooldownR > 0) hero.cooldownR = Math.max(0, hero.cooldownR - dt)
}
