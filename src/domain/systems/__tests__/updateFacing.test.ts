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
})
