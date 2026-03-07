import Phaser from 'phaser'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'
import { HeroRenderer } from '@/scenes/HeroRenderer'
import { TowerRenderer } from '@/scenes/effects/TowerRenderer'
import { MinionRenderer } from '@/scenes/effects/MinionRenderer'
import { EntityManager } from '@/scenes/EntityManager'
import { InputBuffer } from '@/network/InputBuffer'
import { InterpolationBuffer } from '@/network/InterpolationBuffer'
import type { HeroType, Team } from '@/domain/types'
import type { TowerState } from '@/domain/entities/Tower'
import type { MinionState } from '@shared/entities/Minion'
import type { ServerHeroState, ServerTowerState, ServerMinionState } from '@/network/GameMode'
import { CAMERA_LERP } from '@/domain/constants'

/** Assert that a server-provided heroType string is a valid HeroType key. */
function assertHeroType(value: string): HeroType {
  if (!(value in HERO_DEFINITIONS)) {
    throw new Error(`Invalid heroType from server: "${value}"`)
  }
  return value as HeroType
}

export interface EntityRenderer {
  readonly gameObject: Phaser.GameObjects.Container
  update(delta: number): void
  flash(): void
  destroy(): void
}

/**
 * Handles synchronising server entity state (heroes, towers, minions) with
 * the client-side EntityManager, renderers, and interpolation buffers.
 *
 * Extracted from GameScene to keep file sizes manageable.
 */
export class ServerEntitySync {
  private readonly scene: Phaser.Scene
  private readonly entityManager: EntityManager
  private readonly entityRenderers: Map<string, EntityRenderer>
  private readonly interpolationBuffers: Map<string, InterpolationBuffer>
  private readonly localTeam: Team

  // Mutable camera state — managed on behalf of GameScene
  cameraFollowing = true
  inputBuffer: InputBuffer | null = null

  constructor(
    scene: Phaser.Scene,
    entityManager: EntityManager,
    entityRenderers: Map<string, EntityRenderer>,
    interpolationBuffers: Map<string, InterpolationBuffer>,
    localTeam: Team,
  ) {
    this.scene = scene
    this.entityManager = entityManager
    this.entityRenderers = entityRenderers
    this.interpolationBuffers = interpolationBuffers
    this.localTeam = localTeam
  }

  /** Handle server hero state sync. */
  handleServerHeroUpdate(state: ServerHeroState, localSessionId: string): void {
    const isLocal = state.sessionId === localSessionId

    // Track previous dead state for camera transitions
    const prevDead = (this.entityManager.getEntity(state.sessionId) as HeroState | null)?.dead ?? state.dead

    // Step 1: Ensure entity & renderer exist
    this.ensureHeroEntityExists(state, isLocal)

    // Step 2: Apply non-position fields (position/facing from InterpolationBuffer)
    this.applyServerHeroNonPositionState(state)

    // Push snapshot to interpolation buffer
    if (!this.interpolationBuffers.has(state.sessionId)) {
      this.interpolationBuffers.set(state.sessionId, new InterpolationBuffer())
    }
    this.interpolationBuffers.get(state.sessionId)!.pushSnapshot({
      x: state.x,
      y: state.y,
      facing: state.facing,
    })

    // Step 3: Local-only overrides (camera, death/respawn)
    if (isLocal) {
      this.applyLocalHeroOverrides(state, prevDead)
    }
  }

  /** Handle server tower state sync. */
  handleServerTowerUpdate(state: ServerTowerState): void {
    const existing = this.entityManager.getEntity(state.id)

    if (!existing) {
      const towerState = createTowerState({
        id: state.id,
        team: (state.team as Team) ?? 'neutral',
        position: { x: state.x, y: state.y },
        definition: DEFAULT_TOWER,
      })
      this.entityManager.registerEntity(towerState)
    }

    if (!this.entityRenderers.has(state.id)) {
      const towerEntity = this.entityManager.getEntity(state.id) as TowerState
      const isAlly = state.team === this.localTeam
      this.entityRenderers.set(state.id, new TowerRenderer(this.scene, towerEntity, isAlly))
    }

    this.entityManager.updateEntity<TowerState>(state.id, (t) => ({
      ...t,
      hp: state.hp,
      maxHp: state.maxHp,
      dead: state.dead,
    }))
  }

  /** Handle server minion state sync. */
  handleServerMinionUpdate(state: ServerMinionState): void {
    const existing = this.entityManager.getEntity(state.id)

    if (!existing) {
      const minionState: MinionState = {
        id: state.id,
        entityType: 'minion',
        team: state.team as Team,
        position: { x: state.x, y: state.y },
        hp: state.hp,
        maxHp: state.maxHp,
        dead: state.dead,
        radius: state.radius,
        minionType: state.minionType,
        facing: state.facing,
        attackTargetId: null,
        attackCooldown: 0,
        stats: {
          maxHp: state.maxHp,
          speed: state.speed,
          attackDamage: state.attackDamage,
          attackRange: state.attackRange,
          attackSpeed: state.attackSpeed,
        },
        projectileSpeed: state.projectileSpeed,
        projectileRadius: state.projectileRadius,
      }
      this.entityManager.registerEntity(minionState)
    }

    if (!this.entityRenderers.has(state.id)) {
      const minionEntity = this.entityManager.getEntity(state.id) as MinionState
      const isAlly = state.team === this.localTeam
      this.entityRenderers.set(state.id, new MinionRenderer(this.scene, minionEntity, isAlly))
    }

    // Push snapshot to interpolation buffer (same pattern as heroes)
    if (!this.interpolationBuffers.has(state.id)) {
      this.interpolationBuffers.set(state.id, new InterpolationBuffer())
    }
    this.interpolationBuffers.get(state.id)!.pushSnapshot({
      x: state.x,
      y: state.y,
      facing: state.facing,
    })

    this.entityManager.updateEntity<MinionState>(state.id, (m) => ({
      ...m,
      hp: state.hp,
      maxHp: state.maxHp,
      dead: state.dead,
    }))
  }

  /** Remove a minion entity, renderer, and interpolation buffer. */
  handleServerMinionRemove(minionId: string): void {
    const renderer = this.entityRenderers.get(minionId)
    if (renderer) {
      renderer.destroy()
      this.entityRenderers.delete(minionId)
    }
    this.interpolationBuffers.delete(minionId)
    this.entityManager.removeEntity(minionId)
  }

  /**
   * Replace placeholder entities with server-assigned session ID.
   * Called once on first server hero state for the local player.
   */
  remapLocalHeroToSession(sessionId: string): void {
    // Remove placeholder enemy
    this.entityRenderers.get('enemy-1')?.destroy()
    this.entityRenderers.delete('enemy-1')
    this.entityManager.removeEntity('enemy-1')

    // Remove placeholder towers (server provides them)
    for (const towerId of ['tower-blue', 'tower-red']) {
      this.entityRenderers.get(towerId)?.destroy()
      this.entityRenderers.delete(towerId)
      this.entityManager.removeEntity(towerId)
    }

    // Remap local hero renderer to sessionId
    const oldId = this.entityManager.localHeroId
    const renderer = this.entityRenderers.get(oldId)
    if (renderer) {
      this.entityRenderers.delete(oldId)
      this.entityRenderers.set(sessionId, renderer)
      this.scene.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
    }

    // Remap entity in EntityManager
    this.entityManager.remapLocalHero(sessionId)

    // Initialize input buffer
    this.inputBuffer = new InputBuffer()
  }

  // ---------- Private helpers ----------

  private ensureHeroEntityExists(state: ServerHeroState, isLocal: boolean): void {
    if (isLocal && state.sessionId !== this.entityManager.localHeroId) {
      this.remapLocalHeroToSession(state.sessionId)
    }

    if (!isLocal && !this.entityManager.getEntity(state.sessionId)) {
      const heroState = createHeroState({
        id: state.sessionId,
        type: assertHeroType(state.heroType),
        team: (state.team as Team) ?? 'red',
        position: { x: state.x, y: state.y },
      })
      this.entityManager.registerEntity(heroState)
    }

    if (!this.entityRenderers.has(state.sessionId)) {
      const heroState = this.entityManager.getEntity(state.sessionId) as HeroState
      const isAlly = (state.team as Team) === this.localTeam
      this.entityRenderers.set(state.sessionId, new HeroRenderer(this.scene, heroState, isAlly))
    }
  }

  private applyServerHeroNonPositionState(state: ServerHeroState): void {
    this.entityManager.updateEntity<HeroState>(state.sessionId, (h) => ({
      ...h,
      type: assertHeroType(state.heroType),
      radius: state.radius,
      hp: state.hp,
      maxHp: state.maxHp,
      dead: state.dead,
      attackTargetId: state.attackTargetId || null,
      respawnTimer: state.respawnTimer,
      xp: state.xp,
      level: state.level,
      talentPoints: state.talentPoints,
      acquiredTalents: [...state.acquiredTalents],
      ownedSkills: [...state.ownedSkills],
      skillSlotQ: state.skillSlotQ,
      skillSlotE: state.skillSlotE,
      skillSlotR: state.skillSlotR,
    }))
  }

  private applyLocalHeroOverrides(state: ServerHeroState, prevDead: boolean): void {
    if (state.dead && this.cameraFollowing) {
      this.scene.cameras.main.stopFollow()
      this.cameraFollowing = false
    } else if (!state.dead && !this.cameraFollowing) {
      const renderer = this.entityRenderers.get(state.sessionId)
      if (renderer) {
        this.scene.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
      }
      this.cameraFollowing = true
    }

    if (!prevDead && state.dead) {
      this.inputBuffer?.clear()
    }
  }
}
