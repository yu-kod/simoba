import { MapSchema } from '@colyseus/schema'
import { computeRespawnTime } from '@shared/systems/respawnTimer'
import { HERO_KILL_XP_REWARD } from '@shared/constants'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { CombatEventMessage } from '@shared/messages'
import { grantXpAndLevelUp } from './xpUtils.js'

interface SpawnPosition {
  readonly x: number
  readonly y: number
}

/** Reset hero state for respawn at the given spawn position. */
function respawnHero(hero: HeroSchema, spawn: SpawnPosition): void {
  hero.dead = false
  hero.respawnTimer = 0
  hero.hp = hero.maxHp
  hero.x = spawn.x
  hero.y = spawn.y
  hero.attackTargetId = ''
  hero.attackCooldown = 0
  hero.lastAttackerSessionId = ''
  hero.dashTimer = 0
  hero.dashDirX = 0
  hero.dashDirY = 0
  hero.dashSpeed = 0
  hero.dashDamage = 0
  hero.dashInvulnerable = false
  hero.cooldownQ = 0
  hero.cooldownE = 0
  hero.cooldownR = 0
  hero.statusEffects.clear()
}

/**
 * Process death detection and respawn for all heroes in one tick.
 * - If hp <= 0 and not yet dead, mark dead and start respawn timer.
 *   Also grants kill XP to the last attacker if applicable.
 * - If dead, decrement timer. When timer expires, respawn at team spawn.
 * Returns DeathEvents for broadcasting to clients.
 */
export function processDeathAndRespawn(
  heroes: MapSchema<HeroSchema>,
  getSpawnPosition: (team: string) => SpawnPosition,
  deltaTime: number
): CombatEventMessage[] {
  const events: CombatEventMessage[] = []

  heroes.forEach((hero, sessionId) => {
    // Death detection — applyDamage() already sets dead=true when hp reaches 0,
    // so we detect newly dead heroes by dead=true with no respawn timer yet.
    if (hero.dead && hero.respawnTimer <= 0 && hero.hp <= 0) {
      const respawnTime = computeRespawnTime(hero.level)
      hero.attackTargetId = ''
      hero.attackCooldown = 0

      // Grant kill XP to last attacker (if it's a valid hero)
      if (hero.lastAttackerSessionId !== '') {
        const killer = heroes.get(hero.lastAttackerSessionId)
        if (killer) {
          grantXpAndLevelUp(killer, HERO_KILL_XP_REWARD)
        }
      }

      events.push({
        kind: 'death',
        event: {
          entityId: sessionId,
          type: 'death',
          position: { x: hero.x, y: hero.y },
        },
      })

      // Instant respawn when timer is 0 (e.g. level 0)
      if (respawnTime <= 0) {
        const spawn = getSpawnPosition(hero.team)
        respawnHero(hero, spawn)

        events.push({
          kind: 'death',
          event: {
            entityId: sessionId,
            type: 'respawn',
            position: { x: spawn.x, y: spawn.y },
          },
        })
      } else {
        hero.respawnTimer = respawnTime
      }
      return
    }

    // Respawn timer
    if (hero.dead) {
      hero.respawnTimer = Math.max(0, hero.respawnTimer - deltaTime)

      if (hero.respawnTimer <= 0) {
        const spawn = getSpawnPosition(hero.team)
        respawnHero(hero, spawn)

        events.push({
          kind: 'death',
          event: {
            entityId: sessionId,
            type: 'respawn',
            position: { x: spawn.x, y: spawn.y },
          },
        })
      }
    }
  })

  return events
}
