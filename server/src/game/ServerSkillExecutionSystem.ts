import { MapSchema } from '@colyseus/schema'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { ProjectileSchema } from '../schema/ProjectileSchema.js'
import type { SkillEvent } from '@shared/messages'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { getEffectHandler } from './skills/skillEffectRegistry.js'
import { createServerLogger } from '@shared/logging'

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
 * Execute a skill from a hero's slot.
 * Returns a SkillEvent on success, or null if validation fails.
 */
export function executeSkill(
  hero: HeroSchema,
  sessionId: string,
  slot: SkillSlot,
  target: { x: number; y: number },
  projectiles?: MapSchema<ProjectileSchema>,
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
      direction,
      targetPosition: target,
      projectiles: projectiles ?? new MapSchema(),
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
