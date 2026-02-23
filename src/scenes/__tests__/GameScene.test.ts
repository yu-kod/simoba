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
import { OfflineGameMode } from '@/network/OfflineGameMode'
import type { GameMode, ServerHeroState, ServerTowerState } from '@/network/GameMode'
import type { HeroState } from '@/domain/entities/Hero'
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
    onAttackEvent: vi.fn(),
    onDamageEvent: vi.fn(),
    onDeathEvent: vi.fn(),
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

  // Assign private fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = scene as any as Record<string, unknown>
  s.entityManager = em
  s.combatManager = cm
  s.networkBridge = bridge
  s.entityRenderers = new Map()
  s.meleeSwing = mockMeleeSwing
  s.inputBuffer = inputBuffer
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
    radius: 22,
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

  describe('handleServerHeroUpdate — state-diff removal verification', () => {
    it('does NOT trigger flash when hero HP decreases (now event-based)', () => {
      const { scene, localRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      call(makeServerHeroState({ hp: 650 }))
      localRenderer.flash.mockClear()

      // HP decreased — but flash should NOT fire (handled by onDamageEvent instead)
      call(makeServerHeroState({ hp: 600 }))
      expect(localRenderer.flash).not.toHaveBeenCalled()
    })

    it('does NOT trigger meleeSwing when attackCooldown increases (now event-based)', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      call(makeServerHeroState({ attackCooldown: 0 }))
      mockMeleeSwing.play.mockClear()

      // attackCooldown increased — but meleeSwing should NOT fire (handled by onAttackEvent instead)
      call(makeServerHeroState({ attackCooldown: 0.8 }))
      expect(mockMeleeSwing.play).not.toHaveBeenCalled()
    })
  })

  describe('event-based combat effects', () => {
    it('handleDamageEvent triggers flash on the target entity', () => {
      const { scene, localRenderer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleDamageEvent.bind(scene)

      call({ targetId: 'local-session', amount: 50, sourceId: 'enemy-1' })
      expect(localRenderer.flash).toHaveBeenCalledTimes(1)
    })

    it('handleDamageEvent does nothing for unknown target', () => {
      const { scene } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleDamageEvent.bind(scene)

      // Should not throw for non-existent entity
      expect(() => call({ targetId: 'nonexistent', amount: 50, sourceId: 'enemy-1' })).not.toThrow()
    })

    it('handleAttackEvent triggers meleeSwing.play for melee attacks', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleAttackEvent.bind(scene)

      call({
        attackerId: 'local-session',
        targetId: 'enemy-1',
        attackType: 'melee',
        position: { x: 100, y: 200 },
        facing: 1.5,
      })
      expect(mockMeleeSwing.play).toHaveBeenCalledTimes(1)
      expect(mockMeleeSwing.play).toHaveBeenCalledWith({ position: { x: 100, y: 200 }, facing: 1.5 })
    })

    it('handleAttackEvent does NOT trigger meleeSwing for ranged attacks', () => {
      const { scene, mockMeleeSwing } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleAttackEvent.bind(scene)

      call({
        attackerId: 'local-session',
        targetId: 'enemy-1',
        attackType: 'ranged',
        position: { x: 100, y: 200 },
        facing: 1.5,
      })
      expect(mockMeleeSwing.play).not.toHaveBeenCalled()
    })

    it('handleDeathEvent does not throw (placeholder for future visuals)', () => {
      const { scene } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleDeathEvent.bind(scene)

      expect(() => call({
        heroId: 'local-session',
        type: 'death',
        position: { x: 100, y: 200 },
      })).not.toThrow()
    })
  })

  describe('handleServerHeroUpdate — death/respawn input buffer reset', () => {
    it('clears input buffer on death (false→true)', () => {
      const { scene, inputBuffer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const clearSpy = vi.spyOn(inputBuffer, 'clear')

      // Alive state
      call(makeServerHeroState({ dead: false }))
      clearSpy.mockClear()

      // Death
      call(makeServerHeroState({ dead: true, x: 150, y: 250 }))
      expect(clearSpy).toHaveBeenCalledTimes(1)
    })

    it('does not clear input buffer on respawn (true→false)', () => {
      const { scene, inputBuffer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const clearSpy = vi.spyOn(inputBuffer, 'clear')

      // Set dead state
      call(makeServerHeroState({ dead: true, x: 150, y: 250 }))
      clearSpy.mockClear()

      // Respawn
      call(makeServerHeroState({ dead: false, x: 100, y: 200 }))
      expect(clearSpy).not.toHaveBeenCalled()
    })

    it('does not clear input buffer when dead state unchanged', () => {
      const { scene, inputBuffer } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)
      const clearSpy = vi.spyOn(inputBuffer, 'clear')

      call(makeServerHeroState({ dead: false }))
      clearSpy.mockClear()

      // Still alive — no reset
      call(makeServerHeroState({ dead: false }))
      expect(clearSpy).not.toHaveBeenCalled()
    })
  })

  describe('handleServerHeroUpdate — heroType sync', () => {
    it('updates local hero type from server state', () => {
      const { scene, em } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // Initial state: BLADE
      call(makeServerHeroState({ heroType: 'BLADE' }))
      const heroBlade = em.getEntity('local-session') as HeroState
      expect(heroBlade.type).toBe('BLADE')

      // Server sends BOLT
      call(makeServerHeroState({ heroType: 'BOLT' }))
      const heroBolt = em.getEntity('local-session') as HeroState
      expect(heroBolt.type).toBe('BOLT')
    })

    it('updates remote hero type from server state', () => {
      const { scene, em } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      // Create remote hero as BLADE first
      call(makeServerHeroState({ sessionId: 'remote-1', heroType: 'BLADE', team: 'red' }))

      const heroBlade = em.getEntity('remote-1') as HeroState
      expect(heroBlade.type).toBe('BLADE')

      // Server sends AURA for the same remote hero
      call(makeServerHeroState({ sessionId: 'remote-1', heroType: 'AURA', team: 'red' }))
      const heroAura = em.getEntity('remote-1') as HeroState
      expect(heroAura.type).toBe('AURA')
    })

    it('preserves hero type when server sends the same type', () => {
      const { scene, em } = setupSceneForServerUpdate()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = (scene as any).handleServerHeroUpdate.bind(scene)

      call(makeServerHeroState({ heroType: 'AURA' }))
      call(makeServerHeroState({ heroType: 'AURA' }))
      const hero = em.getEntity('local-session') as HeroState
      expect(hero.type).toBe('AURA')
    })
  })

  describe('handleServerTowerUpdate — state-diff removal verification', () => {
    it('does NOT trigger flash when tower HP decreases (now event-based)', () => {
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

      // HP decreased — flash should NOT fire (handled by onDamageEvent instead)
      call(makeServerTowerState({ hp: 1800 }))
      expect(towerRenderer.flash).not.toHaveBeenCalled()
    })
  })
})
