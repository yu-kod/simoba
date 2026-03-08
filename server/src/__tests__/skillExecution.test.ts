import { describe, it, expect, beforeEach } from 'vitest'
import { HeroSchema } from '../schema/HeroSchema.js'
import { executeSkill, tickCooldowns } from '../game/ServerSkillExecutionSystem.js'
import { registerAllEffectHandlers } from '../game/skills/handlers/index.js'

// Register handlers once before tests run
beforeEach(() => {
  // registerAllEffectHandlers is idempotent — safe to call multiple times
  registerAllEffectHandlers()
})

function createHero(): HeroSchema {
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
  return hero
}

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
