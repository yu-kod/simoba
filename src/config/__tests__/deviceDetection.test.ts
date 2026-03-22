import {
  detectDevice,
  formatDeviceLabel,
  type DeviceInfo,
  type DeviceType,
} from '@/config/deviceDetection'

/** Phaser.DeviceConf の最小モック */
function createMockDevice(
  overrides: { desktop?: boolean; touch?: boolean } = {},
): Phaser.DeviceConf {
  const { desktop = true, touch = false } = overrides
  return {
    os: { desktop },
    input: { touch },
  } as unknown as Phaser.DeviceConf
}

describe('detectDevice', () => {
  describe('デバイス種別の判定', () => {
    it('desktop=true の場合 type が desktop になる', () => {
      const device = createMockDevice({ desktop: true })
      const info = detectDevice(device)
      expect(info.type).toBe<DeviceType>('desktop')
    })

    it('desktop=false の場合 type が mobile になる', () => {
      const device = createMockDevice({ desktop: false })
      const info = detectDevice(device)
      expect(info.type).toBe<DeviceType>('mobile')
    })
  })

  describe('タッチ対応の判定', () => {
    it('touch=false の場合 isTouchDevice が false になる', () => {
      const device = createMockDevice({ touch: false })
      const info = detectDevice(device)
      expect(info.isTouchDevice).toBe(false)
    })

    it('touch=true の場合 isTouchDevice が true になる', () => {
      const device = createMockDevice({ touch: true })
      const info = detectDevice(device)
      expect(info.isTouchDevice).toBe(true)
    })
  })

  describe('組み合わせシナリオ', () => {
    it('デスクトップ PC: desktop=true, touch=false', () => {
      const device = createMockDevice({ desktop: true, touch: false })
      const info = detectDevice(device)
      expect(info).toEqual<DeviceInfo>({
        type: 'desktop',
        isTouchDevice: false,
      })
    })

    it('モバイル端末: desktop=false, touch=true', () => {
      const device = createMockDevice({ desktop: false, touch: true })
      const info = detectDevice(device)
      expect(info).toEqual<DeviceInfo>({
        type: 'mobile',
        isTouchDevice: true,
      })
    })

    it('タッチ対応 PC: desktop=true, touch=true', () => {
      const device = createMockDevice({ desktop: true, touch: true })
      const info = detectDevice(device)
      expect(info).toEqual<DeviceInfo>({
        type: 'desktop',
        isTouchDevice: true,
      })
    })
  })

  describe('返り値の型', () => {
    it('readonly オブジェクトを返す', () => {
      const device = createMockDevice()
      const info = detectDevice(device)
      expect(info).toHaveProperty('type')
      expect(info).toHaveProperty('isTouchDevice')
      expect(Object.keys(info)).toHaveLength(2)
    })
  })
})

describe('formatDeviceLabel', () => {
  it('Desktop (タッチなし) → "Desktop"', () => {
    expect(formatDeviceLabel({ type: 'desktop', isTouchDevice: false })).toBe('Desktop')
  })

  it('Desktop (タッチあり) → "Desktop (Touch)"', () => {
    expect(formatDeviceLabel({ type: 'desktop', isTouchDevice: true })).toBe('Desktop (Touch)')
  })

  it('Mobile (タッチあり) → "Mobile (Touch)"', () => {
    expect(formatDeviceLabel({ type: 'mobile', isTouchDevice: true })).toBe('Mobile (Touch)')
  })

  it('Mobile (タッチなし) → "Mobile"', () => {
    expect(formatDeviceLabel({ type: 'mobile', isTouchDevice: false })).toBe('Mobile')
  })
})
