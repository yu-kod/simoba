import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
  DEFAULT_RESPAWN_TIME,
} from '@/domain/constants'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { move } from '@/domain/systems/MovementSystem'
import { updateFacing } from '@/domain/systems/updateFacing'
import { checkDeath, updateRespawnTimer, respawn } from '@/domain/systems/deathRespawn'
import { baseRespawn } from '@/domain/systems/respawnPosition'
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
import { registerTestApi } from '@/test/e2eTestApi'

const FREE_CAMERA_SPEED = 400

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
  private respawnText!: Phaser.GameObjects.Text
  private cameraFollowing = true

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

    // Respawn timer UI (fixed to camera, centered)
    this.respawnText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    })
    this.respawnText.setOrigin(0.5)
    this.respawnText.setScrollFactor(0)
    this.respawnText.setDepth(1000)
    this.respawnText.setVisible(false)

    // Debug keys
    for (const { key, type } of DEBUG_HERO_KEYS) {
      this.input.keyboard!.on(`keydown-${key}`, () => this.debugSwitchHero(type))
    }

    // E2E test API (dev only)
    // Static import is tree-shaken by Vite in production builds
    // because the only call site is inside this dead-code branch.
    if (import.meta.env.DEV) {
      registerTestApi(this.entityManager, this.combatManager)
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
    const localDead = this.entityManager.localHero.dead

    // --- Death / Respawn timers (local hero + enemy) ---
    this.updateDeathRespawn(deltaSeconds)

    // --- Local hero actions (skip if dead) ---
    if (!localDead) {
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
    } else {
      // Dead: free camera movement with WASD
      this.updateFreeCamera(input.movement, deltaSeconds)
    }

    // --- Respawn timer UI ---
    this.updateRespawnUI()

    // --- Effects + renderers ---
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

  private updateDeathRespawn(deltaSeconds: number): void {
    // Check death for local hero
    this.entityManager.updateLocalHero((h) => checkDeath(h, DEFAULT_RESPAWN_TIME))
    // Check death for enemy
    this.entityManager.updateEnemy((e) => checkDeath(e, DEFAULT_RESPAWN_TIME))

    // Handle local hero death → stop camera follow
    if (this.entityManager.localHero.dead && this.cameraFollowing) {
      this.cameras.main.stopFollow()
      this.cameraFollowing = false
    }

    // Update respawn timers
    this.entityManager.updateLocalHero((h) => updateRespawnTimer(h, deltaSeconds))
    this.entityManager.updateEnemy((e) => updateRespawnTimer(e, deltaSeconds))

    // Respawn local hero
    if (this.entityManager.localHero.dead && this.entityManager.localHero.respawnTimer <= 0) {
      const respawnPos = baseRespawn(this.entityManager.localHero)
      this.entityManager.updateLocalHero((h) => respawn(h, respawnPos))
      this.cameras.main.centerOn(respawnPos.x, respawnPos.y)
      this.cameras.main.startFollow(this.heroRenderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
      this.cameraFollowing = true
    }

    // Respawn enemy
    if (this.entityManager.enemy.dead && this.entityManager.enemy.respawnTimer <= 0) {
      const respawnPos = baseRespawn(this.entityManager.enemy)
      this.entityManager.updateEnemy((e) => respawn(e, respawnPos))
    }
  }

  private updateFreeCamera(movement: { x: number; y: number }, deltaSeconds: number): void {
    if (movement.x === 0 && movement.y === 0) return
    const cam = this.cameras.main
    cam.scrollX += movement.x * FREE_CAMERA_SPEED * deltaSeconds
    cam.scrollY += movement.y * FREE_CAMERA_SPEED * deltaSeconds
  }

  private updateRespawnUI(): void {
    if (this.entityManager.localHero.dead) {
      const seconds = Math.ceil(this.entityManager.localHero.respawnTimer)
      this.respawnText.setText(`Respawning in ${seconds}...`)
      this.respawnText.setVisible(true)
    } else {
      this.respawnText.setVisible(false)
    }
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
