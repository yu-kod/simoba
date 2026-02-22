import { describe, it, expect, vi } from 'vitest'

vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      constructor(_config?: unknown) { /* noop */ }
    },
    Display: { Color: { HexStringToColor: () => ({ color: 0 }) } },
    Math: { Clamp: (v: number, min: number, max: number) => Math.min(Math.max(v, min), max) },
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    AUTO: 0,
  },
}))

vi.mock('@/scenes/mapRenderer', () => ({ renderMap: vi.fn() }))
vi.mock('@/scenes/HeroRenderer', () => ({
  HeroRenderer: vi.fn().mockImplementation(() => ({
    gameObject: {},
    sync: vi.fn(),
    update: vi.fn(),
    flash: vi.fn(),
    destroy: vi.fn(),
  })),
}))
vi.mock('@/scenes/effects/MeleeSwingRenderer', () => ({
  MeleeSwingRenderer: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    update: vi.fn(),
  })),
}))
vi.mock('@/scenes/effects/ProjectileRenderer', () => ({
  ProjectileRenderer: vi.fn().mockImplementation(() => ({
    draw: vi.fn(),
    drawServer: vi.fn(),
  })),
}))
vi.mock('@/scenes/effects/TowerRenderer', () => ({
  TowerRenderer: vi.fn().mockImplementation(() => ({
    gameObject: {},
    sync: vi.fn(),
    update: vi.fn(),
    flash: vi.fn(),
    destroy: vi.fn(),
  })),
}))
vi.mock('@/scenes/InputHandler', () => ({
  InputHandler: vi.fn().mockImplementation(() => ({
    read: vi.fn().mockReturnValue({
      movement: { x: 0, y: 0 },
      attack: false,
      aimWorldPosition: { x: 0, y: 0 },
    }),
  })),
}))
vi.mock('@/test/e2eTestApi', () => ({
  registerTestApi: vi.fn(),
}))

import { GameScene } from '@/scenes/GameScene'
import { EntityManager } from '@/scenes/EntityManager'
import { CombatManager } from '@/scenes/CombatManager'
import { NetworkBridge } from '@/scenes/NetworkBridge'
import { InputBuffer } from '@/network/InputBuffer'
import { MovementPredictor } from '@/network/MovementPredictor'
import { OfflineGameMode } from '@/network/OfflineGameMode'
import type { GameMode, ServerHeroState, ServerTowerState } from '@/network/GameMode'
import { createTowerState } from '@/domain/entities/Tower'
import { DEFAULT_TOWER } from '@/domain/entities/towerDefinitions'

function createMockGameMode(overrides?: Partial<GameMode>): GameMode {
  return {
    isServerAuthoritative: true,
    localSessionId: 'local-session',
    onSceneCreate: vi.fn().mockResolvedValue(undefined),
    sendInput: vi.fn(),
    sendLocalState: vi.fn(),
    sendDamageEvent: vi.fn(),
    sendProjectileSpawn: vi.fn(),
    onRemotePlayerUpdate: vi.fn(),
    onRemotePlayerJoin: vi.fn(),
    onRemotePlayerLeave: vi.fn(),
    onRemoteDamage: vi.fn(),
    onRemoteProjectileSpawn: vi.fn(),
    onServerHeroUpdate: vi.fn(),
    onServerHeroRemove: vi.fn(),
    onServerTowerUpdate: vi.fn(),
    onServerProjectileUpdate: vi.fn(),
    dispose: vi.fn(),
    ...overrides,
  }
}

function createMockRenderer() {
  return {
    gameObject: {},
    sync: vi.fn(),
    update: vi.fn(),
    flash: vi.fn(),
    destroy: vi.fn(),
  }
}

/**
 * Set up a GameScene with enough internals to test handleServerHeroUpdate / handleServerTowerUpdate.
 * Bypasses Phaser's create() by directly assigning private fields.
 */
function setupSceneForServerUpdate(options?: { localSessionId?: string }) {
  const localSessionId = options?.localSessionId ?? 'local-session'

  const scene = new GameScene()

  const em = new EntityManager(
    { id: localSessionId, type: 'BLADE', team: 'blue', position: { x: 100, y: 200 } },
    { id: 'enemy-1', type: 'BLADE', team: 'red', position: { x: 300, y: 200 } }
  )
  const cm = new CombatManager(em)
  const gm = createMockGameMode({ localSessionId })
  const bridge = new NetworkBridge(gm, em, cm)

  const mockMeleeSwing = { play: vi.fn(), update: vi.fn() }
  const inputBuffer = new InputBuffer()
  const movementPredictor = new MovementPredictor()
  movementPredictor.setPosition(100, 200)

  // Assign private fields
  const s = scene as Record<string, unknown>
  s.entityManager = em
  s.combatManager = cm
  s.networkBridge = bridge
  s.entityRenderers = new Map()
  s.meleeSwing = mockMeleeSwing
  s.inputBuffer = inputBuffer
  s.movementPredictor = movementPredictor
  s.cameraFollowing = true
  s.cameras = { main: { stopFollow: vi.fn(), startFollow: vi.fn() } }
  s.localTeam = 'blue'

  // Create renderers for existing entities
  const localRenderer = createMockRenderer()
  const enemyRenderer = createMockRenderer()
  ;(s.entityRenderers as Map<string, unknown>).set(localSessionId, localRenderer)
  ;(s.entityRenderers as Map<string, unknown>).set('enemy-1', enemyRenderer)

  return {
    scene,
    em,
    gm,
    bridge,
    mockMeleeSwing,
    inputBuffer,
    movementPredictor,
    localRenderer,
    enemyRenderer,
    getRenderer: (id: string) => (s.entityRenderers as Map<string, ReturnType<typeof createMockRenderer>>).get(id),
    setRenderer: (id: string, r: ReturnType<typeof createMockRenderer>) =>
      (s.entityRenderers as Map<string, unknown>).set(id, r),
  }
}

function makeServerHeroState(overrides?: Partial<ServerHeroState>): ServerHeroState {
  return {
    sessionId: 'local-session',
    x: 100,
    y: 200,
    facing: 0,
    hp: 650,
    maxHp: 650,
    heroType: 'BLADE',
    team: 'blue',
    dead: false,
    attackTargetId: '',
    attackCooldown: 0,
    respawnTimer: 0,
    lastProcessedSeq: 0,
    ...overrides,
  }
}

function makeServerTowerState(overrides?: Partial<ServerTowerState>): ServerTowerState {
  return {
    id: 'tower-blue',
    x: 200,
    y: 300,
    hp: 2000,
    maxHp: 2000,
    dead: false,
    team: 'blue',
    radius: 30,
    ...overrides,
  }
}

describe('GameScene', () => {
  describe('init — GameMode receiving', () => {
    it('should fall back to OfflineGameMode when no data is passed', () => {
      const scene = new GameScene()
      scene.init()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((scene as any).gameMode).toBeInstanceOf(OfflineGameMode)
    })

    it('should fall back to OfflineGameMode when data has no gameMode', () => {
      const scene = new GameScene()
      scene.init({})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((scene as any).gameMode).toBeInstanceOf(OfflineGameMode)
    })

    it('should use the provided GameMode', () => {
      const scene = new GameScene()
      const mockMode = createMockGameMode()
      scene.init({ gameMode: mockMode })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((scene as any).gameMode).toBe(mockMode)
    })

    it('should default to OfflineGameMode before init is called', () => {
      const scene = new GameScene()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((scene as any).gameMode).toBeInstanceOf(OfflineGameMode)
    })
  })

  describe('handleServerHeroUpdate — damage flash', () => {
    it('triggers flash when hero HP decreases', () => {
      const { scene, localRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // First update: set initial HP
      call(makeServerHeroState({ hp: 650 }))
      localRenderer.flash.mockClear()

      // Second update: HP decreased
      call(makeServerHeroState({ hp: 600 }))
      expect(localRenderer.flash).toHaveBeenCalledTimes(1)
    })

    it('does not trigger flash when HP stays the same', () => {
      const { scene, localRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      call(makeServerHeroState({ hp: 650 }))
      localRenderer.flash.mockClear()

      call(makeServerHeroState({ hp: 650 }))
      expect(localRenderer.flash).not.toHaveBeenCalled()
    })

    it('does not trigger flash when HP increases', () => {
      const { scene, localRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      call(makeServerHeroState({ hp: 500 }))
      localRenderer.flash.mockClear()

      call(makeServerHeroState({ hp: 600 }))
      expect(localRenderer.flash).not.toHaveBeenCalled()
    })

    it('triggers flash for remote hero HP decrease', () => {
      const { scene, setRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const remoteRenderer = createMockRenderer()

      // First update creates remote entity internally
      call(makeServerHeroState({ sessionId: 'remote-1', team: 'red', hp: 650 }))
      setRenderer('remote-1', remoteRenderer)

      // Second update: HP decreased
      call(makeServerHeroState({ sessionId: 'remote-1', team: 'red', hp: 600 }))
      expect(remoteRenderer.flash).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleServerHeroUpdate — melee swing', () => {
    it('triggers meleeSwing.play when attackCooldown increases (new attack) for melee hero', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // Initial state: attackCooldown = 0
      call(makeServerHeroState({ attackCooldown: 0 }))
      mockMeleeSwing.play.mockClear()

      // Attack fired: attackCooldown jumps to positive
      call(makeServerHeroState({ attackCooldown: 0.8 }))
      expect(mockMeleeSwing.play).toHaveBeenCalledTimes(1)
      expect(mockMeleeSwing.play).toHaveBeenCalledWith(
        expect.objectContaining({ position: expect.any(Object), facing: expect.any(Number) })
      )
    })

    it('triggers meleeSwing on consecutive attacks (cooldown jumps without reaching 0)', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // First attack: 0 → 0.8
      call(makeServerHeroState({ attackCooldown: 0 }))
      call(makeServerHeroState({ attackCooldown: 0.8 }))
      mockMeleeSwing.play.mockClear()

      // Cooldown counting down
      call(makeServerHeroState({ attackCooldown: 0.003 }))
      expect(mockMeleeSwing.play).not.toHaveBeenCalled()

      // Second attack: cooldown expired + new attack in same tick (0.003 → 0.8)
      call(makeServerHeroState({ attackCooldown: 0.8 }))
      expect(mockMeleeSwing.play).toHaveBeenCalledTimes(1)
    })

    it('does not trigger meleeSwing for ranged hero (BOLT)', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // First call creates the entity as BOLT
      call(makeServerHeroState({ heroType: 'BOLT', attackCooldown: 0 }))
      mockMeleeSwing.play.mockClear()

      call(makeServerHeroState({ heroType: 'BOLT', attackCooldown: 1.0 }))
      expect(mockMeleeSwing.play).not.toHaveBeenCalled()
    })

    it('does not trigger meleeSwing on first sync with active cooldown (no previous entity)', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // First sync for a NEW hero (not yet in EntityManager) with attackCooldown already > 0
      // (e.g., server processed an attack before client subscribed)
      call(makeServerHeroState({ sessionId: 'new-hero', team: 'red', attackCooldown: 0.8 }))
      expect(mockMeleeSwing.play).not.toHaveBeenCalled()
    })

    it('does not trigger meleeSwing when attackCooldown decreases', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      call(makeServerHeroState({ attackCooldown: 0.5 }))
      mockMeleeSwing.play.mockClear()

      call(makeServerHeroState({ attackCooldown: 0.3 }))
      expect(mockMeleeSwing.play).not.toHaveBeenCalled()
    })
  })

  describe('handleServerHeroUpdate — death/respawn prediction reset', () => {
    it('clears input buffer and resets predictor on death (false→true)', () => {
      const { scene, inputBuffer, movementPredictor } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const clearSpy = vi.spyOn(inputBuffer, 'clear')
      const setPosSpy = vi.spyOn(movementPredictor, 'setPosition')

      // Alive state
      call(makeServerHeroState({ dead: false }))
      clearSpy.mockClear()
      setPosSpy.mockClear()

      // Death
      call(makeServerHeroState({ dead: true, x: 150, y: 250 }))
      expect(clearSpy).toHaveBeenCalledTimes(1)
      expect(setPosSpy).toHaveBeenCalledWith(150, 250)
    })

    it('resets predictor position on respawn (true→false)', () => {
      const { scene, inputBuffer, movementPredictor } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const clearSpy = vi.spyOn(inputBuffer, 'clear')
      const setPosSpy = vi.spyOn(movementPredictor, 'setPosition')

      // Set dead state
      call(makeServerHeroState({ dead: true, x: 150, y: 250 }))
      clearSpy.mockClear()
      setPosSpy.mockClear()

      // Respawn
      call(makeServerHeroState({ dead: false, x: 100, y: 200 }))
      expect(clearSpy).not.toHaveBeenCalled()
      expect(setPosSpy).toHaveBeenCalledWith(100, 200)
    })

    it('does not reset prediction when dead state unchanged', () => {
      const { scene, inputBuffer, movementPredictor } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const clearSpy = vi.spyOn(inputBuffer, 'clear')
      const setPosSpy = vi.spyOn(movementPredictor, 'setPosition')

      call(makeServerHeroState({ dead: false }))
      clearSpy.mockClear()
      setPosSpy.mockClear()

      // Still alive — no reset
      call(makeServerHeroState({ dead: false }))
      expect(clearSpy).not.toHaveBeenCalled()
    })
  })

  describe('handleServerTowerUpdate — damage flash', () => {
    it('triggers flash when tower HP decreases', () => {
      const { scene, em, setRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerTowerUpdate.bind(scene)

      // Register tower entity
      const tower = createTowerState({
        id: 'tower-blue',
        team: 'blue',
        position: { x: 200, y: 300 },
        definition: DEFAULT_TOWER,
      })
      em.registerEntity(tower)
      const towerRenderer = createMockRenderer()
      setRenderer('tower-blue', towerRenderer)

      // First update: HP unchanged
      call(makeServerTowerState({ hp: 2000 }))
      towerRenderer.flash.mockClear()

      // Second update: HP decreased
      call(makeServerTowerState({ hp: 1800 }))
      expect(towerRenderer.flash).toHaveBeenCalledTimes(1)
    })

    it('does not trigger flash when tower HP stays the same', () => {
      const { scene, em, setRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerTowerUpdate.bind(scene)

      const tower = createTowerState({
        id: 'tower-blue',
        team: 'blue',
        position: { x: 200, y: 300 },
        definition: DEFAULT_TOWER,
      })
      em.registerEntity(tower)
      const towerRenderer = createMockRenderer()
      setRenderer('tower-blue', towerRenderer)

      call(makeServerTowerState({ hp: 2000 }))
      towerRenderer.flash.mockClear()

      call(makeServerTowerState({ hp: 2000 }))
      expect(towerRenderer.flash).not.toHaveBeenCalled()
    })
  })
})
