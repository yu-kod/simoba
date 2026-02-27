import Phaser from 'phaser'
import type { UiScale } from './uiScale'
import { createText } from './createText'
import { MAX_LEVEL } from '@shared/constants'

const COLOR_BADGE_BG = 0x2c3e50
const COLOR_BADGE_FILL = 0xf39c12
const COLOR_BADGE_BORDER = 0xe67e22

/** XP thresholds per level (cumulative). Level 1->2 needs 100, 2->3 needs 200, etc. */
const XP_THRESHOLDS = [0, 100, 300, 600, 1000]

/** Start angle: 12 o'clock position */
const START_ANGLE = -Math.PI / 2

export class LevelBadge {
  private readonly container: Phaser.GameObjects.Container
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly levelText: Phaser.GameObjects.Text
  private readonly badgeRadius: number
  private lastLevel = -1
  private lastXp = -1

  constructor(
    scene: Phaser.Scene,
    cx: number,
    cy: number,
    badgeSize: number,
    scale: UiScale
  ) {
    this.badgeRadius = badgeSize / 2

    this.container = scene.add.container(cx, cy)
    this.graphics = scene.add.graphics()
    this.container.add(this.graphics)

    this.levelText = createText(scene, 0, 0, '1', {
      fontSize: scale.fontSize(22),
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    })
    this.levelText.setOrigin(0.5)
    this.container.add(this.levelText)

    this.draw(0)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  update(level: number, xp: number): void {
    if (level === this.lastLevel && xp === this.lastXp) return
    this.lastLevel = level
    this.lastXp = xp
    this.levelText.setText(level.toString())
    this.draw(computeXpRatio(xp, level))
  }

  destroy(): void {
    this.container.destroy()
  }

  private draw(xpRatio: number): void {
    this.graphics.clear()
    const r = this.badgeRadius

    // Dark background circle (unfilled XP portion)
    this.graphics.fillStyle(COLOR_BADGE_BG, 1)
    this.graphics.fillCircle(0, 0, r)

    // XP progress pie (clockwise from 12 o'clock)
    if (xpRatio > 0) {
      const endAngle = START_ANGLE + Math.PI * 2 * xpRatio
      this.graphics.fillStyle(COLOR_BADGE_FILL, 1)
      this.graphics.beginPath()
      this.graphics.moveTo(0, 0)
      this.graphics.arc(0, 0, r, START_ANGLE, endAngle, false)
      this.graphics.closePath()
      this.graphics.fillPath()
    }

    // Border
    this.graphics.lineStyle(2, COLOR_BADGE_BORDER, 1)
    this.graphics.strokeCircle(0, 0, r)
  }
}

function computeXpRatio(xp: number, level: number): number {
  if (level >= MAX_LEVEL) return 1

  const currentThreshold = XP_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = XP_THRESHOLDS[level] ?? currentThreshold + 100
  const needed = nextThreshold - currentThreshold

  if (needed <= 0) return 1
  const progress = xp - currentThreshold
  return Math.max(0, Math.min(1, progress / needed))
}
