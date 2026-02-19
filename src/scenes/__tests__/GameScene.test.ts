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
import { OfflineGameMode } from '@/network/OfflineGameMode'
import type { GameMode } from '@/network/GameMode'

function createMockGameMode(): GameMode {
  return {
    onSceneCreate: vi.fn().mockResolvedValue(undefined),
    sendLocalState: vi.fn(),
    sendDamageEvent: vi.fn(),
    sendProjectileSpawn: vi.fn(),
    onRemotePlayerUpdate: vi.fn(),
    onRemotePlayerJoin: vi.fn(),
    onRemotePlayerLeave: vi.fn(),
    onRemoteDamage: vi.fn(),
    onRemoteProjectileSpawn: vi.fn(),
    dispose: vi.fn(),
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
})
