import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { updateAttackState } from '@/domain/systems/updateAttackState'
import { findClickTarget } from '@/domain/systems/findClickTarget'
import { isInAttackRange } from '@/domain/systems/isInAttackRange'
import { applyDamage } from '@/domain/systems/applyDamage'
import { createProjectile } from '@/domain/projectile/ProjectileState'
import type { ProjectileState } from '@/domain/projectile/ProjectileState'
import { updateProjectiles } from '@/domain/projectile/updateProjectiles'
import type { CombatEntityState, Position } from '@/domain/types'
import type { EntityManager } from '@/scenes/EntityManager'

export interface CombatEvents {
  readonly damageEvents: ReadonlyArray<{ targetId: string; damage: number }>
  readonly projectileSpawnEvents: ReadonlyArray<{
    ownerId: string
    ownerTeam: string
    targetId: string
    startPosition: Position
    damage: number
    speed: number
    radius: number
  }>
  readonly meleeSwings: ReadonlyArray<{ position: Position; facing: number }>
}

type ProjectileSpawnEvent = CombatEvents['projectileSpawnEvents'][number]

const EMPTY_EVENTS: CombatEvents = {
  damageEvents: [],
  projectileSpawnEvents: [],
  meleeSwings: [],
}

export class CombatManager {
  private _projectiles: ProjectileState[] = []
  private _nextProjectileId = 0

  constructor(private readonly entityManager: EntityManager) {}

  get projectiles(): readonly ProjectileState[] {
    return this._projectiles
  }

  resetProjectiles(): void {
    this._projectiles = []
    this._nextProjectileId = 0
  }

  processAttack(deltaSeconds: number): CombatEvents {
    const hero = this.entityManager.localHero
    const target = this.resolveTarget(hero.attackTargetId)
    const heroDef = HERO_DEFINITIONS[hero.type]
    const targetRadius = target
      ? this.entityManager.getEntityRadius(target.id)
      : 0

    const attackResult = updateAttackState(
      hero,
      target,
      deltaSeconds,
      heroDef.radius,
      targetRadius,
      heroDef.projectileSpeed,
      heroDef.projectileRadius
    )
    this.entityManager.updateLocalHero(() => attackResult.hero)

    const damageEvents: Array<{ targetId: string; damage: number }> = []
    const projectileSpawnEvents: ProjectileSpawnEvent[] = []
    const meleeSwings: Array<{ position: Position; facing: number }> = []

    for (const event of attackResult.damageEvents) {
      this.applyLocalDamage(event.targetId, event.damage)
      damageEvents.push({ targetId: event.targetId, damage: event.damage })
      meleeSwings.push({
        position: attackResult.hero.position,
        facing: attackResult.hero.facing,
      })
    }

    for (const spawn of attackResult.projectileSpawnEvents) {
      this._projectiles.push(
        createProjectile({
          id: `projectile-${this._nextProjectileId++}`,
          ownerId: spawn.ownerId,
          ownerTeam: spawn.ownerTeam,
          targetId: spawn.targetId,
          startPosition: spawn.startPosition,
          damage: spawn.damage,
          speed: spawn.speed,
          radius: spawn.radius,
        })
      )
      projectileSpawnEvents.push({
        ownerId: spawn.ownerId,
        ownerTeam: spawn.ownerTeam,
        targetId: spawn.targetId,
        startPosition: spawn.startPosition,
        damage: spawn.damage,
        speed: spawn.speed,
        radius: spawn.radius,
      })
    }

    if (damageEvents.length === 0 && projectileSpawnEvents.length === 0) {
      return EMPTY_EVENTS
    }

    return { damageEvents, projectileSpawnEvents, meleeSwings }
  }

  processProjectiles(deltaSeconds: number): CombatEvents {
    if (this._projectiles.length === 0) {
      return EMPTY_EVENTS
    }

    const targets: CombatEntityState[] = this.entityManager.getEnemies()
    const result = updateProjectiles(
      this._projectiles,
      targets,
      deltaSeconds,
      (targetId) =>
        this.entityManager.getEntityRadius(targetId)
    )

    this._projectiles = [...result.projectiles]

    const damageEvents: Array<{ targetId: string; damage: number }> = []
    for (const event of result.damageEvents) {
      this.applyLocalDamage(event.targetId, event.damage)
      damageEvents.push({ targetId: event.targetId, damage: event.damage })
    }

    if (damageEvents.length === 0) {
      return EMPTY_EVENTS
    }

    return { damageEvents, projectileSpawnEvents: [], meleeSwings: [] }
  }

  handleAttackInput(aimWorldPosition: Position): void {
    const hero = this.entityManager.localHero
    const enemies = this.entityManager.getEnemies()
    const clickedTarget = findClickTarget(
      aimWorldPosition,
      enemies,
      (entity) => this.entityManager.getEntityRadius(entity.id)
    )

    if (clickedTarget) {
      const heroRadius = HERO_DEFINITIONS[hero.type].radius
      const targetRadius = this.entityManager.getEntityRadius(clickedTarget.id)
      const inRange = isInAttackRange(
        hero.position,
        clickedTarget.position,
        heroRadius,
        targetRadius,
        hero.stats.attackRange
      )

      if (inRange) {
        this.entityManager.updateLocalHero((h) => ({
          ...h,
          attackTargetId: clickedTarget.id,
        }))
        return
      }

      // Out of range — face the target
      const dx = clickedTarget.position.x - hero.position.x
      const dy = clickedTarget.position.y - hero.position.y
      const facingToTarget = Math.atan2(dy, dx)
      this.entityManager.updateLocalHero((h) => ({
        ...h,
        facing: facingToTarget,
      }))
      return
    }

    // Ground click — face click direction
    const dx = aimWorldPosition.x - hero.position.x
    const dy = aimWorldPosition.y - hero.position.y
    if (dx !== 0 || dy !== 0) {
      const facingToClick = Math.atan2(dy, dx)
      this.entityManager.updateLocalHero((h) => ({
        ...h,
        facing: facingToClick,
      }))
    }
  }

  addRemoteProjectile(event: {
    ownerId: string
    targetId: string
    startPosition: Position
    damage: number
    speed: number
  }): void {
    const ownerEntry = this.entityManager.getRemotePlayer(event.ownerId)
    const ownerTeam = ownerEntry?.team ?? 'red'
    this._projectiles.push(
      createProjectile({
        id: `remote-${event.ownerId}-${this._nextProjectileId++}`,
        ownerId: event.ownerId,
        ownerTeam,
        targetId: event.targetId,
        startPosition: event.startPosition,
        damage: event.damage,
        speed: event.speed,
        radius: 5,
      })
    )
  }

  applyLocalDamage(targetId: string, amount: number): void {
    const em = this.entityManager
    if (targetId === em.enemy.id) {
      em.updateEnemy((e) => applyDamage(e, amount))
      return
    }
    em.applyDamageToRemote(targetId, amount)
  }

  private resolveTarget(targetId: string | null): CombatEntityState | null {
    if (targetId === null) return null
    return this.entityManager.getEntity(targetId)
  }
}
