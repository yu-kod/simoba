import Phaser from 'phaser'
import type {
  AttackEffectRenderer,
  AttackEffectParams,
} from '@/scenes/effects/AttackEffectRenderer'

const SWING_ARC = Math.PI / 2 // 90 degree arc
const SWING_RADIUS = 40
const SWING_DURATION_MS = 150
const SWING_COLOR = 0xffffff
const SWING_LINE_WIDTH = 3

/**
 * Melee swing effect — draws a forward arc that fades out over SWING_DURATION_MS.
 * Purely visual; damage logic is independent.
 */
export class MeleeSwingRenderer implements AttackEffectRenderer {
  private readonly graphics: Phaser.GameObjects.Graphics
  private active = false
  private elapsed = 0
  private facing = 0
  private position = { x: 0, y: 0 }

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(10)
  }

  play(params: AttackEffectParams): void {
    this.active = true
    this.elapsed = 0
    this.facing = params.facing
    this.position = { x: params.position.x, y: params.position.y }
    this.draw(1)
  }

  update(delta: number): void {
    if (!this.active) return

    this.elapsed += delta
    if (this.elapsed >= SWING_DURATION_MS) {
      this.active = false
      this.graphics.clear()
      return
    }

    const alpha = 1 - this.elapsed / SWING_DURATION_MS
    this.draw(alpha)
  }

  isActive(): boolean {
    return this.active
  }

  destroy(): void {
    this.graphics.destroy()
  }

  private draw(alpha: number): void {
    this.graphics.clear()
    this.graphics.lineStyle(SWING_LINE_WIDTH, SWING_COLOR, alpha)

    const startAngle = this.facing - SWING_ARC / 2
    const endAngle = this.facing + SWING_ARC / 2

    this.graphics.beginPath()
    this.graphics.arc(
      this.position.x,
      this.position.y,
      SWING_RADIUS,
      startAngle,
      endAngle,
      false
    )
    this.graphics.strokePath()
  }
}
