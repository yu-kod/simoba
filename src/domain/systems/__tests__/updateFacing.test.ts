import { updateFacing } from '@/domain/systems/updateFacing'

describe('updateFacing', () => {
  it('should face right when moving right', () => {
    const facing = updateFacing(0, { x: 1, y: 0 })
    expect(facing).toBe(0)
  })

  it('should face down when moving down', () => {
    const facing = updateFacing(0, { x: 0, y: 1 })
    expect(facing).toBeCloseTo(Math.PI / 2)
  })

  it('should face left when moving left', () => {
    const facing = updateFacing(0, { x: -1, y: 0 })
    expect(facing).toBeCloseTo(Math.PI)
  })

  it('should face up when moving up', () => {
    const facing = updateFacing(0, { x: 0, y: -1 })
    expect(facing).toBeCloseTo(-Math.PI / 2)
  })

  it('should face down-right on diagonal movement', () => {
    const facing = updateFacing(0, { x: 1, y: 1 })
    expect(facing).toBeCloseTo(Math.atan2(1, 1))
  })

  it('should keep current facing when not moving', () => {
    const currentFacing = 1.57
    const facing = updateFacing(currentFacing, { x: 0, y: 0 })
    expect(facing).toBe(currentFacing)
  })

  it('should keep current facing when movement is exactly zero', () => {
    const currentFacing = -0.5
    const facing = updateFacing(currentFacing, { x: 0, y: 0 })
    expect(facing).toBe(currentFacing)
  })

  describe('attack target priority', () => {
    it('should face attack target when attacking (target to the right)', () => {
      const facing = updateFacing(
        1.57, // currently facing up
        { x: 0, y: 0 }, // not moving
        { x: 200, y: 100 }, // target position
        { x: 100, y: 100 } // hero position
      )
      expect(facing).toBe(0) // right = 0 radians
    })

    it('should face attack target even when moving in different direction', () => {
      const facing = updateFacing(
        0,
        { x: 0, y: -1 }, // moving up
        { x: 200, y: 100 }, // target to the right
        { x: 100, y: 100 }
      )
      expect(facing).toBe(0) // target direction wins over movement
    })

    it('should fall back to movement direction when no target', () => {
      const facing = updateFacing(
        0,
        { x: 1, y: 0 }, // moving right
        null,
        { x: 100, y: 100 }
      )
      expect(facing).toBe(0)
    })

    it('should fall back to movement direction when target is undefined', () => {
      const facing = updateFacing(
        0,
        { x: 0, y: 1 } // moving down
      )
      expect(facing).toBeCloseTo(Math.PI / 2)
    })

    it('should maintain current facing when no target and not moving', () => {
      const facing = updateFacing(
        1.57,
        { x: 0, y: 0 },
        null,
        { x: 100, y: 100 }
      )
      expect(facing).toBe(1.57)
    })

    it('should compute correct angle for diagonal target', () => {
      const facing = updateFacing(
        0,
        { x: 0, y: 0 },
        { x: 200, y: 200 }, // target to bottom-right
        { x: 100, y: 100 }
      )
      expect(facing).toBeCloseTo(Math.atan2(100, 100)) // ~0.785 rad
    })
  })
})
