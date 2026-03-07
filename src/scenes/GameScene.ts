import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig'
import { createText } from '@/scenes/ui/createText'
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CAMERA_LERP,
} from '@/domain/constants'
import { type HeroState } from '@/domain/entities/Hero'
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
import { ServerEntitySync, type EntityRenderer } from '@/scenes/ServerEntitySync'
import { InterpolationBuffer } from '@/network/InterpolationBuffer'
import type { HeroType, Team, Position, AttackerEntityState } from '@/domain/types'
import type { GameMode, ServerProjectileState } from '@/network/GameMode'
import type { AttackEvent, DamageEvent as ServerDamageEvent, DeathEvent } from '@shared/messages'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'
import { MAP_LAYOUT } from '@/domain/mapLayout'
import { TowerRenderer } from '@/scenes/effects/TowerRenderer'
import { MinionRenderer } from '@/scenes/effects/MinionRenderer'
import { registerTestApi } from '@/test/e2eTestApi'
import { GameHud } from '@/scenes/ui/GameHud'
import { TalentTreeOverlay } from '@/scenes/ui/TalentTreeOverlay'
import { createClientLogger } from '@shared/logging'

const logger = createClientLogger('scene')

const FREE_CAMERA_SPEED = 400

export class GameScene extends Phaser.Scene {
  private entityManager!: EntityManager
  private networkBridge!: NetworkBridge
  private inputHandler!: InputHandler
  private entitySync!: ServerEntitySync

  private entityRenderers = new Map<string, EntityRenderer>()
  private meleeSwing!: MeleeSwingRenderer
  private projectileRenderer!: ProjectileRenderer
  private respawnText!: Phaser.GameObjects.Text
  private gameHud!: GameHud
  private talentTreeOverlay!: TalentTreeOverlay
  private gameMode!: GameMode
  private localTeam: Team = 'blue'
  private localSpawnPosition: Position = { x: GAME_WIDTH / 4, y: WORLD_HEIGHT / 2 }
  private localHeroType: HeroType = 'BLADE'

  // Match end state
  private matchEnded = false

  // Entity interpolation
  private interpolationBuffers = new Map<string, InterpolationBuffer>()
  private projectileInterpolationBuffers = new Map<string, InterpolationBuffer>()
  private serverProjectiles: readonly ServerProjectileState[] = []
  // Projectiles removed by server but still rendering (interpolation catch-up)
  private retiredProjectiles = new Map<string, { state: ServerProjectileState; buffer: InterpolationBuffer; retiredAt: number }>()

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data?: { gameMode?: GameMode; localTeam?: Team; localPosition?: Position; heroType?: HeroType }): void {
    if (!data?.gameMode) {
      logger.error('No gameMode provided, returning to LobbyScene')
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
    logger.debug('Scene created', { sceneKey: this.scene.key })

    renderMap(this)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    const DESIGN_WIDTH = 1280
    const CAMERA_ZOOM = GAME_WIDTH / DESIGN_WIDTH
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

    // Server entity sync (heroes, towers, minions)
    this.entitySync = new ServerEntitySync(
      this,
      this.entityManager,
      this.entityRenderers,
      this.interpolationBuffers,
      this.localTeam,
    )

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
    this.gameHud = new GameHud(this, CAMERA_ZOOM, () => {
      this.talentTreeOverlay.toggle()
    })

    // Talent tree overlay
    this.talentTreeOverlay = new TalentTreeOverlay(this, CAMERA_ZOOM, {
      onAcquireTalent: (talentId) => this.networkBridge.sendAcquireTalent(talentId),
      onAssignSkillSlot: (skillId, slot) => this.networkBridge.sendAssignSkillSlot(skillId, slot),
      onSwapSkillSlots: (slotA, slotB) => this.networkBridge.sendSwapSkillSlots(slotA, slotB),
      onUnequipSkillSlot: (slot) => this.networkBridge.sendUnequipSkillSlot(slot),
    })
    this.talentTreeOverlay.setHeroType(this.localHeroType)

    // Tab key toggles talent tree
    this.input.keyboard!.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault()
      this.talentTreeOverlay.toggle()
    })

    // ESC key closes talent tree
    this.input.keyboard!.on('keydown-ESC', () => {
      if (this.talentTreeOverlay.isOpen()) {
        this.talentTreeOverlay.toggle()
      }
    })

    // Scene-level pointer events for UI (scrollFactor(0) containers need manual hit testing)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return // left click only for UI
      if (this.talentTreeOverlay.isOpen()) {
        this.talentTreeOverlay.handlePointerDown(pointer)
      } else {
        this.gameHud.handlePointerDown(pointer)
      }
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.talentTreeOverlay.isOpen()) {
        this.talentTreeOverlay.handlePointerMove(pointer)
      }
    })

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
        this.entitySync.handleServerHeroUpdate(state, this.networkBridge.localSessionId)
      },
      onServerTowerUpdated: (state) => {
        this.entitySync.handleServerTowerUpdate(state)
      },
      onServerMinionUpdated: (state) => {
        this.entitySync.handleServerMinionUpdate(state)
      },
      onServerMinionRemoved: (minionId) => {
        this.entitySync.handleServerMinionRemove(minionId)
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

  shutdown(): void {
    logger.debug('Scene shutdown', { sceneKey: this.scene.key })
    this.gameHud.destroy()
    this.talentTreeOverlay.destroy()
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
    // When talent tree is open, allow movement only (suppress attack & skills)
    const effectiveInput = this.talentTreeOverlay.isOpen()
      ? { ...input, attack: false, targeting: { phase: 'idle' as const } }
      : input
    if (!localDead) {
      this.updateOnlineInput(deltaSeconds, effectiveInput, isMoving)
    } else {
      // Dead: free camera movement with WASD
      this.updateFreeCamera(input.movement, deltaSeconds)
    }

    // --- Respawn timer UI ---
    this.updateRespawnUI()

    // --- Game HUD ---
    this.gameHud.update(delta, localHero)

    // --- Talent tree overlay ---
    this.talentTreeOverlay.update(localHero)

    // --- Entity interpolation (heroes + minions) ---
    const localId = this.entityManager.localHeroId
    for (const [entityId, buffer] of this.interpolationBuffers) {
      const interpolated = buffer.getInterpolatedPosition()
      if (!interpolated) continue
      if (!this.entityManager.getEntity(entityId)) continue
      if (entityId === localId) {
        this.entityManager.updateEntity<HeroState>(entityId, (entity) => ({
          ...entity,
          position: { x: interpolated.x, y: interpolated.y },
        }))
      } else {
        this.entityManager.updateEntity<AttackerEntityState>(entityId, (entity) => ({
          ...entity,
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
    if (!this.entitySync.inputBuffer) return

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
    const seq = this.entitySync.inputBuffer.getNextSeq()
    const inputMsg = {
      seq,
      moveDir: input.movement,
      attackTargetId,
      facing: newFacing,
    }

    // Send input to server
    this.entitySync.inputBuffer.add(inputMsg)
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

  private showMatchEndOverlay(winnerTeam: string): void {
    if (this.matchEnded) return
    this.matchEnded = true

    const isVictory = winnerTeam === this.localTeam
    const resultText = isVictory ? 'VICTORY' : 'DEFEAT'
    const resultColor = isVictory ? '#FFD700' : '#FF4444'

    const overlay = this.add.graphics()
    overlay.setScrollFactor(0)
    overlay.setDepth(2000)
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

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
