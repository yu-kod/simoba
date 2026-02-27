import { describe, it, expect } from 'vitest'
import { createUiScale } from '../uiScale'

describe('createUiScale', () => {
  it('should halve sizes at zoom 2.0', () => {
    const scale = createUiScale(2.0)
    expect(scale.size(64)).toBe(32)
    expect(scale.size(24)).toBe(12)
  })

  it('should return unscaled sizes at zoom 1.0', () => {
    const scale = createUiScale(1.0)
    expect(scale.size(64)).toBe(64)
    expect(scale.size(24)).toBe(24)
  })

  it('should format fontSize as CSS px string', () => {
    const scale = createUiScale(2.0)
    expect(scale.fontSize(24)).toBe('12px')
    expect(scale.fontSize(48)).toBe('24px')
  })

  it('should format fontSize without scaling at zoom 1.0', () => {
    const scale = createUiScale(1.0)
    expect(scale.fontSize(24)).toBe('24px')
  })

  it('should expose the zoom value', () => {
    const scale = createUiScale(2.0)
    expect(scale.zoom).toBe(2.0)
  })
})
