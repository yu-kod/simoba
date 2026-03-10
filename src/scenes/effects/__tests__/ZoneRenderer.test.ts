vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Graphics: class {
        fillStyle = vi.fn().mockReturnThis()
        fillCircle = vi.fn().mockReturnThis()
        lineStyle = vi.fn().mockReturnThis()
        strokeCircle = vi.fn().mockReturnThis()
        clear = vi.fn().mockReturnThis()
        setDepth = vi.fn().mockReturnThis()
        destroy = vi.fn()
      },
    },
    Scene: class {},
  },
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZoneRenderer } from '@/scenes/effects/ZoneRenderer'
import type { ServerZoneState } from '@/network/GameMode'

function createMockScene() {
  const graphics = {
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  }
  return {
    scene: { add: { graphics: vi.fn().mockReturnValue(graphics) } },
    add: { graphics: vi.fn().mockReturnValue(graphics) },
    _graphics: graphics,
  }
}

function createZone(overrides: Partial<ServerZoneState> = {}): ServerZoneState {
  return {
    id: 'zone-1',
    x: 300,
    y: 100,
    radius: 200,
    skillId: 'aura-slow-field',
    team: 'blue',
    ...overrides,
  }
}

describe('ZoneRenderer', () => {
  let mockScene: ReturnType<typeof createMockScene>
  let renderer: ZoneRenderer

  beforeEach(() => {
    mockScene = createMockScene()
    renderer = new ZoneRenderer(mockScene as unknown as Phaser.Scene, 'blue')
  })

  it('should draw nothing when no zones exist', () => {
    renderer.draw()

    expect(mockScene._graphics.clear).toHaveBeenCalled()
    expect(mockScene._graphics.fillCircle).not.toHaveBeenCalled()
  })

  it('should draw a zone after adding it', () => {
    renderer.add(createZone())
    renderer.draw()

    expect(mockScene._graphics.clear).toHaveBeenCalled()
    expect(mockScene._graphics.fillStyle).toHaveBeenCalled()
    expect(mockScene._graphics.fillCircle).toHaveBeenCalledWith(300, 100, 200)
  })

  it('should draw border for zones with borderWidth > 0', () => {
    renderer.add(createZone())
    renderer.draw()

    expect(mockScene._graphics.lineStyle).toHaveBeenCalled()
    expect(mockScene._graphics.strokeCircle).toHaveBeenCalledWith(300, 100, 200)
  })

  it('should stop drawing a zone after removing it', () => {
    renderer.add(createZone({ id: 'zone-1' }))
    renderer.remove('zone-1')
    renderer.draw()

    expect(mockScene._graphics.fillCircle).not.toHaveBeenCalled()
  })

  it('should draw multiple zones', () => {
    renderer.add(createZone({ id: 'zone-1', x: 100, y: 100 }))
    renderer.add(createZone({ id: 'zone-2', x: 500, y: 300, skillId: 'bolt-trap', radius: 80 }))
    renderer.draw()

    expect(mockScene._graphics.fillCircle).toHaveBeenCalledTimes(2)
  })

  it('should use fallback visual for unknown skillId', () => {
    renderer.add(createZone({ skillId: 'unknown-skill' }))
    renderer.draw()

    // Should still draw without crashing
    expect(mockScene._graphics.fillCircle).toHaveBeenCalledWith(300, 100, 200)
  })

  it('should clean up on destroy', () => {
    renderer.add(createZone())
    renderer.destroy()

    expect(mockScene._graphics.destroy).toHaveBeenCalled()
  })

  describe('allyOnly visibility', () => {
    it('should draw allyOnly zone for same team', () => {
      // bolt-trap has allyOnly: true, zone team is blue, localTeam is blue
      renderer.add(createZone({ skillId: 'bolt-trap', team: 'blue', radius: 80 }))
      renderer.draw()

      expect(mockScene._graphics.fillCircle).toHaveBeenCalledWith(300, 100, 80)
    })

    it('should NOT draw allyOnly zone for enemy team', () => {
      // bolt-trap has allyOnly: true, zone team is red, localTeam is blue
      renderer.add(createZone({ skillId: 'bolt-trap', team: 'red', radius: 80 }))
      renderer.draw()

      expect(mockScene._graphics.fillCircle).not.toHaveBeenCalled()
    })

    it('should still draw non-allyOnly zones from enemy team', () => {
      // aura-slow-field has no allyOnly, enemy zone should still be visible
      renderer.add(createZone({ skillId: 'aura-slow-field', team: 'red' }))
      renderer.draw()

      expect(mockScene._graphics.fillCircle).toHaveBeenCalledWith(300, 100, 200)
    })
  })
})
