import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { processDeathAndRespawn } from '../game/ServerDeathSystem.js'
import { DEFAULT_RESPAWN_TIME } from '@shared/constants'

function createHero(id: string, overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.id = id
  hero.x = 100
  hero.y = 100
  hero.hp = 650
  hero.maxHp = 650
  hero.dead = false
  hero.team = 'blue'
  hero.attackTargetId = ''
  hero.attackCooldown = 0
  hero.respawnTimer = 0
  Object.assign(hero, overrides)
  return hero
}

const BLUE_SPAWN = { x: 320, y: 360 }
const RED_SPAWN = { x: 2880, y: 360 }

function getSpawnPosition(team: string): { x: number; y: number } {
  return team === 'blue' ? BLUE_SPAWN : RED_SPAWN
}

describe('ServerDeathSystem', () => {
  let heroes: MapSchema<HeroSchema>

  beforeEach(() => {
    heroes = new MapSchema<HeroSchema>()
  })

  describe('processDeathAndRespawn', () => {
    it('should mark hero as dead when hp <= 0', () => {
      const hero = createHero('hero-1', { hp: 0 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.dead).toBe(true)
      expect(hero.respawnTimer).toBe(DEFAULT_RESPAWN_TIME)
    })

    it('should clear attack state on death', () => {
      const hero = createHero('hero-1', { hp: 0, attackTargetId: 'enemy', attackCooldown: 0.5 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.attackTargetId).toBe('')
      expect(hero.attackCooldown).toBe(0)
    })

    it('should not mark alive hero as dead', () => {
      const hero = createHero('hero-1', { hp: 100 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.dead).toBe(false)
    })

    it('should decrement respawn timer for dead hero', () => {
      const hero = createHero('hero-1', { dead: true, hp: 0, respawnTimer: 3.0 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(hero.respawnTimer).toBeCloseTo(2.0, 2)
      expect(hero.dead).toBe(true)
    })

    it('should respawn hero when timer expires', () => {
      const hero = createHero('hero-1', { dead: true, hp: 0, respawnTimer: 0.5, team: 'blue', x: 500, y: 500 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(hero.dead).toBe(false)
      expect(hero.respawnTimer).toBe(0)
      expect(hero.hp).toBe(650) // maxHp
      expect(hero.x).toBe(BLUE_SPAWN.x)
      expect(hero.y).toBe(BLUE_SPAWN.y)
    })

    it('should respawn red team at red spawn', () => {
      const hero = createHero('hero-1', { dead: true, hp: 0, respawnTimer: 0.1, team: 'red', maxHp: 400 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(hero.x).toBe(RED_SPAWN.x)
      expect(hero.y).toBe(RED_SPAWN.y)
      expect(hero.hp).toBe(400)
    })

    it('should clear attack state on respawn', () => {
      const hero = createHero('hero-1', {
        dead: true, hp: 0, respawnTimer: 0.1,
        attackTargetId: 'old-target', attackCooldown: 0.5,
      })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(hero.attackTargetId).toBe('')
      expect(hero.attackCooldown).toBe(0)
    })

    it('should handle multiple heroes independently', () => {
      const alive = createHero('alive', { hp: 500 })
      const dying = createHero('dying', { hp: 0 })
      const dead = createHero('dead', { dead: true, hp: 0, respawnTimer: 3.0 })
      heroes.set('alive', alive)
      heroes.set('dying', dying)
      heroes.set('dead', dead)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(alive.dead).toBe(false)
      expect(dying.dead).toBe(true)
      expect(dying.respawnTimer).toBe(DEFAULT_RESPAWN_TIME)
      expect(dead.dead).toBe(true)
      expect(dead.respawnTimer).toBeCloseTo(2.0, 2)
    })
  })
})
