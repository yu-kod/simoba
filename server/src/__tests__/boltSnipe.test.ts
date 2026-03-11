import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { ZoneSchema } from '../schema/ZoneSchema.js'
import { executeSkill } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'
import { ProjectileTracker } from '../game/ProjectileTracker.js'
import { BOLT_TALENT_TREE } from '@shared/talents/boltTalents'

let tracker: ProjectileTracker

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  hero.team = 'blue'
  hero.x = 400
  hero.y = 300
  hero.radius = 22
  hero.heroType = 'BOLT'
  hero.skillSlotQ = 'bolt-snipe'
  Object.assign(hero, overrides)
  return hero
}

beforeEach(() => {
  registerAllEffectHandlers()
  tracker = new ProjectileTracker()
})

// ── Skill definition ──

describe('getSkillDefinition — bolt-snipe', () => {
  it('should return bolt-snipe definition with correct params', () => {
    const def = getSkillDefinition('bolt-snipe')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-snipe')
    expect(def!.targeting).toBe('self')
    expect(def!.cooldown).toBe(16)
    if (def!.effect.effectType === 'buff') {
      expect(def!.effect.buffType).toBe('attackDamage')
      expect(def!.effect.value).toBe(20)
      expect(def!.effect.duration).toBe(5)
      expect(def!.effect.isDebuff).toBe(false)
    }
  })

  it('should have additionalBuffs with attackSpeed and speed', () => {
    const def = getSkillDefinition('bolt-snipe')
    expect(def).toBeDefined()
    if (def!.effect.effectType === 'buff') {
      const extras = def!.effect.additionalBuffs
      expect(extras).toBeDefined()
      expect(extras).toHaveLength(2)
      expect(extras![0]).toEqual({ buffType: 'attackSpeed', value: 0.4 })
      expect(extras![1]).toEqual({ buffType: 'speed', value: -60 })
    }
  })
})

// ── Skill execution ──

describe('executeSkill — bolt-snipe', () => {
  it('should apply three status effects on activation', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-snipe')

    // Primary buff: attackDamage
    const adBuff = caster.statusEffects.get('bolt-snipe')
    expect(adBuff).toBeDefined()
    expect(adBuff!.buffType).toBe('attackDamage')
    expect(adBuff!.value).toBe(20)
    expect(adBuff!.remainingDuration).toBe(5)

    // Additional: attackSpeed
    const asBuff = caster.statusEffects.get('bolt-snipe:attackSpeed')
    expect(asBuff).toBeDefined()
    expect(asBuff!.buffType).toBe('attackSpeed')
    expect(asBuff!.value).toBe(0.4)
    expect(asBuff!.remainingDuration).toBe(5)

    // Additional: speed (negative = penalty)
    const speedBuff = caster.statusEffects.get('bolt-snipe:speed')
    expect(speedBuff).toBeDefined()
    expect(speedBuff!.buffType).toBe('speed')
    expect(speedBuff!.value).toBe(-60)
    expect(speedBuff!.remainingDuration).toBe(5)
  })

  it('should set cooldown to 16 seconds', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(caster.cooldownQ).toBe(16)
  })

  it('should reject activation while dashing', () => {
    const caster = createHero({ dashTimer: 0.2 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    expect(event).toBeNull()
    expect(caster.statusEffects.size).toBe(0)
  })

  it('should refresh buffs when activated again (overwrite duration)', () => {
    const caster = createHero()
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    // First activation
    executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    // Simulate time passing — reduce remaining duration
    const adBuff = caster.statusEffects.get('bolt-snipe')!
    adBuff.remainingDuration = 1.0

    // Reset cooldown to allow re-cast
    caster.cooldownQ = 0

    // Second activation
    executeSkill(caster, 'caster-1', 'Q', { x: 400, y: 300 }, new MapSchema<ProjectileSchema>(), heroes, tracker, new MapSchema<ZoneSchema>())

    // Duration should be refreshed to full
    expect(caster.statusEffects.get('bolt-snipe')!.remainingDuration).toBe(5)
  })
})

// ── Talent node ──

describe('BOLT talent tree — bolt-snipe node', () => {
  it('should have bolt-snipe node at Depth 5 with correct properties', () => {
    const node = BOLT_TALENT_TREE.nodes.find(n => n.id === 'bolt-snipe')
    expect(node).toBeDefined()
    expect(node!.cost).toBe(2)
    expect(node!.prerequisites).toEqual(['bolt-eagle-eye'])
    expect(node!.effects).toEqual([{ type: 'grant_skill', skillId: 'bolt-snipe' }])
  })
})
