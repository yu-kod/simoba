vi.mock('phaser', () => ({
  default: {
    AUTO: 0,
    Scale: { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH' },
    Scene: class {}
  }
}))

import { GAME_WIDTH, GAME_HEIGHT, gameConfig } from '@/config/gameConfig'

describe('gameConfig', () => {
  describe('resolution', () => {
    it('should have width of 1280', () => {
      expect(GAME_WIDTH).toBe(1280)
    })

    it('should have height of 720', () => {
      expect(GAME_HEIGHT).toBe(720)
    })

    it('should use GAME_WIDTH and GAME_HEIGHT in config', () => {
      expect(gameConfig.width).toBe(GAME_WIDTH)
      expect(gameConfig.height).toBe(GAME_HEIGHT)
    })
  })

  describe('physics', () => {
    it('should use arcade physics', () => {
      expect(gameConfig.physics?.default).toBe('arcade')
    })

    it('should have zero gravity (top-down)', () => {
      const arcade = gameConfig.physics?.arcade as { gravity: { x: number; y: number } }
      expect(arcade.gravity).toEqual({ x: 0, y: 0 })
    })
  })

  describe('display', () => {
    it('should target game-container element', () => {
      expect(gameConfig.parent).toBe('game-container')
    })

    it('should have dark background color', () => {
      expect(gameConfig.backgroundColor).toBe('#2d3436')
    })
  })
})
