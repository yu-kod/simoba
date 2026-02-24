vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Container: class {
        setPosition = vi.fn().mockReturnThis()
        setVisible = vi.fn().mockReturnThis()
        add = vi.fn()
        destroy = vi.fn()
      },
      Graphics: class {
        fillStyle = vi.fn().mockReturnThis()
        fillCircle = vi.fn().mockReturnThis()
        lineStyle = vi.fn().mockReturnThis()
        strokeCircle = vi.fn().mockReturnThis()
        beginPath = vi.fn().mockReturnThis()
        moveTo = vi.fn().mockReturnThis()
        lineTo = vi.fn().mockReturnThis()
        closePath = vi.fn().mockReturnThis()
        fillPath = vi.fn().mockReturnThis()
        strokePath = vi.fn().mockReturnThis()
        clear = vi.fn().mockReturnThis()
      },
    },
    Scene: class {},
  },
}))

import { describe, it, expect, vi } from 'vitest'
import { MinionRenderer } from '@/scenes/effects/MinionRenderer'
import { createMinionState } from '@shared/entities/Minion'

function createMockScene() {
  return {
    add: {
      container: vi.fn().mockReturnValue({
        setPosition: vi.fn(),
        setVisible: vi.fn(),
        add: vi.fn(),
        destroy: vi.fn(),
      }),
      graphics: vi.fn().mockReturnValue({
        fillStyle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        beginPath: vi.fn().mockReturnThis(),
        moveTo: vi.fn().mockReturnThis(),
        lineTo: vi.fn().mockReturnThis(),
        closePath: vi.fn().mockReturnThis(),
        fillPath: vi.fn().mockReturnThis(),
        strokePath: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
      }),
    },
  } as unknown as Phaser.Scene
}

describe('MinionRenderer', () => {
  it('creates renderer for melee minion', () => {
    const scene = createMockScene()
    const minion = createMinionState({
      id: 'minion-1',
      minionType: 'melee',
      team: 'blue',
      position: { x: 150, y: 360 },
    })
    const renderer = new MinionRenderer(scene, minion, true)
    expect(renderer.gameObject).toBeDefined()
  })

  it('creates renderer for ranged minion', () => {
    const scene = createMockScene()
    const minion = createMinionState({
      id: 'minion-2',
      minionType: 'ranged',
      team: 'red',
      position: { x: 3080, y: 360 },
    })
    const renderer = new MinionRenderer(scene, minion, false)
    expect(renderer.gameObject).toBeDefined()
  })

  it('sync updates position and visibility', () => {
    const scene = createMockScene()
    const minion = createMinionState({
      id: 'minion-1',
      minionType: 'melee',
      team: 'blue',
      position: { x: 150, y: 360 },
    })
    const renderer = new MinionRenderer(scene, minion, true)
    const container = renderer.gameObject

    const updated = { ...minion, position: { x: 200, y: 360 } }
    renderer.sync(updated)
    expect(container.setPosition).toHaveBeenCalledWith(200, 360)
    expect(container.setVisible).toHaveBeenCalledWith(true)
  })

  it('sync hides dead minion', () => {
    const scene = createMockScene()
    const minion = createMinionState({
      id: 'minion-1',
      minionType: 'melee',
      team: 'blue',
      position: { x: 150, y: 360 },
    })
    const renderer = new MinionRenderer(scene, minion, true)
    const container = renderer.gameObject

    const dead = { ...minion, dead: true as const }
    renderer.sync(dead)
    expect(container.setVisible).toHaveBeenCalledWith(false)
  })

  it('destroy destroys container', () => {
    const scene = createMockScene()
    const minion = createMinionState({
      id: 'minion-1',
      minionType: 'melee',
      team: 'blue',
      position: { x: 150, y: 360 },
    })
    const renderer = new MinionRenderer(scene, minion, true)
    renderer.destroy()
    expect(renderer.gameObject.destroy).toHaveBeenCalled()
  })
})
