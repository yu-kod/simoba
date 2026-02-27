import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import { createText } from '@/scenes/ui/createText'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
} from '@/domain/constants'
import { createHeroState, type HeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import { isHero, isMinion, isTower } from '@/domain/entities/typeGuards'
import { updateFacing } from '@/domain/systems/updateFacing'
import { findClickTarget } from '@/domain/systems/findClickTarget'
import { renderMap } from '@/scenes/mapRenderer'
import { HeroRenderer } from '@/scenes/HeroRenderer'
import { MeleeSwingRenderer } from '@/scenes/effects/MeleeSwingRenderer'
import { ProjectileRenderer } from '@/scenes/effects/ProjectileRenderer'
import { InputHandler } from '@/scenes/InputHandler'
import { EntityManager } from '@/scenes/EntityManager'
import { NetworkBridge } from '@/scenes/NetworkBridge'
import { InputBuffer } from '@/network/InputBuffer'
import { InterpolationBuffer } from '@/network/InterpolationBuffer'
import type { HeroType, Team, Position } from '@/domain/types'
import type { TowerState } from '@/domain/entities/Tower'
import type { GameMode, ServerHeroState, ServerTowerState, ServerMinionState, ServerProjectileState } from '@/network/GameMode'
import type { AttackEvent, DamageEvent as ServerDamageEvent, DeathEvent } from '@shared/messages'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'
import { MAP_LAYOUT } from '@/domain/mapLayout'
import { TowerRenderer } from '@/scenes/effects/TowerRenderer'
import { MinionRenderer } from '@/scenes/effects/MinionRenderer'
import type { MinionState } from '@shared/entities/Minion'
import { registerTestApi } from '@/test/e2eTestApi'
import { GameHud } from '@/scenes/ui/GameHud'

const FREE_CAMERA_SPEED = 400

/** Assert that a server-provided heroType string is a valid HeroType key. */
function assertHeroType(value: string): HeroType {
  if (!(value in HERO_DEFINITIONS)) {
    throw new Error(`Invalid heroType from server: "${value}"`)
  }
  return value as HeroType
}

interface EntityRenderer {
  readonly gameObject: Phaser.GameObjects.Container
  update(delta: number): void
  flash(): void
  destroy(): void
}

export class GameScene extends Phaser.Scene {
  private entityManager!: EntityManager
  private networkBridge!: NetworkBridge
  private inputHandler!: InputHandler

  private entityRenderers = new Map<string, EntityRenderer>()
  private meleeSwing!: MeleeSwingRenderer
  private projectileRenderer!: ProjectileRenderer
  private respawnText!: Phaser.GameObjects.Text
  private gameHud!: GameHud
  private cameraFollowing = true
  private gameMode!: GameMode
  private localTeam: Team = 'blue'
  private localSpawnPosition: Position = { x: GAME_WIDTH / 4, y: WORLD_HEIGHT / 2 }
  private localHeroType: HeroType = 'BLADE'

  // Match end state
  private matchEnded = false

  // Input sending
  private inputBuffer: InputBuffer | null = null
  private serverProjectiles: readonly ServerProjectileState[] = []
  // Entity interpolation
  private interpolationBuffers = new Map<string, InterpolationBuffer>()
  private projectileInterpolationBuffers = new Map<string, InterpolationBuffer>()
  // Projectiles removed by server but still rendering (interpolation catch-up)
  private retiredProjectiles = new Map<string, { state: ServerProjectileState; buffer: InterpolationBuffer; retiredAt: number }>()

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data?: { gameMode?: GameMode; localTeam?: Team; localPosition?: Position; heroType?: HeroType }): void {
    if (!data?.gameMode) {
      console.error('GameScene: No gameMode provided, returning to LobbyScene')
      this.scene.start('LobbyScene')
      return
    }
    this.gameMode = data.gameMode
    this.localTeam = data.localTeam ?? 'blue'
    this.localSpawnPosition = data.localPosition ?? { x: GAME_WIDTH / 4, y: WORLD_HEIGHT / 2 }
    this.localHeroType = data.heroType ?? 'BLADE'
  }

  create(): void {
    if (!this.gameMode) return

    renderMap(this)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    // Zoom camera so the viewport covers the same game area as the base 1280x720 design.
    // The canvas buffer is 2560x1440 for sharp rendering; zoom keeps gameplay feel identical.
    const BASE_WIDTH = 1280
    const CAMERA_ZOOM = GAME_WIDTH / BASE_WIDTH
    this.cameras.main.setZoom(CAMERA_ZOOM)

    // Entity manager with local hero placeholder
    this.entityManager = new EntityManager(
      { id: 'player-1', type: this.localHeroType, team: this.localTeam, position: this.localSpawnPosition },
      { id: 'enemy-1', type: 'BLADE', team: this.localTeam === 'blue' ? 'red' : 'blue', position: { x: GAME_WIDTH / 4 + 200, y: WORLD_HEIGHT / 2 } }
    )

    // Towers (placeholders — server provides real towers)
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

    // Renderers
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
    this.respawnText = createText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
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

    // Game HUD (skill bar, level badge, XP bar, HP bar)
    this.gameHud = new GameHud(this, CAMERA_ZOOM)

    // E2E test API (dev only)
    if (import.meta.env.DEV) {
      registerTestApi(this.entityManager, {
        getProjectileCount: () => this.serverProjectiles.length,
      })
    }

    // Network
    this.initGameMode()
  }

  private initGameMode(): void {
    this.networkBridge = new NetworkBridge(this.gameMode, {
      onRemotePlayerRemoved: (sessionId) => {
        this.entityRenderers.get(sessionId)?.destroy()
        this.entityRenderers.delete(sessionId)
        this.interpolationBuffers.delete(sessionId)
      },
      onServerHeroUpdated: (state) => {
        this.handleServerHeroUpdate(state)
      },
      onServerTowerUpdated: (state) => {
        this.handleServerTowerUpdate(state)
      },
      onServerMinionUpdated: (state) => {
        this.handleServerMinionUpdate(state)
      },
      onServerMinionRemoved: (minionId) => {
        this.handleServerMinionRemove(minionId)
      },
      onServerProjectilesUpdated: (projectiles) => {
        const activeIds = new Set<string>()
        for (const p of projectiles) {
          activeIds.add(p.id)
          if (!this.projectileInterpolationBuffers.has(p.id)) {
            this.projectileInterpolationBuffers.set(p.id, new InterpolationBuffer())
          }
          this.projectileInterpolationBuffers.get(p.id)!.pushSnapshot({
            x: p.x, y: p.y, facing: 0,
          })
        }
        // Move destroyed projectiles to retired list (keeps rendering for catch-up)
        // Use previous serverProjectiles to preserve team/radius info
        const prevById = new Map(this.serverProjectiles.map((p) => [p.id, p]))
        for (const id of this.projectileInterpolationBuffers.keys()) {
          if (!activeIds.has(id)) {
            const buffer = this.projectileInterpolationBuffers.get(id)!
            const prev = prevById.get(id)
            if (prev) {
              this.retiredProjectiles.set(id, {
                state: prev,
                buffer,
                retiredAt: performance.now(),
              })
            }
            this.projectileInterpolationBuffers.delete(id)
          }
        }
        this.serverProjectiles = projectiles
      },
      onAttackEvent: (event) => {
        this.handleAttackEvent(event)
      },
      onDamageEvent: (event) => {
        this.handleDamageEvent(event)
      },
      onDeathEvent: (event) => {
        this.handleDeathEvent(event)
      },
    })
    this.networkBridge.setupCallbacks()

    // Match end callback
    this.gameMode.onMatchEnd((winnerTeam) => {
      this.showMatchEndOverlay(winnerTeam)
    })

    this.gameMode.onSceneCreate()
  }

  update(_time: number, delta: number): void {
    if (this.matchEnded) return

    const deltaSeconds = delta / 1000
    const localHeroId = this.entityManager.localHeroId
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState
    const input = this.inputHandler.read(localHero.position)
    const isMoving = input.movement.x !== 0 || input.movement.y !== 0

    const localDead = localHero.dead

    // --- Local hero actions (skip if dead) ---
    if (!localDead) {
      this.updateOnlineInput(deltaSeconds, input, isMoving)
    } else {
      // Dead: free camera movement with WASD
      this.updateFreeCamera(input.movement, deltaSeconds)
    }

    // --- Respawn timer UI ---
    this.updateRespawnUI()

    // --- Game HUD ---
    this.gameHud.update(delta, localHero)

    // --- Entity interpolation ---
    const localId = this.entityManager.localHeroId
    for (const [entityId, buffer] of this.interpolationBuffers) {
      const interpolated = buffer.getInterpolatedPosition()
      if (!interpolated) continue
      if (!this.entityManager.getEntity(entityId)) continue
      if (entityId === localId) {
        // Local hero: only interpolate position, keep locally-computed facing
        this.entityManager.updateEntity<HeroState>(entityId, (hero) => ({
          ...hero,
          position: { x: interpolated.x, y: interpolated.y },
        }))
      } else {
        // Remote heroes: interpolate both position and facing
        this.entityManager.updateEntity<HeroState>(entityId, (hero) => ({
          ...hero,
          position: { x: interpolated.x, y: interpolated.y },
          facing: interpolated.facing,
        }))
      }
    }

    // --- Effects + renderers ---
    this.meleeSwing.update(delta)
    for (const renderer of this.entityRenderers.values()) {
      renderer.update(delta)
    }
    this.syncEntityRenderers()

    // --- Projectile rendering (interpolated) ---
    const interpolatedProjectiles: ServerProjectileState[] = this.serverProjectiles.map((p) => {
      const buffer = this.projectileInterpolationBuffers.get(p.id)
      if (!buffer) return p
      const interp = buffer.getInterpolatedPosition()
      if (!interp) return p
      return { ...p, x: interp.x, y: interp.y }
    })
    // Include retired projectiles (catch-up rendering after server removal)
    const RETIRED_TTL = 150 // ms — keep rendering after server removal
    const now = performance.now()
    for (const [id, retired] of this.retiredProjectiles) {
      if (now - retired.retiredAt > RETIRED_TTL) {
        this.retiredProjectiles.delete(id)
        continue
      }
      const interp = retired.buffer.getInterpolatedPosition()
      if (interp) {
        interpolatedProjectiles.push({ ...retired.state, x: interp.x, y: interp.y })
      }
    }
    this.projectileRenderer.drawServer(interpolatedProjectiles)
  }

  /** Send input to server + apply local facing/target updates. */
  private updateOnlineInput(
    _deltaSeconds: number,
    input: { movement: { x: number; y: number }; attack: boolean; aimWorldPosition: Position },
    isMoving: boolean
  ): void {
    if (!this.inputBuffer) return

    const localHeroId = this.entityManager.localHeroId
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState

    // Attack target selection
    let attackTargetId: string | null = localHero.attackTargetId
    if (input.attack) {
      const enemies = this.entityManager.getEnemiesOf(this.localTeam)
      const target = findClickTarget(
        input.aimWorldPosition,
        enemies,
        (e) => this.entityManager.getEntityRadius(e.id)
      )
      attackTargetId = target?.id ?? null
    }

    // Clear target on move if hero can't move while attacking
    if (isMoving && attackTargetId !== null
      && !HERO_DEFINITIONS[localHero.type].canMoveWhileAttacking) {
      attackTargetId = null
    }

    // Facing
    const attackTarget = attackTargetId !== null
      ? this.entityManager.getEntity(attackTargetId)
      : null
    const newFacing = updateFacing(
      localHero.facing,
      input.movement,
      attackTarget?.position ?? null,
      localHero.position
    )

    // Input message
    const seq = this.inputBuffer.getNextSeq()
    const inputMsg = {
      seq,
      moveDir: input.movement,
      attackTargetId,
      facing: newFacing,
    }

    // Send input to server
    this.inputBuffer.add(inputMsg)
    this.networkBridge.sendInput(inputMsg)

    // Update local state for facing/target (position comes from server via interpolation)
    const needsUpdate = newFacing !== localHero.facing
      || attackTargetId !== localHero.attackTargetId

    if (needsUpdate) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({
        ...h,
        attackTargetId,
        facing: newFacing,
      }))
    }
  }

  /** Handle server hero state sync. */
  private handleServerHeroUpdate(state: ServerHeroState): void {
    const localSessionId = this.networkBridge.localSessionId
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

  /** Ensure hero entity and renderer exist for the given session. */
  private ensureHeroEntityExists(state: ServerHeroState, isLocal: boolean): void {
    // Local hero: remap placeholder ID to server sessionId (first time only)
    if (isLocal && state.sessionId !== this.entityManager.localHeroId) {
      this.remapLocalHeroToSession(state.sessionId)
    }

    // Remote hero: create entity if new
    if (!isLocal && !this.entityManager.getEntity(state.sessionId)) {
      const heroState = createHeroState({
        id: state.sessionId,
        type: assertHeroType(state.heroType),
        team: (state.team as Team) ?? 'red',
        position: { x: state.x, y: state.y },
      })
      this.entityManager.registerEntity(heroState)
    }

    // Create renderer if missing
    if (!this.entityRenderers.has(state.sessionId)) {
      const heroState = this.entityManager.getEntity(state.sessionId) as HeroState
      const isAlly = (state.team as Team) === this.localTeam
      this.entityRenderers.set(state.sessionId, new HeroRenderer(this, heroState, isAlly))
    }
  }

  /** Apply non-position fields only (position/facing from InterpolationBuffer). */
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
    }))
  }

  /** Local hero overrides — camera control and prediction reset. */
  private applyLocalHeroOverrides(state: ServerHeroState, prevDead: boolean): void {
    // Camera control for death/respawn
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

    // Clear input buffer on death/respawn transitions
    if (!prevDead && state.dead) {
      this.inputBuffer?.clear()
    }
  }

  /** Handle server tower state sync. */
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

  private handleServerMinionUpdate(state: ServerMinionState): void {
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
      this.entityRenderers.set(state.id, new MinionRenderer(this, minionEntity, isAlly))
    }

    this.entityManager.updateEntity<MinionState>(state.id, (m) => ({
      ...m,
      position: { x: state.x, y: state.y },
      facing: state.facing,
      hp: state.hp,
      maxHp: state.maxHp,
      dead: state.dead,
    }))
  }

  private handleServerMinionRemove(minionId: string): void {
    const renderer = this.entityRenderers.get(minionId)
    if (renderer) {
      renderer.destroy()
      this.entityRenderers.delete(minionId)
    }
    this.entityManager.removeEntity(minionId)
  }

  private handleAttackEvent(event: AttackEvent): void {
    if (event.attackType !== 'melee') return
    this.meleeSwing.play({ position: event.position, facing: event.facing })
  }

  private handleDamageEvent(event: ServerDamageEvent): void {
    this.entityRenderers.get(event.targetId)?.flash()
  }

  private handleDeathEvent(_event: DeathEvent): void {
    // Future: death animation, respawn effect, etc.
  }

  /**
   * Replace placeholder entities with server-assigned session ID.
   * Called once on first server hero state for the local player.
   */
  private remapLocalHeroToSession(sessionId: string): void {
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
      this.cameras.main.startFollow(renderer.gameObject, true, CAMERA_LERP, CAMERA_LERP)
    }

    // Remap entity in EntityManager
    this.entityManager.remapLocalHero(sessionId)

    // Initialize input buffer
    this.inputBuffer = new InputBuffer()
  }

  private updateFreeCamera(movement: { x: number; y: number }, deltaSeconds: number): void {
    if (movement.x === 0 && movement.y === 0) return
    const cam = this.cameras.main
    const viewWidth = GAME_WIDTH / cam.zoom
    const viewHeight = GAME_HEIGHT / cam.zoom
    cam.scrollX = Phaser.Math.Clamp(
      cam.scrollX + movement.x * FREE_CAMERA_SPEED * deltaSeconds,
      0,
      Math.max(0, WORLD_WIDTH - viewWidth)
    )
    cam.scrollY = Phaser.Math.Clamp(
      cam.scrollY + movement.y * FREE_CAMERA_SPEED * deltaSeconds,
      0,
      Math.max(0, WORLD_HEIGHT - viewHeight)
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

  /**
   * Show the VICTORY / DEFEAT overlay with a "Back to Lobby" button.
   */
  private showMatchEndOverlay(winnerTeam: string): void {
    if (this.matchEnded) return
    this.matchEnded = true

    const isVictory = winnerTeam === this.localTeam
    const resultText = isVictory ? 'VICTORY' : 'DEFEAT'
    const resultColor = isVictory ? '#FFD700' : '#FF4444'

    // Semi-transparent overlay (fixed to camera)
    const overlay = this.add.graphics()
    overlay.setScrollFactor(0)
    overlay.setDepth(2000)
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Result text
    const text = createText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, resultText, {
      fontSize: '72px',
      color: resultColor,
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
      align: 'center',
    })
    text.setOrigin(0.5)
    text.setScrollFactor(0)
    text.setDepth(2001)

    // "Back to Lobby" button
    const buttonText = createText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Back to Lobby', {
      fontSize: '32px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: '#333333',
      padding: { x: 24, y: 12 },
    })
    buttonText.setOrigin(0.5)
    buttonText.setScrollFactor(0)
    buttonText.setDepth(2001)
    buttonText.setInteractive({ useHandCursor: true })

    buttonText.on('pointerover', () => {
      buttonText.setStyle({ backgroundColor: '#555555' })
    })
    buttonText.on('pointerout', () => {
      buttonText.setStyle({ backgroundColor: '#333333' })
    })
    buttonText.on('pointerdown', () => {
      this.gameMode.dispose()
      this.scene.start('LobbyScene')
    })
  }

  private syncEntityRenderers(): void {
    for (const [id, renderer] of this.entityRenderers) {
      const entity = this.entityManager.getEntity(id)
      if (!entity) continue
      if (isHero(entity) && renderer instanceof HeroRenderer) {
        renderer.sync(entity)
      } else if (isTower(entity) && renderer instanceof TowerRenderer) {
        renderer.sync(entity)
      } else if (isMinion(entity) && renderer instanceof MinionRenderer) {
        renderer.sync(entity)
      }
    }
  }
}
