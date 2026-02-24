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
 * Single melee swing effect instance — draws a forward arc that fades out.
 * Purely visual; damage logic is independent.
 */
class MeleeSwingInstance {
  private readonly graphics: Phaser.GameObjects.Graphics
  private active = false
  private elapsed = 0
  private facing = 0
  private position = { x: 0, y: 0 }

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(10)
    this.graphics.setVisible(false)
  }

  play(params: AttackEffectParams): void {
    this.active = true
    this.elapsed = 0
    this.facing = params.facing
    this.position = { x: params.position.x, y: params.position.y }
    this.graphics.setVisible(true)
    this.draw(1)
  }

  update(delta: number): void {
    if (!this.active) return

    this.elapsed += delta
    if (this.elapsed >= SWING_DURATION_MS) {
      this.active = false
      this.graphics.clear()
      this.graphics.setVisible(false)
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

/**
 * Pool-based melee swing renderer — supports multiple simultaneous effects.
 * Reuses inactive instances to avoid repeated allocation.
 */
export class MeleeSwingRenderer implements AttackEffectRenderer {
  private readonly scene: Phaser.Scene
  private readonly instances: MeleeSwingInstance[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  play(params: AttackEffectParams): void {
    const instance = this.getOrCreateInstance()
    instance.play(params)
  }

  update(delta: number): void {
    for (const instance of this.instances) {
      instance.update(delta)
    }
  }

  isActive(): boolean {
    return this.instances.some((i) => i.isActive())
  }

  destroy(): void {
    for (const instance of this.instances) {
      instance.destroy()
    }
    this.instances.length = 0
  }

  private getOrCreateInstance(): MeleeSwingInstance {
    const idle = this.instances.find((i) => !i.isActive())
    if (idle) return idle

    const instance = new MeleeSwingInstance(this.scene)
    this.instances.push(instance)
    return instance
  }
}
