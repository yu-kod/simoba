import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
  DEFAULT_RESPAWN_TIME,
} from '@/domain/constants'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { isHero, isTower } from '@/domain/entities/typeGuards'
import { move } from '@/domain/systems/MovementSystem'
import { updateFacing } from '@/domain/systems/updateFacing'
import { checkHeroDeath, updateRespawnTimer, respawn } from '@/domain/systems/deathRespawn'
import { baseRespawn } from '@/domain/systems/respawnPosition'
import { findClickTarget } from '@/domain/systems/findClickTarget'
import { renderMap } from '@/scenes/mapRenderer'
import { HeroRenderer } from '@/scenes/HeroRenderer'
import { MeleeSwingRenderer } from '@/scenes/effects/MeleeSwingRenderer'
import { ProjectileRenderer } from '@/scenes/effects/ProjectileRenderer'
import { InputHandler } from '@/scenes/InputHandler'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import { NetworkBridge } from '@/scenes/NetworkBridge'
import { InputBuffer } from '@/network/InputBuffer'
import { MovementPredictor } from '@/network/MovementPredictor'
import type { HeroType, Team, Position } from '@/domain/types'
import type { TowerState } from '@/domain/entities/Tower'
import { OfflineGameMode } from '@/network/OfflineGameMode'
import type { GameMode, ServerHeroState, ServerTowerState, ServerProjectileState } from '@/network/GameMode'
import type { InputMessage } from '@shared/messages'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'
import { MAP_LAYOUT } from '@/domain/mapLayout'
import { TowerRenderer } from '@/scenes/effects/TowerRenderer'
import { registerTestApi } from '@/test/e2eTestApi'

const FREE_CAMERA_SPEED = 400
const SERVER_TICK_DELTA = 1 / 60

/** Debug: number keys 1-3 switch hero type (remove before release — see Issue) */
const DEBUG_HERO_KEYS: readonly { key: string; type: HeroType }[] = [
  { key: 'ONE', type: 'BLADE' },
  { key: 'TWO', type: 'BOLT' },
  { key: 'THREE', type: 'AURA' },
]

interface EntityRenderer {
  readonly gameObject: Phaser.GameObjects.Container
  update(delta: number): void
  flash(): void
  destroy(): void
}

export class GameScene extends Phaser.Scene {
  private entityManager!: EntityManager
  private combatManager!: CombatManager
  private networkBridge!: NetworkBridge
  private inputHandler!: InputHandler

  private entityRenderers = new Map<string, EntityRenderer>()
  private meleeSwing!: MeleeSwingRenderer
  private projectileRenderer!: ProjectileRenderer
  private respawnText!: Phaser.GameObjects.Text
  private cameraFollowing = true
  private gameMode: GameMode = new OfflineGameMode()
  private localTeam: Team = 'blue'
  private localSpawnPosition: Position = { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 }

  // Online mode: client-side prediction
  private inputBuffer: InputBuffer | null = null
  private movementPredictor: MovementPredictor | null = null
  private serverProjectiles: readonly ServerProjectileState[] = []

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data?: { gameMode?: GameMode; localTeam?: Team; localPosition?: Position }): void {
    this.gameMode = data?.gameMode ?? new OfflineGameMode()
    this.localTeam = data?.localTeam ?? 'blue'
    this.localSpawnPosition = data?.localPosition ?? { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 }
  }

  create(): void {
    renderMap(this)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // Managers (Phaser-free)
    const enemyTeam: Team = this.localTeam === 'blue' ? 'red' : 'blue'
    const enemyPosition: Position = this.localTeam === 'blue'
      ? { x: GAME_WIDTH / 4 + 200, y: GAME_HEIGHT / 2 }
      : { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 }

    this.entityManager = new EntityManager(
      { id: 'player-1', type: 'BLADE', team: this.localTeam, position: this.localSpawnPosition },
      { id: 'enemy-1', type: 'BLADE', team: enemyTeam, position: enemyPosition }
    )
    this.combatManager = new CombatManager(this.entityManager)

    // Towers
    const blueTower = createTowerState({
      id: 'tower-blue',
      team: 'blue',
      position: { x: MAP_LAYOUT.towers.blue.x, y: MAP_LAYOUT.towers.blue.y },
      definition: DEFAULT_TOWER,
    })
    const redTower = createTowerState({
      id: 'tower-red',
      team: 'red',
      position: { x: MAP_LAYOUT.towers.red.x, y: MAP_LAYOUT.towers.red.y },
      definition: DEFAULT_TOWER,
    })
    this.entityManager.registerEntity(blueTower)
    this.entityManager.registerEntity(redTower)

    // Renderers (unified Map)
    const localHero = this.entityManager.getEntity(this.entityManager.localHeroId) as HeroState
    const enemy = this.entityManager.getEntity('enemy-1') as HeroState
    this.entityRenderers.set(this.entityManager.localHeroId, new HeroRenderer(this, localHero, true))
    this.entityRenderers.set('enemy-1', new HeroRenderer(this, enemy, false))
    this.entityRenderers.set('tower-blue', new TowerRenderer(this, blueTower, this.localTeam === 'blue'))
    this.entityRenderers.set('tower-red', new TowerRenderer(this, redTower, this.localTeam === 'red'))

    this.meleeSwing = new MeleeSwingRenderer(this)
    this.projectileRenderer = new ProjectileRenderer(this)

    const localRenderer = this.entityRenderers.get(this.entityManager.localHeroId)!
    this.cameras.main.startFollow(localRenderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)

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
    if (import.meta.env.DEV) {
      registerTestApi(this.entityManager, this.combatManager)
    }

    // Network
    this.initGameMode()
  }

  private initGameMode(): void {
    this.networkBridge = new NetworkBridge(this.gameMode, this.entityManager, this.combatManager, {
      onRemotePlayerAdded: (sessionId) => {
        if (this.entityRenderers.has(sessionId)) return
        const state = this.entityManager.getEntity(sessionId) as HeroState | null
        if (state) this.entityRenderers.set(sessionId, new HeroRenderer(this, state, false))
      },
      onRemotePlayerRemoved: (sessionId) => {
        this.entityRenderers.get(sessionId)?.destroy()
        this.entityRenderers.delete(sessionId)
      },
      onRemotePlayerUpdated: (sessionId) => {
        const state = this.entityManager.getEntity(sessionId)
        const renderer = this.entityRenderers.get(sessionId)
        if (state && renderer && isHero(state) && renderer instanceof HeroRenderer) {
          renderer.sync(state)
        }
      },
      onDamageApplied: (targetId) => {
        this.entityRenderers.get(targetId)?.flash()
      },
      onServerHeroUpdated: (state) => {
        this.handleServerHeroUpdate(state)
      },
      onServerTowerUpdated: (state) => {
        this.handleServerTowerUpdate(state)
      },
      onServerProjectilesUpdated: (projectiles) => {
        this.serverProjectiles = projectiles
      },
    })
    this.networkBridge.setupCallbacks()

    this.gameMode.onSceneCreate()
      .catch(() => {
        this.gameMode.dispose()
        this.networkBridge.replaceGameMode(new OfflineGameMode())
      })
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000
    const localHeroId = this.entityManager.localHeroId
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState
    const input = this.inputHandler.read(localHero.position)
    const isMoving = input.movement.x !== 0 || input.movement.y !== 0
    const isOnline = this.networkBridge.isServerAuthoritative

    // --- Death / Respawn timers (offline only — server handles in online) ---
    if (!isOnline) {
      this.updateDeathRespawn(deltaSeconds)
    }

    // Re-fetch after possible death/respawn updates
    const localHeroNow = this.entityManager.getEntity(localHeroId) as HeroState
    const localDead = localHeroNow.dead

    // --- Local hero actions (skip if dead) ---
    if (!localDead) {
      if (isOnline) {
        this.updateOnlineInput(deltaSeconds, input, isMoving)
      } else {
        this.updateOfflineHero(deltaSeconds, input, isMoving)
      }
    } else {
      // Dead: free camera movement with WASD
      this.updateFreeCamera(input.movement, deltaSeconds)
    }

    // --- Tower + Projectile combat (offline only — server handles in online) ---
    if (!isOnline) {
      this.updateOfflineCombat(deltaSeconds)
    }

    // --- Respawn timer UI ---
    this.updateRespawnUI()

    // --- Effects + renderers ---
    this.meleeSwing.update(delta)
    for (const renderer of this.entityRenderers.values()) {
      renderer.update(delta)
    }
    this.syncEntityRenderers()

    // --- Projectile rendering ---
    if (isOnline) {
      this.projectileRenderer.drawServer(this.serverProjectiles)
    } else {
      this.projectileRenderer.draw(this.combatManager.projectiles)
    }

    // --- Network state broadcast (offline only) ---
    if (!isOnline) {
      this.networkBridge.sendLocalState()
    }
  }

  /** Online mode: send input to server + apply local movement prediction. */
  private updateOnlineInput(
    deltaSeconds: number,
    input: { movement: { x: number; y: number }; attack: boolean; aimWorldPosition: Position },
    isMoving: boolean
  ): void {
    if (!this.inputBuffer || !this.movementPredictor) return

    const localHeroId = this.entityManager.localHeroId
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState

    // Determine attack target from click
    let attackTargetId: string | null = null
    if (input.attack) {
      const enemies = this.entityManager.getEnemiesOf(this.localTeam)
      const target = findClickTarget(
        input.aimWorldPosition,
        enemies,
        (e) => this.entityManager.getEntityRadius(e.id)
      )
      attackTargetId = target?.id ?? null
    }

    // Compute facing
    const attackTarget = localHero.attackTargetId !== null
      ? this.entityManager.getEntity(localHero.attackTargetId)
      : null
    const newFacing = updateFacing(
      localHero.facing,
      input.movement,
      attackTarget?.position ?? null,
      localHero.position
    )

    // Build and send InputMessage
    const seq = this.inputBuffer.getNextSeq()
    const inputMsg: InputMessage = {
      seq,
      moveDir: input.movement,
      attackTargetId,
      facing: newFacing,
    }
    this.inputBuffer.add(inputMsg)
    this.networkBridge.sendInput(inputMsg)

    // Local movement prediction
    if (isMoving) {
      const predicted = this.movementPredictor.applyInput(inputMsg, localHero.stats.speed, deltaSeconds)
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({
        ...h,
        position: { x: predicted.x, y: predicted.y },
        facing: newFacing,
      }))
    } else if (newFacing !== localHero.facing) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({
        ...h,
        facing: newFacing,
      }))
    }
  }

  /** Offline mode: full local hero processing (attack, combat, facing, movement). */
  private updateOfflineHero(
    deltaSeconds: number,
    input: { movement: { x: number; y: number }; attack: boolean; aimWorldPosition: Position },
    isMoving: boolean
  ): void {
    const localHeroId = this.entityManager.localHeroId

    // Input -> attack
    if (input.attack) {
      this.combatManager.handleAttackInput(input.aimWorldPosition)
    }
    const heroNow = this.entityManager.getEntity(localHeroId) as HeroState
    if (isMoving && heroNow.attackTargetId !== null
      && !HERO_DEFINITIONS[heroNow.type].canMoveWhileAttacking) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({ ...h, attackTargetId: null }))
    }

    // Hero combat
    const attackEvents = this.combatManager.processAttack(deltaSeconds)

    // Hero attack events + effects
    for (const e of attackEvents.damageEvents) {
      this.networkBridge.sendDamageEvent({ targetId: e.targetId, amount: e.damage })
      this.entityRenderers.get(e.targetId)?.flash()
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

    // Facing
    const heroForFacing = this.entityManager.getEntity(localHeroId) as HeroState
    const target = heroForFacing.attackTargetId !== null
      ? this.entityManager.getEntity(heroForFacing.attackTargetId)
      : null
    const newFacing = updateFacing(heroForFacing.facing, input.movement, target?.position ?? null, heroForFacing.position)
    if (newFacing !== heroForFacing.facing) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({ ...h, facing: newFacing }))
    }

    // Movement
    if (isMoving) {
      const heroForMove = this.entityManager.getEntity(localHeroId) as HeroState
      const radius = HERO_DEFINITIONS[heroForMove.type].radius
      const newPosition = move(
        heroForMove.position,
        input.movement,
        heroForMove.stats.speed,
        deltaSeconds,
        radius
      )
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({ ...h, position: newPosition }))
    }
  }

  /** Offline mode: tower attacks + projectile resolution. */
  private updateOfflineCombat(deltaSeconds: number): void {
    const towerEvents = this.combatManager.processTowerAttacks(deltaSeconds)
    for (const spawn of towerEvents.projectileSpawnEvents) {
      this.networkBridge.sendProjectileSpawn({
        targetId: spawn.targetId,
        startPosition: spawn.startPosition,
        damage: spawn.damage,
        speed: spawn.speed,
      })
    }
    for (const e of towerEvents.damageEvents) {
      this.networkBridge.sendDamageEvent({ targetId: e.targetId, amount: e.damage })
      this.entityRenderers.get(e.targetId)?.flash()
    }

    const projectileEvents = this.combatManager.processProjectiles(deltaSeconds)
    for (const e of projectileEvents.damageEvents) {
      this.networkBridge.sendDamageEvent({ targetId: e.targetId, amount: e.damage })
      this.entityRenderers.get(e.targetId)?.flash()
    }
  }

  /** Handle server hero state sync (server-authoritative mode). */
  private handleServerHeroUpdate(state: ServerHeroState): void {
    const localSessionId = this.networkBridge.localSessionId
    const isLocal = localSessionId !== null && state.sessionId === localSessionId

    if (isLocal) {
      // Remap local hero ID from placeholder to server sessionId (first time only)
      if (state.sessionId !== this.entityManager.localHeroId) {
        this.remapLocalHeroToSession(state.sessionId)
      }

      // Reconcile movement prediction
      if (this.inputBuffer && this.movementPredictor) {
        this.inputBuffer.acknowledge(state.lastProcessedSeq)
        const heroType = (state.heroType as HeroType) ?? 'BLADE'
        const speed = HERO_DEFINITIONS[heroType].base.speed
        const reconciled = this.movementPredictor.reconcile(
          state.x,
          state.y,
          this.inputBuffer.getUnacknowledged(),
          speed,
          SERVER_TICK_DELTA
        )
        this.entityManager.updateEntity<HeroState>(state.sessionId, (h) => ({
          ...h,
          position: { x: reconciled.x, y: reconciled.y },
          facing: state.facing,
          hp: state.hp,
          maxHp: state.maxHp,
          dead: state.dead,
          attackTargetId: state.attackTargetId || null,
          respawnTimer: state.respawnTimer,
        }))
      } else {
        // Prediction not set up yet — use server position directly
        this.entityManager.updateEntity<HeroState>(state.sessionId, (h) => ({
          ...h,
          position: { x: state.x, y: state.y },
          facing: state.facing,
          hp: state.hp,
          maxHp: state.maxHp,
          dead: state.dead,
          attackTargetId: state.attackTargetId || null,
          respawnTimer: state.respawnTimer,
        }))
      }

      // Handle camera for death/respawn
      if (state.dead && this.cameraFollowing) {
        this.cameras.main.stopFollow()
        this.cameraFollowing = false
      } else if (!state.dead && !this.cameraFollowing) {
        const renderer = this.entityRenderers.get(state.sessionId)
        if (renderer) {
          this.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
        }
        this.cameraFollowing = true
      }
    } else {
      // Remote hero: create entity if new
      const existing = this.entityManager.getEntity(state.sessionId)
      if (!existing) {
        const heroState = createHeroState({
          id: state.sessionId,
          type: (state.heroType as HeroType) ?? 'BLADE',
          team: (state.team as Team) ?? 'red',
          position: { x: state.x, y: state.y },
        })
        this.entityManager.registerEntity(heroState)
      }

      // Create renderer if missing
      if (!this.entityRenderers.has(state.sessionId)) {
        const heroState = this.entityManager.getEntity(state.sessionId) as HeroState
        this.entityRenderers.set(state.sessionId, new HeroRenderer(this, heroState, false))
      }

      // Update entity state from server
      this.entityManager.updateEntity<HeroState>(state.sessionId, (h) => ({
        ...h,
        position: { x: state.x, y: state.y },
        facing: state.facing,
        hp: state.hp,
        maxHp: state.maxHp,
        dead: state.dead,
        attackTargetId: state.attackTargetId || null,
        respawnTimer: state.respawnTimer,
      }))
    }
  }

  /** Handle server tower state sync (server-authoritative mode). */
  private handleServerTowerUpdate(state: ServerTowerState): void {
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
      this.entityRenderers.set(state.id, new TowerRenderer(this, towerEntity, isAlly))
    }

    this.entityManager.updateEntity<TowerState>(state.id, (t) => ({
      ...t,
      hp: state.hp,
      maxHp: state.maxHp,
      dead: state.dead,
    }))
  }

  /**
   * Replace offline placeholder entities with server-assigned session ID.
   * Called once on first server hero state for the local player.
   */
  private remapLocalHeroToSession(sessionId: string): void {
    // Remove offline dummy enemy
    this.entityRenderers.get('enemy-1')?.destroy()
    this.entityRenderers.delete('enemy-1')
    this.entityManager.removeEntity('enemy-1')

    // Remove offline towers (server provides them)
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
      this.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
    }

    // Remap entity in EntityManager
    this.entityManager.remapLocalHero(sessionId)

    // Initialize prediction tools
    this.inputBuffer = new InputBuffer()
    this.movementPredictor = new MovementPredictor()
    const hero = this.entityManager.getEntity(sessionId) as HeroState | null
    if (hero) {
      this.movementPredictor.setPosition(hero.position.x, hero.position.y)
    }
  }

  private updateDeathRespawn(deltaSeconds: number): void {
    const localHeroId = this.entityManager.localHeroId

    // Check death + update timers for all heroes
    for (const hero of this.entityManager.getHeroes()) {
      this.entityManager.updateEntity<HeroState>(hero.id, (h) => {
        const afterDeath = checkHeroDeath(h, DEFAULT_RESPAWN_TIME)
        return updateRespawnTimer(afterDeath, deltaSeconds)
      })
    }

    // Handle local hero death -> stop camera follow
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState
    if (localHero.dead && this.cameraFollowing) {
      this.cameras.main.stopFollow()
      this.cameraFollowing = false
    }

    // Respawn heroes that are ready
    for (const hero of this.entityManager.getHeroes()) {
      if (hero.dead && hero.respawnTimer <= 0) {
        const respawnPos = baseRespawn(hero)
        this.entityManager.updateEntity<HeroState>(hero.id, (h) => respawn(h, respawnPos))

        if (hero.id === localHeroId) {
          this.cameras.main.centerOn(respawnPos.x, respawnPos.y)
          const renderer = this.entityRenderers.get(localHeroId)
          if (renderer) {
            this.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
          }
          this.cameraFollowing = true
        }
      }
    }
  }

  private updateFreeCamera(movement: { x: number; y: number }, deltaSeconds: number): void {
    if (movement.x === 0 && movement.y === 0) return
    const cam = this.cameras.main
    cam.scrollX = Phaser.Math.Clamp(
      cam.scrollX + movement.x * FREE_CAMERA_SPEED * deltaSeconds,
      0,
      WORLD_WIDTH - GAME_WIDTH
    )
    cam.scrollY = Phaser.Math.Clamp(
      cam.scrollY + movement.y * FREE_CAMERA_SPEED * deltaSeconds,
      0,
      WORLD_HEIGHT - GAME_HEIGHT
    )
  }

  private updateRespawnUI(): void {
    const localHero = this.entityManager.getEntity(this.entityManager.localHeroId) as HeroState
    if (localHero.dead) {
      const seconds = Math.ceil(localHero.respawnTimer)
      this.respawnText.setText(`Respawning in ${seconds}...`)
      this.respawnText.setVisible(true)
    } else {
      this.respawnText.setVisible(false)
    }
  }

  private syncEntityRenderers(): void {
    for (const [id, renderer] of this.entityRenderers) {
      const entity = this.entityManager.getEntity(id)
      if (!entity) continue
      if (isHero(entity) && renderer instanceof HeroRenderer) {
        renderer.sync(entity)
      } else if (isTower(entity) && renderer instanceof TowerRenderer) {
        renderer.sync(entity)
      }
    }
  }

  private debugSwitchHero(type: HeroType): void {
    const localHeroId = this.entityManager.localHeroId
    const hero = this.entityManager.getEntity(localHeroId) as HeroState
    if (hero.type === type) return

    this.entityRenderers.get(localHeroId)?.destroy()
    this.combatManager.resetProjectiles()

    this.entityManager.registerEntity(createHeroState({
      id: localHeroId,
      type,
      team: this.localTeam,
      position: this.localSpawnPosition,
    }))

    const newHero = this.entityManager.getEntity(localHeroId) as HeroState
    const renderer = new HeroRenderer(this, newHero, true)
    this.entityRenderers.set(localHeroId, renderer)
    this.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
  }
}
