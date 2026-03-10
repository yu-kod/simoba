/**
 * Per-room projectile state tracker.
 * Encapsulates all mutable state that was previously module-level singletons.
 * Each GameRoom creates its own instance to prevent cross-room contamination.
 */
export class ProjectileTracker {
  private combatCounter = 0
  private skillCounter = 0
  private towerCounter = 0
  private zoneCounter = 0

  private readonly distanceTraveled = new Map<string, number>()
  private readonly hitEntityIds = new Map<string, Set<string>>()

  nextCombatProjectileId(): string {
    return `proj-${++this.combatCounter}`
  }

  nextSkillProjectileId(): string {
    return `skill-proj-${++this.skillCounter}`
  }

  nextTowerProjectileId(): string {
    return `tower-proj-${++this.towerCounter}`
  }

  nextZoneId(): string {
    return `zone-${++this.zoneCounter}`
  }

  getDistanceTraveled(projId: string): number {
    return this.distanceTraveled.get(projId) ?? 0
  }

  setDistanceTraveled(projId: string, value: number): void {
    this.distanceTraveled.set(projId, value)
  }

  getHitSet(projId: string): Set<string> {
    let set = this.hitEntityIds.get(projId)
    if (!set) {
      set = new Set()
      this.hitEntityIds.set(projId, set)
    }
    return set
  }

  cleanupTracking(projId: string): void {
    this.distanceTraveled.delete(projId)
    this.hitEntityIds.delete(projId)
  }
}
