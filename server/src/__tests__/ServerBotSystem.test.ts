import { describe, it, expect } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { MinionSchema } from '../schema/MinionSchema.js'
import { findBotTarget, generateBotInput, generateBotInputs } from '../game/ServerBotSystem.js'

function createHero(overrides: Partial<HeroSchema> & { id: string }): HeroSchema {
  const hero = new HeroSchema()
  hero.id = overrides.id
  hero.x = overrides.x ?? 0
  hero.y = overrides.y ?? 0
  hero.team = overrides.team ?? 'blue'
  hero.dead = overrides.dead ?? false
  hero.radius = overrides.radius ?? 20
  hero.attackRange = overrides.attackRange ?? 100
  hero.isBot = overrides.isBot ?? false
  hero.speed = overrides.speed ?? 300
  return hero
}

function createTower(overrides: { id: string; team: string; x: number; y: number; dead?: boolean }): TowerSchema {
  const tower = new TowerSchema()
  tower.id = overrides.id
  tower.x = overrides.x
  tower.y = overrides.y
  tower.team = overrides.team
  tower.dead = overrides.dead ?? false
  tower.radius = 30
  return tower
}

function createMinion(overrides: { id: string; team: string; x: number; y: number; dead?: boolean }): MinionSchema {
  const minion = new MinionSchema()
  minion.id = overrides.id
  minion.x = overrides.x
  minion.y = overrides.y
  minion.team = overrides.team
  minion.dead = overrides.dead ?? false
  minion.radius = 12
  return minion
}

describe('ServerBotSystem', () => {
  describe('findBotTarget', () => {
    it('returns nearest enemy minion when available', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300 })
      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)

      const towers = new MapSchema<TowerSchema>()
      const minions = new MapSchema<MinionSchema>()
      minions.set('m1', createMinion({ id: 'm1', team: 'blue', x: 400, y: 300 }))
      minions.set('m2', createMinion({ id: 'm2', team: 'blue', x: 600, y: 300 }))

      const target = findBotTarget(bot, heroes, towers, minions)
      expect(target).not.toBeNull()
      expect(target!.id).toBe('m1') // closer
    })

    it('ignores same-team entities', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300 })
      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)

      const towers = new MapSchema<TowerSchema>()
      towers.set('t1', createTower({ id: 't1', team: 'red', x: 400, y: 300 }))

      const minions = new MapSchema<MinionSchema>()
      minions.set('m1', createMinion({ id: 'm1', team: 'red', x: 450, y: 300 }))

      const target = findBotTarget(bot, heroes, towers, minions)
      expect(target).toBeNull()
    })

    it('ignores dead entities', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300 })
      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)

      const towers = new MapSchema<TowerSchema>()
      const minions = new MapSchema<MinionSchema>()
      minions.set('m1', createMinion({ id: 'm1', team: 'blue', x: 400, y: 300, dead: true }))

      const target = findBotTarget(bot, heroes, towers, minions)
      expect(target).toBeNull()
    })

    it('targets enemy hero when no minions available', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300 })
      const player = createHero({ id: 'player-1', team: 'blue', x: 400, y: 300 })

      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)
      heroes.set('player-1', player)

      const towers = new MapSchema<TowerSchema>()
      const minions = new MapSchema<MinionSchema>()

      const target = findBotTarget(bot, heroes, towers, minions)
      expect(target).not.toBeNull()
      expect(target!.id).toBe('player-1')
    })

    it('targets enemy tower as last resort', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300 })
      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)

      const towers = new MapSchema<TowerSchema>()
      towers.set('tower-blue', createTower({ id: 'tower-blue', team: 'blue', x: 200, y: 300 }))

      const minions = new MapSchema<MinionSchema>()

      const target = findBotTarget(bot, heroes, towers, minions)
      expect(target).not.toBeNull()
      expect(target!.id).toBe('tower-blue')
    })
  })

  describe('generateBotInput', () => {
    it('moves toward target when out of range', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300, attackRange: 100 })
      const target = { id: 'player-1', x: 200, y: 300, dead: false, team: 'blue', radius: 20 }

      const input = generateBotInput(bot, target)
      expect(input.moveDir.x).toBeLessThan(0) // moving left
      expect(input.attackTargetId).toBeNull()
    })

    it('attacks when in range', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300, attackRange: 200, radius: 20 })
      const target = { id: 'player-1', x: 550, y: 300, dead: false, team: 'blue', radius: 20 }

      const input = generateBotInput(bot, target)
      expect(input.moveDir).toEqual({ x: 0, y: 0 })
      expect(input.attackTargetId).toBe('player-1')
    })
  })

  describe('generateBotInputs', () => {
    it('generates inputs only for bot heroes', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300, isBot: true, attackRange: 100 })
      const player = createHero({ id: 'player-1', team: 'blue', x: 200, y: 300 })

      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)
      heroes.set('player-1', player)

      const towers = new MapSchema<TowerSchema>()
      const minions = new MapSchema<MinionSchema>()

      const inputs = generateBotInputs(heroes, towers, minions)
      expect(inputs.size).toBe(1)
      expect(inputs.has('bot-red-0')).toBe(true)
      expect(inputs.has('player-1')).toBe(false)
    })

    it('skips dead bots', () => {
      const bot = createHero({ id: 'bot-red-0', team: 'red', x: 500, y: 300, isBot: true, dead: true })
      const player = createHero({ id: 'player-1', team: 'blue', x: 200, y: 300 })

      const heroes = new MapSchema<HeroSchema>()
      heroes.set('bot-red-0', bot)
      heroes.set('player-1', player)

      const towers = new MapSchema<TowerSchema>()
      const minions = new MapSchema<MinionSchema>()

      const inputs = generateBotInputs(heroes, towers, minions)
      expect(inputs.size).toBe(0)
    })

    it('returns empty map when no bots exist', () => {
      const player = createHero({ id: 'player-1', team: 'blue', x: 200, y: 300 })

      const heroes = new MapSchema<HeroSchema>()
      heroes.set('player-1', player)

      const towers = new MapSchema<TowerSchema>()
      const minions = new MapSchema<MinionSchema>()

      const inputs = generateBotInputs(heroes, towers, minions)
      expect(inputs.size).toBe(0)
    })
  })
})
