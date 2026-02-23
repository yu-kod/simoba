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
import type { InputMessage, AttackEvent, DamageEvent as ServerDamageEvent, DeathEvent } from '@shared/messages'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'
import { MAP_LAYOUT } from '@/domain/mapLayout'
import { TowerRenderer } from '@/scenes/effects/TowerRenderer'
import { registerTestApi } from '@/test/e2eTestApi'

const FREE_CAMERA_SPEED = 400
const SERVER_TICK_DELTA = 1 / 60

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
      // Server-authoritative combat events
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

    // === Gather: read snapshot once ===
    const localHeroId = this.entityManager.localHeroId
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState

    // === Compute: derive all values from snapshot + input ===

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

    // Facing (based on computed attackTargetId, not stale reference)
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
    const inputMsg: InputMessage = {
      seq,
      moveDir: input.movement,
      attackTargetId,
      facing: newFacing,
    }

    // Prediction position
    const predicted = isMoving
      ? this.movementPredictor.applyInput(inputMsg, localHero.stats.speed, deltaSeconds)
      : null

    // === Apply: single updateEntity + network send ===
    this.inputBuffer.add(inputMsg)
    this.networkBridge.sendInput(inputMsg)

    const needsUpdate = predicted !== null
      || newFacing !== localHero.facing
      || attackTargetId !== localHero.attackTargetId

    if (needsUpdate) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({
        ...h,
        attackTargetId,
        facing: newFacing,
        ...(predicted !== null ? { position: { x: predicted.x, y: predicted.y } } : {}),
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

    // === Attack input (may update entity state internally) ===
    if (input.attack) {
      this.combatManager.handleAttackInput(input.aimWorldPosition)
    }

    // === Gather: snapshot after attack input ===
    const localHero = this.entityManager.getEntity(localHeroId) as HeroState

    // === Compute: clear target + facing + movement from single snapshot ===
    let attackTargetId = localHero.attackTargetId
    if (isMoving && attackTargetId !== null
      && !HERO_DEFINITIONS[localHero.type].canMoveWhileAttacking) {
      attackTargetId = null
    }

    // Combat processing (may call updateEntity internally — design allows this)
    if (attackTargetId !== localHero.attackTargetId) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({ ...h, attackTargetId }))
    }
    const attackEvents = this.combatManager.processAttack(deltaSeconds)

    // Attack effects (event dispatch only, no entity state mutation)
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

    // Facing (from gathered snapshot, not re-fetched)
    const target = attackTargetId !== null
      ? this.entityManager.getEntity(attackTargetId)
      : null
    const newFacing = updateFacing(localHero.facing, input.movement, target?.position ?? null, localHero.position)

    // Movement (from gathered snapshot, using server-authoritative radius)
    const newPosition = isMoving
      ? move(localHero.position, input.movement, localHero.stats.speed, deltaSeconds, localHero.radius)
      : null

    // === Apply: single updateEntity for facing + movement ===
    const needsUpdate = newFacing !== localHero.facing || newPosition !== null
    if (needsUpdate) {
      this.entityManager.updateEntity<HeroState>(localHeroId, (h) => ({
        ...h,
        facing: newFacing,
        ...(newPosition !== null ? { position: newPosition } : {}),
      }))
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
  /** Handle server hero state sync (server-authoritative mode). */
  private handleServerHeroUpdate(state: ServerHeroState): void {
    const localSessionId = this.networkBridge.localSessionId
    const isLocal = localSessionId !== null && state.sessionId === localSessionId

    // Track previous dead state for prediction reset (death/respawn transitions)
    const prevDead = (this.entityManager.getEntity(state.sessionId) as HeroState | null)?.dead ?? state.dead

    // Step 1: Ensure entity & renderer exist (local/remote共通)
    this.ensureHeroEntityExists(state, isLocal)

    // Step 2: Apply server state to all heroes equally (1箇所のみ)
    const position = this.computeHeroPosition(state, isLocal)
    this.applyServerHeroState(state, position)

    // Step 3: Local-only overrides (prediction, camera, death/respawn)
    if (isLocal) {
      this.applyLocalHeroOverrides(state, prevDead)
    }

    // Damage flash + melee swing effects are now handled by event-based
    // callbacks (onDamageEvent, onAttackEvent) instead of state-diff detection.
  }

  /** Step 1: Ensure hero entity and renderer exist for the given session. */
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

    // Create renderer if missing (local/remote共通)
    if (!this.entityRenderers.has(state.sessionId)) {
      const heroState = this.entityManager.getEntity(state.sessionId) as HeroState
      const isAlly = (state.team as Team) === this.localTeam
      this.entityRenderers.set(state.sessionId, new HeroRenderer(this, heroState, isAlly))
    }
  }

  /** Compute hero position: predicted position for local hero, server position for remote. */
  private computeHeroPosition(state: ServerHeroState, isLocal: boolean): Position {
    if (isLocal && this.inputBuffer && this.movementPredictor) {
      this.inputBuffer.acknowledge(state.lastProcessedSeq)
      const heroType = assertHeroType(state.heroType)
      const speed = HERO_DEFINITIONS[heroType].base.speed
      const reconciled = this.movementPredictor.reconcile(
        state.x,
        state.y,
        this.inputBuffer.getUnacknowledged(),
        speed,
        SERVER_TICK_DELTA
      )
      return { x: reconciled.x, y: reconciled.y }
    }
    return { x: state.x, y: state.y }
  }

  /** Step 2: Apply server state to entity (single source of truth for all fields). */
  private applyServerHeroState(state: ServerHeroState, position: Position): void {
    this.entityManager.updateEntity<HeroState>(state.sessionId, (h) => ({
      ...h,
      type: assertHeroType(state.heroType),
      radius: state.radius,
      position,
      facing: state.facing,
      hp: state.hp,
      maxHp: state.maxHp,
      dead: state.dead,
      attackTargetId: state.attackTargetId || null,
      respawnTimer: state.respawnTimer,
    }))
  }

  /** Step 3: Local hero overrides — camera control and prediction reset. */
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

    // Reset prediction on death/respawn transitions
    if (!prevDead && state.dead) {
      this.inputBuffer?.clear()
      this.movementPredictor?.setPosition(state.x, state.y)
    } else if (prevDead && !state.dead) {
      this.movementPredictor?.setPosition(state.x, state.y)
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
    // Damage flash is now handled by onDamageEvent callback.
  }

  /** Handle server attack event: play melee swing for melee attacks. */
  private handleAttackEvent(event: AttackEvent): void {
    if (event.attackType !== 'melee') return
    this.meleeSwing.play({ position: event.position, facing: event.facing })
  }

  /** Handle server damage event: flash the damaged entity. */
  private handleDamageEvent(event: ServerDamageEvent): void {
    this.entityRenderers.get(event.targetId)?.flash()
  }

  /** Handle server death/respawn event (placeholder for future visuals). */
  private handleDeathEvent(_event: DeathEvent): void {
    // Future: death animation, respawn effect, etc.
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

}
