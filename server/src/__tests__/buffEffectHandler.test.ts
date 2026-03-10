import { describe, it, expect } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { StatusEffectSchema } from '../schema/StatusEffectSchema.js'
import { buffEffectHandler } from '../game/skills/handlers/buffEffectHandler.js'
import type { BuffEffectParams } from '@shared/skills/skillDefinitions'
import type { SkillExecutionContext } from '../game/skills/SkillEffectHandler.js'

const HASTE_PARAMS: BuffEffectParams = {
  effectType: 'buff',
  buffType: 'speed',
  value: 80,
  duration: 3,
  isDebuff: false,
}

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  hero.team = 'blue'
  hero.skillSlotQ = 'aura-haste'
  Object.assign(hero, overrides)
  return hero
}

function createContext(
  hero: HeroSchema,
  overrides: Partial<SkillExecutionContext> = {},
): SkillExecutionContext {
  return {
    hero,
    casterId: 'caster-1',
    skillId: 'aura-haste',
    direction: { x: 1, y: 0 },
    targetPosition: { x: 200, y: 100 },
    projectiles: new MapSchema<ProjectileSchema>(),
    heroes: new MapSchema<HeroSchema>(),
    ...overrides,
  }
}

describe('buffEffectHandler', () => {
  it('should have effectType "buff"', () => {
    expect(buffEffectHandler.effectType).toBe('buff')
  })

  it('should apply buff to targetHero', () => {
    const caster = createHero()
    const ally = createHero({ hp: 300, maxHp: 500 })
    const ctx = createContext(caster, { targetHero: ally })

    buffEffectHandler.execute(ctx, HASTE_PARAMS)

    const effect = ally.statusEffects.get('aura-haste')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('speed')
    expect(effect!.value).toBe(80)
    expect(effect!.remainingDuration).toBe(3)
    expect(effect!.isDebuff).toBe(false)
  })

  it('should fall back to self when no targetHero', () => {
    const caster = createHero()
    const ctx = createContext(caster)

    buffEffectHandler.execute(ctx, HASTE_PARAMS)

    const effect = caster.statusEffects.get('aura-haste')
    expect(effect).toBeDefined()
    expect(effect!.buffType).toBe('speed')
    expect(effect!.value).toBe(80)
  })

  it('should refresh duration on duplicate application', () => {
    const caster = createHero()
    const ally = createHero()

    // Apply first time
    const existing = new StatusEffectSchema()
    existing.id = 'aura-haste'
    existing.buffType = 'speed'
    existing.value = 80
    existing.remainingDuration = 1.5
    existing.isDebuff = false
    ally.statusEffects.set('aura-haste', existing)

    const ctx = createContext(caster, { targetHero: ally })
    buffEffectHandler.execute(ctx, HASTE_PARAMS)

    // Should refresh, not create new
    expect(ally.statusEffects.size).toBe(1)
    const effect = ally.statusEffects.get('aura-haste')!
    expect(effect.remainingDuration).toBe(3)
    expect(effect.value).toBe(80)
  })

  it('should apply additionalBuffs as separate status effects', () => {
    const caster = createHero()
    const furyParams: BuffEffectParams = {
      effectType: 'buff',
      buffType: 'attackDamage',
      value: 25,
      duration: 5,
      isDebuff: false,
      additionalBuffs: [
        { buffType: 'attackSpeed', value: 0.5 },
      ],
    }
    const ctx = createContext(caster, { skillId: 'blade-fury' })

    buffEffectHandler.execute(ctx, furyParams)

    // Primary buff keyed by skillId
    const primary = caster.statusEffects.get('blade-fury')
    expect(primary).toBeDefined()
    expect(primary!.buffType).toBe('attackDamage')
    expect(primary!.value).toBe(25)
    expect(primary!.remainingDuration).toBe(5)

    // Additional buff keyed by ${skillId}:${buffType}
    const extra = caster.statusEffects.get('blade-fury:attackSpeed')
    expect(extra).toBeDefined()
    expect(extra!.buffType).toBe('attackSpeed')
    expect(extra!.value).toBe(0.5)
    expect(extra!.remainingDuration).toBe(5)
  })

  it('should refresh all buffs including additionalBuffs on recast', () => {
    const caster = createHero()
    const furyParams: BuffEffectParams = {
      effectType: 'buff',
      buffType: 'attackDamage',
      value: 25,
      duration: 5,
      isDebuff: false,
      additionalBuffs: [
        { buffType: 'attackSpeed', value: 0.5 },
      ],
    }
    const ctx = createContext(caster, { skillId: 'blade-fury' })

    buffEffectHandler.execute(ctx, furyParams)

    // Simulate time passing
    caster.statusEffects.get('blade-fury')!.remainingDuration = 1
    caster.statusEffects.get('blade-fury:attackSpeed')!.remainingDuration = 1

    // Recast
    buffEffectHandler.execute(ctx, furyParams)

    expect(caster.statusEffects.get('blade-fury')!.remainingDuration).toBe(5)
    expect(caster.statusEffects.get('blade-fury:attackSpeed')!.remainingDuration).toBe(5)
  })

  it('should not create additionalBuffs when not present in params', () => {
    const caster = createHero()
    const ctx = createContext(caster)

    buffEffectHandler.execute(ctx, HASTE_PARAMS)

    expect(caster.statusEffects.size).toBe(1)
    expect(caster.statusEffects.get('aura-haste')).toBeDefined()
  })

  it('should set isDebuff flag correctly for debuffs', () => {
    const caster = createHero()
    const target = createHero()
    const debuffParams: BuffEffectParams = {
      effectType: 'buff',
      buffType: 'speed',
      value: -50,
      duration: 2,
      isDebuff: true,
    }
    const ctx = createContext(caster, { targetHero: target, skillId: 'aura-slow' })

    buffEffectHandler.execute(ctx, debuffParams)

    const effect = target.statusEffects.get('aura-slow')
    expect(effect).toBeDefined()
    expect(effect!.isDebuff).toBe(true)
    expect(effect!.value).toBe(-50)
  })
})
