import { MapSchema } from '@colyseus/schema'
import { DEFAULT_RESPAWN_TIME } from '@shared/constants'
import type { HeroSchema } from '../schema/HeroSchema.js'
import type { CombatEventMessage } from '@shared/messages'

interface SpawnPosition {
  readonly x: number
  readonly y: number
}

/**
 * Process death detection and respawn for all heroes in one tick.
 * - If hp <= 0 and not yet dead, mark dead and start respawn timer.
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
      hero.respawnTimer = DEFAULT_RESPAWN_TIME
      hero.attackTargetId = ''
      hero.attackCooldown = 0

      events.push({
        kind: 'death',
        event: {
          heroId: sessionId,
          type: 'death',
          position: { x: hero.x, y: hero.y },
        },
      })
      return
    }

    // Respawn timer
    if (hero.dead) {
      hero.respawnTimer = Math.max(0, hero.respawnTimer - deltaTime)

      if (hero.respawnTimer <= 0) {
        const spawn = getSpawnPosition(hero.team)
        hero.dead = false
        hero.respawnTimer = 0
        hero.hp = hero.maxHp
        hero.x = spawn.x
        hero.y = spawn.y
        hero.attackTargetId = ''
        hero.attackCooldown = 0

        events.push({
          kind: 'death',
          event: {
            heroId: sessionId,
            type: 'respawn',
            position: { x: spawn.x, y: spawn.y },
          },
        })
      }
    }
  })

  return events
}
