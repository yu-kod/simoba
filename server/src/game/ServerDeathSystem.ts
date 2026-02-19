import { MapSchema } from '@colyseus/schema'
import { DEFAULT_RESPAWN_TIME } from '@shared/constants'
import type { HeroSchema } from '../schema/HeroSchema.js'

interface SpawnPosition {
  readonly x: number
  readonly y: number
}

/**
 * Process death detection and respawn for all heroes in one tick.
 * - If hp <= 0 and not yet dead, mark dead and start respawn timer.
 * - If dead, decrement timer. When timer expires, respawn at team spawn.
 */
export function processDeathAndRespawn(
  heroes: MapSchema<HeroSchema>,
  getSpawnPosition: (team: string) => SpawnPosition,
  deltaTime: number
): void {
  heroes.forEach((hero) => {
    // Death detection
    if (!hero.dead && hero.hp <= 0) {
      hero.dead = true
      hero.respawnTimer = DEFAULT_RESPAWN_TIME
      hero.attackTargetId = ''
      hero.attackCooldown = 0
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
      }
    }
  })
}
