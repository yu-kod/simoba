import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
} from '@/domain/constants'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { move } from '@/domain/systems/MovementSystem'
import { updateFacing } from '@/domain/systems/updateFacing'
import { renderMap } from '@/scenes/mapRenderer'
import { HeroRenderer } from '@/scenes/HeroRenderer'
import { MeleeSwingRenderer } from '@/scenes/effects/MeleeSwingRenderer'
import { ProjectileRenderer } from '@/scenes/effects/ProjectileRenderer'
import { InputHandler } from '@/scenes/InputHandler'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import { NetworkBridge } from '@/scenes/NetworkBridge'
import type { HeroType } from '@/domain/types'
import { OfflineGameMode } from '@/network/OfflineGameMode'
import { OnlineGameMode } from '@/network/OnlineGameMode'

/** Debug: number keys 1-3 switch hero type (remove before release — see Issue) */
const DEBUG_HERO_KEYS: readonly { key: string; type: HeroType }[] = [
  { key: 'ONE', type: 'BLADE' },
  { key: 'TWO', type: 'BOLT' },
  { key: 'THREE', type: 'AURA' },
]

export class GameScene extends Phaser.Scene {
  private entityManager!: EntityManager
  private combatManager!: CombatManager
  private networkBridge!: NetworkBridge
  private inputHandler!: InputHandler

  private heroRenderer!: HeroRenderer
  private enemyRenderer!: HeroRenderer
  private meleeSwing!: MeleeSwingRenderer
  private projectileRenderer!: ProjectileRenderer
  private remoteRenderers = new Map<string, HeroRenderer>()

  /** Expose hero state for E2E test inspection */
  get heroState() { return this.entityManager.localHero }
  set heroState(value) { this.entityManager.updateLocalHero(() => value) }

  /** Expose enemy state for E2E test inspection */
  get enemyState() { return this.entityManager.enemy }

  /** Expose projectiles for E2E test inspection */
  get projectiles() { return this.combatManager.projectiles }

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    renderMap(this)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // Managers (Phaser-free)
    this.entityManager = new EntityManager(
      { id: 'player-1', type: 'BLADE', team: 'blue', position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 } },
      { id: 'enemy-1', type: 'BLADE', team: 'red', position: { x: GAME_WIDTH / 4 + 200, y: GAME_HEIGHT / 2 } }
    )
    this.combatManager = new CombatManager(this.entityManager)

    // Renderers
    this.heroRenderer = new HeroRenderer(this, this.entityManager.localHero, true)
    this.enemyRenderer = new HeroRenderer(this, this.entityManager.enemy, false)
    this.meleeSwing = new MeleeSwingRenderer(this)
    this.projectileRenderer = new ProjectileRenderer(this)

    this.cameras.main.startFollow(this.heroRenderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)

    this.inputHandler = new InputHandler(this)

    // Debug keys
    for (const { key, type } of DEBUG_HERO_KEYS) {
      this.input.keyboard!.on(`keydown-${key}`, () => this.debugSwitchHero(type))
    }

    // Network
    this.initGameMode()
  }

  private initGameMode(): void {
    const onlineMode = new OnlineGameMode()
    this.networkBridge = new NetworkBridge(onlineMode, this.entityManager, this.combatManager, {
      onRemotePlayerAdded: (sessionId) => {
        const state = this.entityManager.getRemotePlayer(sessionId)
        if (state) this.remoteRenderers.set(sessionId, new HeroRenderer(this, state, false))
      },
      onRemotePlayerRemoved: (sessionId) => {
        this.remoteRenderers.get(sessionId)?.destroy()
        this.remoteRenderers.delete(sessionId)
      },
      onRemotePlayerUpdated: (sessionId) => {
        const state = this.entityManager.getRemotePlayer(sessionId)
        if (state) this.remoteRenderers.get(sessionId)?.sync(state)
      },
      onDamageApplied: (targetId) => {
        if (targetId === this.entityManager.enemy.id) {
          this.enemyRenderer.flash()
        } else {
          this.remoteRenderers.get(targetId)?.flash()
        }
      },
    })
    this.networkBridge.setupCallbacks()

    onlineMode.onSceneCreate()
      .catch(() => {
        onlineMode.dispose()
        this.networkBridge.replaceGameMode(new OfflineGameMode())
      })
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000
    const input = this.inputHandler.read(this.entityManager.localHero.position)
    const isMoving = input.movement.x !== 0 || input.movement.y !== 0

    // Input → attack
    if (input.attack) {
      this.combatManager.handleAttackInput(input.aimWorldPosition)
    }
    if (isMoving && this.entityManager.localHero.attackTargetId !== null
      && !HERO_DEFINITIONS[this.entityManager.localHero.type].canMoveWhileAttacking) {
      this.entityManager.updateLocalHero((h) => ({ ...h, attackTargetId: null }))
    }

    // Combat
    const attackEvents = this.combatManager.processAttack(deltaSeconds)
    const projectileEvents = this.combatManager.processProjectiles(deltaSeconds)

    // Network events + effects
    for (const e of attackEvents.damageEvents) {
      this.networkBridge.sendDamageEvent({ targetId: e.targetId, amount: e.damage })
      this.enemyRenderer.flash()
    }
    for (const swing of attackEvents.meleeSwings) {
      this.meleeSwing.play(swing)
    }
    for (const spawn of attackEvents.projectileSpawnEvents) {
      this.networkBridge.sendProjectileSpawn({
        targetId: spawn.targetId,
        startPosition: spawn.startPosition,
        damage: spawn.damage,
        speed: spawn.speed,
      })
    }
    for (const e of projectileEvents.damageEvents) {
      this.networkBridge.sendDamageEvent({ targetId: e.targetId, amount: e.damage })
      this.enemyRenderer.flash()
    }

    // Facing
    const hero = this.entityManager.localHero
    const target = hero.attackTargetId !== null
      ? this.entityManager.getEntity(hero.attackTargetId)
      : null
    const newFacing = updateFacing(hero.facing, input.movement, target?.position ?? null, hero.position)
    if (newFacing !== hero.facing) {
      this.entityManager.updateLocalHero((h) => ({ ...h, facing: newFacing }))
    }

    // Movement
    if (isMoving) {
      const radius = HERO_DEFINITIONS[this.entityManager.localHero.type].radius
      const newPosition = move(
        this.entityManager.localHero.position,
        input.movement,
        this.entityManager.localHero.stats.speed,
        deltaSeconds,
        radius
      )
      this.entityManager.updateLocalHero((h) => ({ ...h, position: newPosition }))
    }

    // Effects + renderers
    this.meleeSwing.update(delta)
    this.heroRenderer.update(delta)
    this.enemyRenderer.update(delta)
    for (const renderer of this.remoteRenderers.values()) {
      renderer.update(delta)
    }
    this.heroRenderer.sync(this.entityManager.localHero)
    this.enemyRenderer.sync(this.entityManager.enemy)
    this.projectileRenderer.draw(this.combatManager.projectiles)

    this.networkBridge.sendLocalState()
  }

  private debugSwitchHero(type: HeroType): void {
    if (this.entityManager.localHero.type === type) return

    this.heroRenderer.destroy()
    this.combatManager.resetProjectiles()

    this.entityManager.resetLocalHero({
      id: 'player-1',
      type,
      team: 'blue',
      position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 },
    })

    this.heroRenderer = new HeroRenderer(this, this.entityManager.localHero, true)
    this.cameras.main.startFollow(this.heroRenderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
  }
}
