import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import type { TowerState } from '@/domain/entities/Tower'
import { updateAttackState } from '@/domain/systems/updateAttackState'
import { selectTowerTarget } from '@/domain/systems/towerTargeting'
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
  private readonly _towerDefinitions = new Map<string, { projectileSpeed: number; projectileRadius: number }>()

  constructor(private readonly entityManager: EntityManager) {}

  registerTowerDefinition(
    towerId: string,
    def: { projectileSpeed: number; projectileRadius: number }
  ): void {
    this._towerDefinitions.set(towerId, def)
  }

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
    this.entityManager.updateLocalHero(() => attackResult.entity)

    const damageEvents: Array<{ targetId: string; damage: number }> = []
    const projectileSpawnEvents: ProjectileSpawnEvent[] = []
    const meleeSwings: Array<{ position: Position; facing: number }> = []

    for (const event of attackResult.damageEvents) {
      this.applyLocalDamage(event.targetId, event.damage)
      damageEvents.push({ targetId: event.targetId, damage: event.damage })
      meleeSwings.push({
        position: attackResult.entity.position,
        facing: attackResult.entity.facing,
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

    const targets: CombatEntityState[] = this.entityManager.getEnemiesOf(
      this.entityManager.localHero.team
    )
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

  processTowerAttacks(deltaSeconds: number): CombatEvents {
    const towers = this.entityManager.registeredEntities.filter(
      (e): e is TowerState => e.entityType === 'tower' && !e.dead
    )

    if (towers.length === 0) return EMPTY_EVENTS

    const projectileSpawnEvents: ProjectileSpawnEvent[] = []
    const damageEvents: Array<{ targetId: string; damage: number }> = []

    for (const tower of towers) {
      const enemies = this.entityManager.getEnemiesOf(tower.team)
      const target = selectTowerTarget(tower, enemies)

      const towerWithTarget: TowerState = target
        ? { ...tower, attackTargetId: target.id }
        : { ...tower, attackTargetId: null }

      const def = this._towerDefinitions.get(tower.id)
      const projSpeed = def?.projectileSpeed ?? 400
      const projRadius = def?.projectileRadius ?? 5

      const targetRadius = target
        ? this.entityManager.getEntityRadius(target.id)
        : 0

      const attackResult = updateAttackState(
        towerWithTarget,
        target,
        deltaSeconds,
        tower.radius,
        targetRadius,
        projSpeed,
        projRadius
      )

      this.entityManager.updateEntity<TowerState>(tower.id, () => attackResult.entity)

      for (const spawn of attackResult.projectileSpawnEvents) {
        this._projectiles.push(
          createProjectile({
            id: `tower-projectile-${this._nextProjectileId++}`,
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

      for (const event of attackResult.damageEvents) {
        this.applyLocalDamage(event.targetId, event.damage)
        damageEvents.push({ targetId: event.targetId, damage: event.damage })
      }
    }

    if (damageEvents.length === 0 && projectileSpawnEvents.length === 0) {
      return EMPTY_EVENTS
    }

    return { damageEvents, projectileSpawnEvents, meleeSwings: [] }
  }

  handleAttackInput(aimWorldPosition: Position): void {
    const hero = this.entityManager.localHero
    const enemies = this.entityManager.getEnemiesOf(hero.team)
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
    if (targetId === em.localHero.id) {
      em.updateLocalHero((h) => applyDamage(h, amount))
      return
    }
    if (targetId === em.enemy.id) {
      em.updateEnemy((e) => applyDamage(e, amount))
      return
    }
    if (em.applyDamageToRemote(targetId, amount)) return
    em.updateEntity(targetId, (e) => applyDamage(e, amount))
  }

  private resolveTarget(targetId: string | null): CombatEntityState | null {
    if (targetId === null) return null
    return this.entityManager.getEntity(targetId)
  }
}
