import type { MapSchema } from '@colyseus/schema'
import type { TowerSchema } from '../schema/TowerSchema.js'

/**
 * Tick down summoned turret lifetimes and remove expired ones.
 * Towers with remainingDuration === 0 are permanent map towers and are skipped.
 */
export function processTurretLifetime(
  towers: MapSchema<TowerSchema>,
  deltaTime: number,
): void {
  const toRemove: string[] = []

  towers.forEach((tower, towerId) => {
    if (tower.remainingDuration <= 0) return // permanent map tower
    if (tower.dead) {
      toRemove.push(towerId) // killed by damage
      return
    }
    tower.remainingDuration = tower.remainingDuration - deltaTime
    if (tower.remainingDuration <= 0) {
      tower.remainingDuration = 0
      tower.dead = true
      toRemove.push(towerId)
    }
  })

  for (const id of toRemove) {
    towers.delete(id)
  }
}
