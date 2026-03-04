import { describe, it, expect } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { TowerSchema } from '../schema/TowerSchema.js'
import { MinionSchema } from '../schema/MinionSchema.js'
import { applyDamageToTarget } from '../game/combatUtils.js'

function createHero(overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = new HeroSchema()
  hero.hp = 500
  hero.maxHp = 500
  hero.dead = false
  hero.team = 'blue'
  hero.radius = 22
  hero.lastAttackerSessionId = ''
  Object.assign(hero, overrides)
  return hero
}

describe('applyDamageToTarget — lastAttackerSessionId tracking', () => {
  it('records attacker sessionId when a hero damages another hero', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const target = createHero({ team: 'red' })
    heroes.set('target', target)

    applyDamageToTarget('target', 50, heroes, towers, undefined, 'attacker-session')

    expect(target.lastAttackerSessionId).toBe('attacker-session')
    expect(target.hp).toBe(450)
  })

  it('does not update lastAttackerSessionId when attackerSessionId is not provided', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const target = createHero({ team: 'red' })
    heroes.set('target', target)

    applyDamageToTarget('target', 50, heroes, towers)

    expect(target.lastAttackerSessionId).toBe('')
  })

  it('overwrites lastAttackerSessionId with tower ID on tower projectile hit (no XP because tower ID not in heroes map)', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const target = createHero({ team: 'red', lastAttackerSessionId: 'prev-attacker' })
    heroes.set('target', target)

    applyDamageToTarget('target', 50, heroes, towers, undefined, 'tower-blue-1')

    expect(target.lastAttackerSessionId).toBe('tower-blue-1')
  })

  it('overwrites previous attacker when a new hero deals damage', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const target = createHero({ team: 'red', lastAttackerSessionId: 'hero-a' })
    heroes.set('target', target)

    applyDamageToTarget('target', 30, heroes, towers, undefined, 'hero-b')

    expect(target.lastAttackerSessionId).toBe('hero-b')
  })

  it('does not set lastAttackerSessionId on non-hero targets (tower)', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const tower = new TowerSchema()
    tower.hp = 1000
    tower.maxHp = 1000
    tower.dead = false
    tower.team = 'red'
    towers.set('tower-1', tower)

    applyDamageToTarget('tower-1', 100, heroes, towers, undefined, 'attacker-session')

    expect(tower.hp).toBe(900)
    // TowerSchema has no lastAttackerSessionId — just verify no error
  })

  it('does not set lastAttackerSessionId on non-hero targets (minion)', () => {
    const heroes = new MapSchema<HeroSchema>()
    const towers = new MapSchema<TowerSchema>()
    const minions = new MapSchema<MinionSchema>()
    const minion = new MinionSchema()
    minion.hp = 200
    minion.maxHp = 200
    minion.dead = false
    minion.team = 'red'
    minions.set('minion-1', minion)

    applyDamageToTarget('minion-1', 50, heroes, towers, minions, 'attacker-session')

    expect(minion.hp).toBe(150)
    // MinionSchema has no lastAttackerSessionId — just verify no error
  })
})
