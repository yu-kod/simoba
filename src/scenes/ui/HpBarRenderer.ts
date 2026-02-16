import Phaser from 'phaser'
import { computeHpBar } from '@/domain/ui/computeHpBar'
import {
  createTrailState,
  updateTrail,
  onDamage,
  isTrailActive,
  type TrailState,
} from '@/domain/ui/trailState'

const BAR_HEIGHT = 6
const BAR_Y_OFFSET = 10
const BORDER_WIDTH = 1

const COLOR_ALLY = 0x2ecc71
const COLOR_ENEMY = 0xe74c3c
const COLOR_BACKGROUND = 0x333333
const COLOR_TRAIL = 0xffffff
const COLOR_BORDER = 0x000000
const COLOR_TICK = 0x000000

const BACKGROUND_ALPHA = 0.8
const HP_BAR_ALPHA = 1
const TRAIL_ALPHA = 0.8
const TICK_LINE_WIDTH = 1

export class HpBarRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly barWidth: number
  private readonly barColor: number
  private readonly yOffset: number

  private trailState: TrailState
  private lastHp: number
  private currentHp: number
  private currentMaxHp: number
  constructor(
    scene: Phaser.Scene,
    radius: number,
    maxHp: number,
    isAlly: boolean
  ) {
    this.graphics = scene.add.graphics()
    this.barWidth = radius * 2
    this.barColor = isAlly ? COLOR_ALLY : COLOR_ENEMY
    this.yOffset = -(radius + BAR_Y_OFFSET)

    this.trailState = createTrailState(maxHp)
    this.lastHp = maxHp
    this.currentHp = maxHp
    this.currentMaxHp = maxHp
  }

  get gameObject(): Phaser.GameObjects.Graphics {
    return this.graphics
  }

  sync(hp: number, maxHp: number): void {
    // Detect damage
    if (hp < this.lastHp) {
      this.trailState = onDamage(this.trailState, this.lastHp)
    }

    this.lastHp = hp
    this.currentHp = hp
    this.currentMaxHp = maxHp
  }

  update(delta: number): void {
    const deltaSeconds = delta / 1000
    this.trailState = updateTrail(
      this.trailState,
      this.currentHp,
      deltaSeconds
    )

    this.draw()
  }

  syncPosition(x: number, y: number): void {
    this.graphics.setPosition(x, y)
  }

  destroy(): void {
    this.graphics.destroy()
  }

  private draw(): void {
    this.graphics.clear()

    const barX = -this.barWidth / 2
    const barY = this.yOffset

    const layout = computeHpBar(
      this.currentHp,
      this.currentMaxHp,
      this.barWidth
    )

    // Background
    this.graphics.fillStyle(COLOR_BACKGROUND, BACKGROUND_ALPHA)
    this.graphics.fillRect(barX, barY, this.barWidth, BAR_HEIGHT)

    // Trail bar (white, behind HP bar)
    if (isTrailActive(this.trailState, this.currentHp)) {
      const trailLayout = computeHpBar(
        this.trailState.trailHp,
        this.currentMaxHp,
        this.barWidth
      )
      this.graphics.fillStyle(COLOR_TRAIL, TRAIL_ALPHA)
      this.graphics.fillRect(
        barX + layout.currentHpWidth,
        barY,
        trailLayout.currentHpWidth - layout.currentHpWidth,
        BAR_HEIGHT
      )
    }

    // Current HP bar
    if (layout.currentHpWidth > 0) {
      this.graphics.fillStyle(this.barColor, HP_BAR_ALPHA)
      this.graphics.fillRect(barX, barY, layout.currentHpWidth, BAR_HEIGHT)
    }

    // Tick marks (250HP divisions)
    if (layout.tickPositions.length > 0) {
      this.graphics.lineStyle(TICK_LINE_WIDTH, COLOR_TICK, 1)
      for (const tickX of layout.tickPositions) {
        this.graphics.beginPath()
        this.graphics.moveTo(barX + tickX, barY)
        this.graphics.lineTo(barX + tickX, barY + BAR_HEIGHT)
        this.graphics.strokePath()
      }
    }

    // Border
    this.graphics.lineStyle(BORDER_WIDTH, COLOR_BORDER, 1)
    this.graphics.strokeRect(barX, barY, this.barWidth, BAR_HEIGHT)
  }
}
