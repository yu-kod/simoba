import { describe, it, expect } from 'vitest'
import {
  ZONE_VISUALS,
  DEFAULT_ZONE_VISUAL,
  getZoneVisual,
} from './zoneVisuals'

describe('ZONE_VISUALS registry', () => {
  it('should have an entry for aura-slow-field', () => {
    const visual = ZONE_VISUALS['aura-slow-field']
    expect(visual).toBeDefined()
    expect(visual.color).toBe(0x9b59b6)
    expect(visual.alpha).toBeGreaterThan(0)
    expect(visual.alpha).toBeLessThanOrEqual(1)
    expect(visual.borderWidth).toBeGreaterThan(0)
  })

  it('should have an entry for bolt-trap with allyOnly', () => {
    const visual = ZONE_VISUALS['bolt-trap']
    expect(visual).toBeDefined()
    expect(visual.color).toBe(0xf1c40f)
    expect(visual.alpha).toBeGreaterThan(0)
    expect(visual.alpha).toBeLessThanOrEqual(1)
    expect(visual.allyOnly).toBe(true)
  })

  it('should not have allyOnly on aura-slow-field', () => {
    const visual = ZONE_VISUALS['aura-slow-field']
    expect(visual.allyOnly).toBeUndefined()
  })

  it('should have valid alpha values for all entries', () => {
    for (const [skillId, visual] of Object.entries(ZONE_VISUALS)) {
      expect(visual.alpha, `${skillId} alpha`).toBeGreaterThanOrEqual(0)
      expect(visual.alpha, `${skillId} alpha`).toBeLessThanOrEqual(1)
      expect(visual.borderAlpha, `${skillId} borderAlpha`).toBeGreaterThanOrEqual(0)
      expect(visual.borderAlpha, `${skillId} borderAlpha`).toBeLessThanOrEqual(1)
    }
  })
})

describe('DEFAULT_ZONE_VISUAL', () => {
  it('should have a gray color', () => {
    expect(DEFAULT_ZONE_VISUAL.color).toBe(0x95a5a6)
  })

  it('should have valid alpha values', () => {
    expect(DEFAULT_ZONE_VISUAL.alpha).toBeGreaterThan(0)
    expect(DEFAULT_ZONE_VISUAL.alpha).toBeLessThanOrEqual(1)
  })
})

describe('getZoneVisual', () => {
  it('should return registered visual for known skillId', () => {
    const visual = getZoneVisual('aura-slow-field')
    expect(visual).toBe(ZONE_VISUALS['aura-slow-field'])
  })

  it('should return DEFAULT_ZONE_VISUAL for unknown skillId', () => {
    const visual = getZoneVisual('unknown-skill-xyz')
    expect(visual).toBe(DEFAULT_ZONE_VISUAL)
  })

  it('should return DEFAULT_ZONE_VISUAL for empty string', () => {
    const visual = getZoneVisual('')
    expect(visual).toBe(DEFAULT_ZONE_VISUAL)
  })
})
