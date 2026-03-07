import { describe, it, expect, beforeEach } from 'vitest'
import { MapSchema } from '@colyseus/schema'
import { HeroSchema } from '../schema/HeroSchema.js'
import { processDeathAndRespawn } from '../game/ServerDeathSystem.js'
import { RESPAWN_TIMES, HERO_KILL_XP_REWARD, XP_THRESHOLDS } from '@shared/constants'

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

/** Create a hero that just took lethal damage (dead=true, hp=0 via applyDamage). */
function createLethalHero(id: string, overrides: Partial<Record<keyof HeroSchema, unknown>> = {}): HeroSchema {
  const hero = createHero(id, overrides)
  hero.applyDamage(hero.hp)
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
    it('should set respawn timer for newly dead hero based on level', () => {
      const hero = createLethalHero('hero-1')
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.dead).toBe(true)
      expect(hero.respawnTimer).toBe(RESPAWN_TIMES[0]) // Level 0 = 0s (instant)
    })

    it('should clear attack state on death', () => {
      const hero = createLethalHero('hero-1', { attackTargetId: 'enemy', attackCooldown: 0.5 })
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

    it('should return DeathEvent(death) when hero dies', () => {
      const hero = createLethalHero('hero-1', { x: 500, y: 300 })
      heroes.set('hero-1', hero)

      const events = processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        kind: 'death',
        event: { entityId: 'hero-1', type: 'death', position: { x: 500, y: 300 } },
      })
    })

    it('should return DeathEvent(respawn) when hero respawns', () => {
      const hero = createHero('hero-1', { dead: true, hp: 0, respawnTimer: 0.1, team: 'blue' })
      heroes.set('hero-1', hero)

      const events = processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        kind: 'death',
        event: { entityId: 'hero-1', type: 'respawn', position: { x: BLUE_SPAWN.x, y: BLUE_SPAWN.y } },
      })
    })

    it('should return empty events when no death or respawn', () => {
      const hero = createHero('hero-1', { hp: 500 })
      heroes.set('hero-1', hero)

      const events = processDeathAndRespawn(heroes, getSpawnPosition, 0.1)
      expect(events).toHaveLength(0)
    })

    it('should handle multiple heroes independently', () => {
      const alive = createHero('alive', { hp: 500 })
      const dying = createLethalHero('dying')
      const dead = createHero('dead', { dead: true, hp: 0, respawnTimer: 3.0 })
      heroes.set('alive', alive)
      heroes.set('dying', dying)
      heroes.set('dead', dead)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(alive.dead).toBe(false)
      expect(dying.dead).toBe(true)
      expect(dying.respawnTimer).toBe(RESPAWN_TIMES[0]) // Level 0 = 0s
      expect(dead.dead).toBe(true)
      expect(dead.respawnTimer).toBeCloseTo(2.0, 2)
    })

    it('should use level-dependent respawn time for level 0 hero', () => {
      const hero = createLethalHero('hero-1', { level: 0 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.respawnTimer).toBe(RESPAWN_TIMES[0]) // 0s
    })

    it('should use level-dependent respawn time for level 1 hero', () => {
      const hero = createLethalHero('hero-1', { level: 1 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.respawnTimer).toBe(RESPAWN_TIMES[1]) // 3s
    })

    it('should use level-dependent respawn time for level 3 hero', () => {
      const hero = createLethalHero('hero-1', { level: 3 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.respawnTimer).toBe(RESPAWN_TIMES[3]) // 8s
    })

    it('should use level-dependent respawn time for level 5 hero', () => {
      const hero = createLethalHero('hero-1', { level: 5 })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(hero.respawnTimer).toBe(RESPAWN_TIMES[5]) // 15s
    })
  })

  describe('hero kill XP', () => {
    it('should grant HERO_KILL_XP_REWARD to killer on hero death', () => {
      const victim = createLethalHero('victim', { team: 'red', lastAttackerSessionId: 'killer' })
      const killer = createHero('killer', { team: 'blue', xp: 0, level: 0 })
      heroes.set('victim', victim)
      heroes.set('killer', killer)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(killer.xp).toBe(HERO_KILL_XP_REWARD)
    })

    it('should level up killer when kill XP pushes past threshold', () => {
      const victim = createLethalHero('victim', { team: 'red', lastAttackerSessionId: 'killer' })
      const killer = createHero('killer', {
        team: 'blue',
        xp: 0,
        level: 0,
        heroType: 'BLADE',
      })
      heroes.set('victim', victim)
      heroes.set('killer', killer)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      // HERO_KILL_XP_REWARD=150 >= XP_THRESHOLDS[1]=150 → level 2
      expect(killer.xp).toBe(HERO_KILL_XP_REWARD)
      expect(killer.level).toBe(2)
      expect(killer.talentPoints).toBe(2)
    })

    it('should not grant XP when lastAttackerSessionId is empty (tower/minion kill)', () => {
      const victim = createLethalHero('victim', { team: 'red', lastAttackerSessionId: '' })
      heroes.set('victim', victim)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      // No other hero should have XP changed
      heroes.forEach((hero) => {
        if (hero !== victim) {
          expect(hero.xp).toBe(0)
        }
      })
    })

    it('should not grant XP when killer has disconnected (not in heroes map)', () => {
      const victim = createLethalHero('victim', { team: 'red', lastAttackerSessionId: 'disconnected-player' })
      heroes.set('victim', victim)

      // Should not throw
      const events = processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(events).toHaveLength(1)
      expect(events[0]?.event).toMatchObject({ type: 'death' })
    })

    it('should grant XP even if killer is also dead', () => {
      const victim = createLethalHero('victim', { team: 'red', lastAttackerSessionId: 'killer' })
      const killer = createHero('killer', {
        team: 'blue',
        dead: true,
        hp: 0,
        respawnTimer: 5.0,
        xp: 0,
        level: 0,
      })
      heroes.set('victim', victim)
      heroes.set('killer', killer)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(killer.xp).toBe(HERO_KILL_XP_REWARD)
    })

    it('should reset lastAttackerSessionId on respawn', () => {
      const hero = createHero('hero-1', {
        dead: true,
        hp: 0,
        respawnTimer: 0.1,
        lastAttackerSessionId: 'some-attacker',
      })
      heroes.set('hero-1', hero)

      processDeathAndRespawn(heroes, getSpawnPosition, 1.0)

      expect(hero.dead).toBe(false)
      expect(hero.lastAttackerSessionId).toBe('')
    })

    it('should handle multi-level jump from kill XP', () => {
      const victim = createLethalHero('victim', { team: 'red', lastAttackerSessionId: 'killer' })
      // XP_THRESHOLDS = [50, 150, 350, 650, 1050]
      // killer starts at xp=200, after +150 reward = 350 → exactly lv3
      const killer = createHero('killer', {
        team: 'blue',
        xp: XP_THRESHOLDS[2] - HERO_KILL_XP_REWARD, // 350 - 150 = 200
        level: 0,
        heroType: 'BLADE',
      })
      heroes.set('victim', victim)
      heroes.set('killer', killer)

      processDeathAndRespawn(heroes, getSpawnPosition, 0.1)

      expect(killer.xp).toBe(XP_THRESHOLDS[2]) // 350
      expect(killer.level).toBe(3)
      expect(killer.talentPoints).toBe(3) // 0→3 = +3
    })
  })
})
