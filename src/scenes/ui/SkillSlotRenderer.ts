import Phaser from 'phaser'
import type { SkillSlotConfig } from '@/domain/ui/skillSlotConfig'
import type { UiScale } from './uiScale'
import { createText } from './createText'

const COLOR_ACTIVE_BG = 0x2c3e50
const COLOR_PASSIVE_BG = 0x34495e
const COLOR_EMPTY_BG = 0x1a1a2e
const COLOR_BORDER = 0x7f8c8d
const COLOR_COOLDOWN_OVERLAY = 0x000000
const COLOR_ICON_ACTIVE = 0xe67e22
const COLOR_ICON_PASSIVE = 0x9b59b6

const COOLDOWN_OVERLAY_ALPHA = 0.6
const BORDER_WIDTH = 1

export class SkillSlotRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly container: Phaser.GameObjects.Container
  private readonly keyLabel: Phaser.GameObjects.Text | null
  private readonly cooldownText: Phaser.GameObjects.Text | null
  private readonly config: SkillSlotConfig
  private readonly slotSize: number

  constructor(
    scene: Phaser.Scene,
    config: SkillSlotConfig,
    x: number,
    y: number,
    size: number,
    scale: UiScale
  ) {
    this.config = config
    // size is in world coords — camera zoom scales it to canvas
    this.slotSize = size

    this.container = scene.add.container(x, y)
    this.graphics = scene.add.graphics()
    this.container.add(this.graphics)

    // Key label for active slots
    if (config.type === 'active' && config.key) {
      this.keyLabel = createText(scene, size - 2, 1, config.key, {
        fontSize: scale.fontSize(14),
        color: '#bdc3c7',
        fontStyle: 'bold',
        align: 'right',
      })
      this.keyLabel.setOrigin(1, 0)
      this.container.add(this.keyLabel)
    } else {
      this.keyLabel = null
    }

    // Cooldown text for active slots
    if (config.type === 'active') {
      this.cooldownText = createText(
        scene,
        size / 2,
        size / 2,
        '',
        {
          fontSize: scale.fontSize(22),
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center',
        }
      )
      this.cooldownText.setOrigin(0.5)
      this.cooldownText.setVisible(false)
      this.container.add(this.cooldownText)
    } else {
      this.cooldownText = null
    }

    this.drawSlot(0)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  update(remainingCd: number, _scale: UiScale): void {
    this.drawSlot(remainingCd)

    if (this.cooldownText && this.config.type === 'active') {
      if (remainingCd > 0) {
        this.cooldownText.setText(Math.ceil(remainingCd).toString())
        this.cooldownText.setVisible(true)
      } else {
        this.cooldownText.setVisible(false)
      }
    }
  }

  destroy(): void {
    this.container.destroy()
  }

  private drawSlot(remainingCd: number): void {
    this.graphics.clear()

    const s = this.slotSize
    const bgColor = this.getBackgroundColor()

    this.graphics.fillStyle(bgColor, 0.85)
    this.graphics.fillRect(0, 0, s, s)

    if (this.config.type === 'active') {
      this.drawActiveIcon()
    } else if (this.config.type === 'passive') {
      this.drawPassiveIcon()
    }

    if (this.config.type === 'active' && remainingCd > 0) {
      this.graphics.fillStyle(COLOR_COOLDOWN_OVERLAY, COOLDOWN_OVERLAY_ALPHA)
      this.graphics.fillRect(0, 0, s, s)
    }

    this.graphics.lineStyle(BORDER_WIDTH, COLOR_BORDER, 0.8)
    this.graphics.strokeRect(0, 0, s, s)
  }

  private getBackgroundColor(): number {
    switch (this.config.type) {
      case 'active': return COLOR_ACTIVE_BG
      case 'passive': return COLOR_PASSIVE_BG
      case 'empty': return COLOR_EMPTY_BG
    }
  }

  private drawActiveIcon(): void {
    const cx = this.slotSize / 2
    const cy = this.slotSize / 2
    const r = 14

    this.graphics.fillStyle(COLOR_ICON_ACTIVE, 0.9)
    this.graphics.beginPath()
    this.graphics.moveTo(cx, cy - r)
    this.graphics.lineTo(cx + r, cy)
    this.graphics.lineTo(cx, cy + r)
    this.graphics.lineTo(cx - r, cy)
    this.graphics.closePath()
    this.graphics.fillPath()
  }

  private drawPassiveIcon(): void {
    const cx = this.slotSize / 2
    const cy = this.slotSize / 2
    const r = 12

    this.graphics.fillStyle(COLOR_ICON_PASSIVE, 0.9)
    this.graphics.fillCircle(cx, cy, r)
  }
}
