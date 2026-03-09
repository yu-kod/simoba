import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { ProjectileSchema } from '../schema/ProjectileSchema.js'
import { executeSkill, tickCooldowns } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'
import { getSkillDefinition } from '@shared/skills/skillDefinitions'

// Register handlers once before tests run
beforeEach(() => {
  // registerAllEffectHandlers is idempotent — safe to call multiple times
  registerAllEffectHandlers()
})

function createHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.x = 100
  hero.y = 200
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.heroType = 'BLADE'
  hero.skillSlotQ = 'blade-charge'
  hero.skillSlotE = ''
  hero.skillSlotR = ''
  hero.cooldownQ = 0
  hero.cooldownE = 0
  hero.cooldownR = 0
  Object.assign(hero, overrides)
  return hero
}

describe('getSkillDefinition', () => {
  it('should return bolt-dash definition with correct params', () => {
    const def = getSkillDefinition('bolt-dash')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-dash')
    expect(def!.targeting).toBe('direction')
    expect(def!.cooldown).toBe(6)
    expect(def!.effect.effectType).toBe('dash')
    expect(def!.effect.distance).toBe(180)
    expect(def!.effect.duration).toBe(0.05)
    expect(def!.effect.damage).toBe(0)
  })

  it('should return blade-charge definition', () => {
    const def = getSkillDefinition('blade-charge')
    expect(def).toBeDefined()
    expect(def!.effect.damage).toBe(80)
  })

  it('should return undefined for unknown skill', () => {
    expect(getSkillDefinition('nonexistent')).toBeUndefined()
  })

  it('should return bolt-pierce-shot definition with projectile params', () => {
    const def = getSkillDefinition('bolt-pierce-shot')
    expect(def).toBeDefined()
    expect(def!.id).toBe('bolt-pierce-shot')
    expect(def!.targeting).toBe('direction')
    expect(def!.cooldown).toBe(5)
    expect(def!.effect.effectType).toBe('projectile')
    if (def!.effect.effectType === 'projectile') {
      expect(def!.effect.damage).toBe(60)
      expect(def!.effect.speed).toBe(800)
      expect(def!.effect.range).toBe(600)
      expect(def!.effect.radius).toBe(5)
      expect(def!.effect.pierceCount).toBe(3)
      expect(def!.effect.homing).toBe(false)
      expect(def!.effect.visualType).toBe('diamond')
    }
  })
})

describe('executeSkill', () => {
  it('should execute blade-charge and return SkillEvent', () => {
    const hero = createHero()
    const event = executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(event).not.toBeNull()
    expect(event!.casterId).toBe('player-1')
    expect(event!.skillId).toBe('blade-charge')
    expect(event!.position).toEqual({ x: 100, y: 200 })
    expect(event!.direction.x).toBeCloseTo(1)
    expect(event!.direction.y).toBeCloseTo(0)
  })

  it('should set cooldown after successful execution', () => {
    const hero = createHero()
    executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(hero.cooldownQ).toBe(8)
  })

  it('should set dash state on hero after Charge', () => {
    const hero = createHero()
    executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(hero.dashTimer).toBeCloseTo(0.3)
    expect(hero.dashDirX).toBeCloseTo(1)
    expect(hero.dashDirY).toBeCloseTo(0)
    expect(hero.dashSpeed).toBeCloseTo(300 / 0.3)
    expect(hero.dashDamage).toBe(80)
  })

  it('should reject when hero is dead', () => {
    const hero = createHero()
    hero.dead = true
    const event = executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(event).toBeNull()
  })

  it('should reject when slot is empty', () => {
    const hero = createHero()
    const event = executeSkill(hero, 'player-1', 'E', { x: 400, y: 200 })
    expect(event).toBeNull()
  })

  it('should reject when cooldown is active', () => {
    const hero = createHero()
    hero.cooldownQ = 5
    const event = executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(event).toBeNull()
    expect(hero.cooldownQ).toBe(5) // unchanged
  })

  it('should reject unknown skill ID', () => {
    const hero = createHero()
    hero.skillSlotQ = 'unknown-skill'
    const event = executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(event).toBeNull()
  })

  it('should reject when dashing', () => {
    const hero = createHero()
    hero.dashTimer = 0.2
    const event = executeSkill(hero, 'player-1', 'Q', { x: 400, y: 200 })
    expect(event).toBeNull()
  })
})

describe('executeSkill — bolt-dash', () => {
  it('should return valid SkillEvent for bolt-dash', () => {
    const hero = createHero({ hp: 500, maxHp: 500, heroType: 'BOLT', skillSlotQ: 'bolt-dash' })
    const event = executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 })
    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-dash')
  })

  it('should set dash state with zero damage', () => {
    const hero = createHero({ hp: 500, maxHp: 500, heroType: 'BOLT', skillSlotQ: 'bolt-dash' })
    executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 })
    expect(hero.dashTimer).toBeCloseTo(0.05)
    expect(hero.dashDirX).toBeCloseTo(1)
    expect(hero.dashDirY).toBeCloseTo(0)
    expect(hero.dashSpeed).toBeCloseTo(180 / 0.05)
    expect(hero.dashDamage).toBe(0)
  })

  it('should set cooldown to 6 seconds', () => {
    const hero = createHero({ hp: 500, maxHp: 500, heroType: 'BOLT', skillSlotQ: 'bolt-dash' })
    executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 })
    expect(hero.cooldownQ).toBe(6)
  })
})

describe('executeSkill — bolt-pierce-shot', () => {
  it('should return valid SkillEvent and spawn projectile', () => {
    const hero = createHero({ heroType: 'BOLT', skillSlotQ: 'bolt-pierce-shot' })
    const projectiles = new MapSchema<ProjectileSchema>()
    const event = executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 }, projectiles)
    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('bolt-pierce-shot')
    expect(event!.direction.x).toBeCloseTo(1)
    expect(event!.direction.y).toBeCloseTo(0)

    // Projectile should be created in the map
    expect(projectiles.size).toBe(1)
    const proj = [...projectiles.values()][0]
    expect(proj.mode).toBe('linear')
    expect(proj.dirX).toBeCloseTo(1)
    expect(proj.dirY).toBeCloseTo(0)
    expect(proj.speed).toBe(800)
    expect(proj.damage).toBe(60)
    expect(proj.maxRange).toBe(600)
    expect(proj.pierceRemaining).toBe(3)
    expect(proj.team).toBe(hero.team)
    expect(proj.ownerId).toBe('bolt-1')
    expect(proj.radius).toBe(5)
    expect(proj.visualType).toBe('diamond')
  })

  it('should set cooldown to 5 seconds', () => {
    const hero = createHero({ heroType: 'BOLT', skillSlotQ: 'bolt-pierce-shot' })
    const projectiles = new MapSchema<ProjectileSchema>()
    executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 }, projectiles)
    expect(hero.cooldownQ).toBe(5)
  })

  it('should reject when dead', () => {
    const hero = createHero({ heroType: 'BOLT', skillSlotQ: 'bolt-pierce-shot', dead: true })
    const projectiles = new MapSchema<ProjectileSchema>()
    const event = executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 }, projectiles)
    expect(event).toBeNull()
    expect(projectiles.size).toBe(0)
  })

  it('should reject when cooldown is active', () => {
    const hero = createHero({ heroType: 'BOLT', skillSlotQ: 'bolt-pierce-shot', cooldownQ: 3 })
    const projectiles = new MapSchema<ProjectileSchema>()
    const event = executeSkill(hero, 'bolt-1', 'Q', { x: 400, y: 200 }, projectiles)
    expect(event).toBeNull()
    expect(projectiles.size).toBe(0)
  })
})

describe('executeSkill — aura-heal', () => {
  function createAuraHero(overrides: Partial<Record<string, unknown>> = {}): HeroSchema {
    return createHero({
      heroType: 'AURA',
      team: 'blue',
      hp: 300,
      maxHp: 500,
      skillSlotQ: 'aura-heal',
      ...overrides,
    })
  }

  it('should return valid SkillEvent for aura-heal definition', () => {
    const def = getSkillDefinition('aura-heal')
    expect(def).toBeDefined()
    expect(def!.targeting).toBe('ally')
    expect(def!.cooldown).toBe(10)
    expect(def!.effect.effectType).toBe('heal')
    if (def!.effect.effectType === 'heal') {
      expect(def!.effect.healAmount).toBe(120)
      expect(def!.effect.range).toBe(400)
    }
  })

  it('should heal the nearest ally within range', () => {
    const caster = createAuraHero({ x: 100, y: 100, hp: 500, maxHp: 500 })
    const ally = createAuraHero({ x: 300, y: 100, hp: 200, maxHp: 500 })
    ally.team = 'blue'

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    // Click near ally position (within range 400)
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 300, y: 100 }, undefined, heroes)
    expect(event).not.toBeNull()
    expect(event!.skillId).toBe('aura-heal')
    expect(ally.hp).toBe(320) // 200 + 120
  })

  it('should fall back to self-heal when no ally in range', () => {
    const caster = createAuraHero({ x: 100, y: 100 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    // No ally in heroes map

    const event = executeSkill(caster, 'caster-1', 'Q', { x: 800, y: 800 }, undefined, heroes)
    expect(event).not.toBeNull()
    expect(caster.hp).toBe(420) // 300 + 120
  })

  it('should heal ally near click even when ally is far from caster', () => {
    const caster = createAuraHero({ x: 100, y: 100 })
    const ally = createAuraHero({ x: 600, y: 100, hp: 200, maxHp: 500 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    // Click at ally position — distance from click to ally is 0, within range
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 600, y: 100 }, undefined, heroes)
    expect(event).not.toBeNull()
    expect(ally.hp).toBe(320)
  })

  it('should fall back to self-heal when ally is far from click', () => {
    const caster = createAuraHero({ x: 100, y: 100 })
    const ally = createAuraHero({ x: 100, y: 200, hp: 200, maxHp: 500 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    // Click at (900, 900), ally at (100, 200) — distance ~922px > range 400
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 900, y: 900 }, undefined, heroes)
    expect(event).not.toBeNull()
    expect(ally.hp).toBe(200) // NOT healed
    expect(caster.hp).toBe(420) // self-heal fallback
  })

  it('should clamp heal to maxHp', () => {
    const caster = createAuraHero({ x: 100, y: 100, hp: 450, maxHp: 500 })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    executeSkill(caster, 'caster-1', 'Q', { x: 100, y: 100 }, undefined, heroes)
    expect(caster.hp).toBe(500) // clamped to maxHp
  })

  it('should not heal dead allies', () => {
    const caster = createAuraHero({ x: 100, y: 100, hp: 500, maxHp: 500 })
    const ally = createAuraHero({ x: 200, y: 100, hp: 0, maxHp: 500, dead: true })

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('ally-1', ally)

    // Click near dead ally — dead allies are excluded from target resolution
    const event = executeSkill(caster, 'caster-1', 'Q', { x: 200, y: 100 }, undefined, heroes)
    expect(event).not.toBeNull()
    expect(ally.hp).toBe(0) // not healed
    expect(caster.hp).toBe(500) // self-heal fallback, but already full
  })

  it('should not target enemies as ally', () => {
    const caster = createAuraHero({ x: 100, y: 100 })
    const enemy = createAuraHero({ x: 200, y: 100, hp: 200, maxHp: 500 })
    enemy.team = 'red'

    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)
    heroes.set('enemy-1', enemy)

    executeSkill(caster, 'caster-1', 'Q', { x: 200, y: 100 }, undefined, heroes)
    expect(enemy.hp).toBe(200) // not healed
    expect(caster.hp).toBe(420) // self-heal fallback
  })

  it('should set cooldown to 10 seconds after heal', () => {
    const caster = createAuraHero({ x: 100, y: 100 })
    const heroes = new MapSchema<HeroSchema>()
    heroes.set('caster-1', caster)

    executeSkill(caster, 'caster-1', 'Q', { x: 100, y: 100 }, undefined, heroes)
    expect(caster.cooldownQ).toBe(10)
  })
})

describe('tickCooldowns', () => {
  it('should decrement cooldowns by dt', () => {
    const hero = createHero()
    hero.cooldownQ = 5
    hero.cooldownE = 3
    hero.cooldownR = 1
    tickCooldowns(hero, 0.1)
    expect(hero.cooldownQ).toBeCloseTo(4.9)
    expect(hero.cooldownE).toBeCloseTo(2.9)
    expect(hero.cooldownR).toBeCloseTo(0.9)
  })

  it('should clamp cooldowns to 0', () => {
    const hero = createHero()
    hero.cooldownQ = 0.05
    tickCooldowns(hero, 0.1)
    expect(hero.cooldownQ).toBe(0)
  })

  it('should not modify cooldowns already at 0', () => {
    const hero = createHero()
    tickCooldowns(hero, 0.1)
    expect(hero.cooldownQ).toBe(0)
    expect(hero.cooldownE).toBe(0)
    expect(hero.cooldownR).toBe(0)
  })
})
