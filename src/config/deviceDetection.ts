import Phaser from 'phaser'

export type DeviceType = 'desktop' | 'mobile'

export interface DeviceInfo {
  readonly type: DeviceType
  readonly isTouchDevice: boolean
}

export function detectDevice(device: Phaser.DeviceConf): DeviceInfo {
  return {
    type: device.os.desktop ? 'desktop' : 'mobile',
    isTouchDevice: device.input.touch,
  }
}

export function formatDeviceLabel(info: DeviceInfo): string {
  const base = info.type === 'desktop' ? 'Desktop' : 'Mobile'
  return info.isTouchDevice ? `${base} (Touch)` : base
}
