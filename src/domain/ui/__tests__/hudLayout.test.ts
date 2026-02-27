import { describe, it, expect } from 'vitest'
import { computeHudLayout } from '../hudLayout'

describe('computeHudLayout', () => {
  const SCREEN_W = 1280
  const SCREEN_H = 720

  it('should produce correct number of slot layouts', () => {
    const layout = computeHudLayout(SCREEN_W, SCREEN_H, 3)
    expect(layout.slots).toHaveLength(3)
  })

  it('should center the panel horizontally', () => {
    const layout = computeHudLayout(SCREEN_W, SCREEN_H, 3)
    const panelCenter = layout.panelX + layout.panelWidth / 2
    expect(panelCenter).toBeCloseTo(SCREEN_W / 2, 5)
  })

  it('should place panel near the bottom of the screen', () => {
    const layout = computeHudLayout(SCREEN_W, SCREEN_H, 3)
    const panelBottom = layout.panelY + layout.panelHeight
    expect(panelBottom).toBeLessThan(SCREEN_H)
    expect(panelBottom).toBeGreaterThan(SCREEN_H - 120)
  })

  it('should increase panel width with more slots', () => {
    const layout3 = computeHudLayout(SCREEN_W, SCREEN_H, 3)
    const layout5 = computeHudLayout(SCREEN_W, SCREEN_H, 5)
    expect(layout5.panelWidth).toBeGreaterThan(layout3.panelWidth)
  })

  it('should space slots evenly with gap', () => {
    const layout = computeHudLayout(SCREEN_W, SCREEN_H, 3)
    const gap01 = layout.slots[1].x - layout.slots[0].x
    const gap12 = layout.slots[2].x - layout.slots[1].x
    expect(gap01).toBeCloseTo(gap12, 5)
  })

  it('should position HP bar below skill row', () => {
    const layout = computeHudLayout(SCREEN_W, SCREEN_H, 3)
    const slotBottom = layout.slots[0].y + layout.slots[0].size
    expect(layout.hpBarY).toBeGreaterThan(slotBottom)
  })

  it('should handle single slot', () => {
    const layout = computeHudLayout(SCREEN_W, SCREEN_H, 1)
    expect(layout.slots).toHaveLength(1)
    expect(layout.panelWidth).toBeGreaterThan(0)
  })
})
