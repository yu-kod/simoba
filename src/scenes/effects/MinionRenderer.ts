import Phaser from 'phaser'
import type { MinionState } from '@shared/entities/Minion'
import { HpBarRenderer } from '@/scenes/ui/HpBarRenderer'
import { TEAM_COLORS, FLASH_DURATION_MS, FLASH_COLOR } from './entityColors'

const BODY_FILL_ALPHA = 0.6
const BODY_STROKE_WIDTH = 2

export class MinionRenderer {
  private readonly container: Phaser.GameObjects.Container
  private readonly bodyGraphics: Phaser.GameObjects.Graphics
  private readonly hpBar: HpBarRenderer
  private readonly radius: number
  private readonly team: Team
  private readonly minionType: 'melee' | 'ranged'
  private flashTimer = 0
  private isFlashing = false

  constructor(scene: Phaser.Scene, minion: MinionState, isAlly: boolean) {
    this.radius = minion.radius
    this.team = minion.team
    this.minionType = minion.minionType
    const color = TEAM_COLORS[minion.team]

    this.container = scene.add.container(minion.position.x, minion.position.y)

    this.bodyGraphics = scene.add.graphics()
    this.drawBody(color)
    this.container.add(this.bodyGraphics)

    this.hpBar = new HpBarRenderer(scene, this.radius, minion.maxHp, isAlly)
    this.container.add(this.hpBar.gameObject)

    this.sync(minion)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  sync(minion: MinionState): void {
    this.container.setPosition(minion.position.x, minion.position.y)
    this.container.setVisible(!minion.dead)
    this.hpBar.sync(minion.hp, minion.maxHp)
  }

  flash(): void {
    this.isFlashing = true
    this.flashTimer = 0
    this.bodyGraphics.clear()
    this.drawBody(FLASH_COLOR)
  }

  update(delta: number): void {
    this.hpBar.update(delta)

    if (!this.isFlashing) return

    this.flashTimer += delta
    if (this.flashTimer >= FLASH_DURATION_MS) {
      this.isFlashing = false
      this.bodyGraphics.clear()
      this.drawBody(TEAM_COLORS[this.team])
    }
  }

  destroy(): void {
    this.container.destroy()
  }

  private drawBody(color: number): void {
    const r = this.radius

    if (this.minionType === 'melee') {
      this.bodyGraphics.fillStyle(color, BODY_FILL_ALPHA)
      this.bodyGraphics.fillCircle(0, 0, r)
      this.bodyGraphics.lineStyle(BODY_STROKE_WIDTH, color, 1)
      this.bodyGraphics.strokeCircle(0, 0, r)
    } else {
      // Diamond shape for ranged minions
      this.bodyGraphics.fillStyle(color, BODY_FILL_ALPHA)
      this.bodyGraphics.beginPath()
      this.bodyGraphics.moveTo(0, -r)
      this.bodyGraphics.lineTo(r, 0)
      this.bodyGraphics.lineTo(0, r)
      this.bodyGraphics.lineTo(-r, 0)
      this.bodyGraphics.closePath()
      this.bodyGraphics.fillPath()
      this.bodyGraphics.lineStyle(BODY_STROKE_WIDTH, color, 1)
      this.bodyGraphics.strokePath()
    }
  }
}
