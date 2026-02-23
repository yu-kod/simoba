import {
  checkDeath,
  checkHeroDeath,
  updateRespawnTimer,
  respawn,
} from '@/domain/systems/deathRespawn'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { createMockCombatEntity } from '@/test/helpers/entityHelpers'

function makeHero(overrides: Partial<HeroState> = {}): HeroState {
  const base = createHeroState({
    id: 'hero-1',
    type: 'BLADE',
    team: 'blue',
    position: { x: 100, y: 200 },
  })
  return { ...base, ...overrides }
}

describe('checkDeath (generic)', () => {
  it('should set dead to true when HP is 0', () => {
    const entity = createMockCombatEntity({ hp: 0 })
    const result = checkDeath(entity)
    expect(result.dead).toBe(true)
  })

  it('should not change state if HP > 0', () => {
    const entity = createMockCombatEntity({ hp: 50 })
    const result = checkDeath(entity)
    expect(result).toBe(entity)
  })

  it('should not double-die if already dead', () => {
    const entity = createMockCombatEntity({ hp: 0, dead: true })
    const result = checkDeath(entity)
    expect(result).toBe(entity)
  })

  it('should return new object (immutable)', () => {
    const entity = createMockCombatEntity({ hp: 0 })
    const result = checkDeath(entity)
    expect(result).not.toBe(entity)
    expect(entity.dead).toBe(false)
  })
})

describe('checkHeroDeath', () => {
  it('should transition to dead when HP is 0', () => {
    const hero = makeHero({ hp: 0, position: { x: 500, y: 300 } })
    const result = checkHeroDeath(hero)
    expect(result.dead).toBe(true)
    expect(result.respawnTimer).toBe(5)
    expect(result.deathPosition).toEqual({ x: 500, y: 300 })
    expect(result.attackTargetId).toBeNull()
  })

  it('should not change state if HP > 0', () => {
    const hero = makeHero({ hp: 100 })
    const result = checkHeroDeath(hero)
    expect(result).toBe(hero)
  })

  it('should not double-die if already dead', () => {
    const hero = makeHero({ hp: 0, dead: true, respawnTimer: 3 })
    const result = checkHeroDeath(hero)
    expect(result).toBe(hero)
    expect(result.respawnTimer).toBe(3)
  })

  it('should use custom respawn time', () => {
    const hero = makeHero({ hp: 0 })
    const result = checkHeroDeath(hero, 10)
    expect(result.respawnTimer).toBe(10)
  })

  it('should return new object (immutable)', () => {
    const hero = makeHero({ hp: 0 })
    const result = checkHeroDeath(hero)
    expect(result).not.toBe(hero)
    expect(hero.dead).toBe(false)
  })
})

describe('updateRespawnTimer', () => {
  it('should decrement timer when dead', () => {
    const hero = makeHero({ dead: true, respawnTimer: 5 })
    const result = updateRespawnTimer(hero, 1)
    expect(result.respawnTimer).toBe(4)
  })

  it('should not change alive hero', () => {
    const hero = makeHero({ dead: false, respawnTimer: 0 })
    const result = updateRespawnTimer(hero, 1)
    expect(result).toBe(hero)
  })

  it('should allow timer to go below zero', () => {
    const hero = makeHero({ dead: true, respawnTimer: 0.3 })
    const result = updateRespawnTimer(hero, 0.5)
    expect(result.respawnTimer).toBeCloseTo(-0.2)
  })

  it('should return new object (immutable)', () => {
    const hero = makeHero({ dead: true, respawnTimer: 5 })
    const result = updateRespawnTimer(hero, 1)
    expect(result).not.toBe(hero)
    expect(hero.respawnTimer).toBe(5)
  })
})

describe('respawn', () => {
  it('should restore full HP and move to respawn position', () => {
    const hero = makeHero({ hp: 0, dead: true, respawnTimer: -0.1 })
    const result = respawn(hero, { x: 60, y: 360 })
    expect(result.dead).toBe(false)
    expect(result.hp).toBe(result.maxHp)
    expect(result.respawnTimer).toBe(0)
    expect(result.position).toEqual({ x: 60, y: 360 })
  })

  it('should reset attack state', () => {
    const hero = makeHero({
      hp: 0,
      dead: true,
      attackTargetId: 'enemy-1',
      attackCooldown: 1.5,
    })
    const result = respawn(hero, { x: 60, y: 360 })
    expect(result.attackTargetId).toBeNull()
    expect(result.attackCooldown).toBe(0)
  })

  it('should return new object (immutable)', () => {
    const hero = makeHero({ hp: 0, dead: true })
    const result = respawn(hero, { x: 60, y: 360 })
    expect(result).not.toBe(hero)
    expect(hero.dead).toBe(true)
  })
})
