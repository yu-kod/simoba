import Phaser from 'phaser'
import type { UiScale } from './uiScale'
import { createText } from './createText'

const COLOR_HP_BG = 0x2c3e50
const COLOR_HP_FILL = 0x27ae60
const COLOR_HP_LOW = 0xe74c3c
const COLOR_HP_BORDER = 0x7f8c8d

const LOW_HP_THRESHOLD = 0.3

export class HudHpBar {
  private readonly container: Phaser.GameObjects.Container
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly hpText: Phaser.GameObjects.Text
  private readonly barWidth: number
  private readonly barHeight: number
  private lastHp = -1
  private lastMaxHp = -1

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: UiScale,
    cameraZoom = 1,
  ) {
    // width/height in world coords — camera zoom scales to canvas
    this.barWidth = width
    this.barHeight = height

    this.container = scene.add.container(x, y)
    this.graphics = scene.add.graphics()
    this.container.add(this.graphics)

    this.hpText = createText(scene, this.barWidth / 2, this.barHeight / 2, '', {
      fontSize: scale.fontSize(12),
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
      align: 'center',
    })
    this.hpText.setOrigin(0.5)
    this.hpText.setResolution(cameraZoom)
    this.container.add(this.hpText)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  update(hp: number, maxHp: number): void {
    if (hp === this.lastHp && maxHp === this.lastMaxHp) return
    this.lastHp = hp
    this.lastMaxHp = maxHp
    this.draw(hp, maxHp)
    this.hpText.setText(`${Math.ceil(hp)} / ${Math.ceil(maxHp)}`)
  }

  destroy(): void {
    this.container.destroy()
  }

  private draw(hp: number, maxHp: number): void {
    this.graphics.clear()

    this.graphics.fillStyle(COLOR_HP_BG, 0.85)
    this.graphics.fillRect(0, 0, this.barWidth, this.barHeight)

    const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0
    if (ratio > 0) {
      const fillColor = ratio <= LOW_HP_THRESHOLD ? COLOR_HP_LOW : COLOR_HP_FILL
      this.graphics.fillStyle(fillColor, 1)
      this.graphics.fillRect(0, 0, this.barWidth * ratio, this.barHeight)
    }

    this.graphics.lineStyle(1, COLOR_HP_BORDER, 0.8)
    this.graphics.strokeRect(0, 0, this.barWidth, this.barHeight)
  }
}
