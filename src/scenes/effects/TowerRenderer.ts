import Phaser from 'phaser'
import type { TowerState } from '@/domain/entities/Tower'
import type { Team } from '@/domain/types'
import { HpBarRenderer } from '@/scenes/ui/HpBarRenderer'

const TOWER_COLORS: Record<Team, number> = {
  blue: 0x3498db,
  red: 0xe74c3c,
  neutral: 0x95a5a6,
}

const BODY_FILL_ALPHA = 0.4
const BODY_STROKE_WIDTH = 3
const INNER_SQUARE_SCALE = 0.5
const INNER_SQUARE_ALPHA = 0.7
const FLASH_DURATION_MS = 100
const FLASH_COLOR = 0xffffff

export class TowerRenderer {
  private readonly container: Phaser.GameObjects.Container
  private readonly bodyGraphics: Phaser.GameObjects.Graphics
  private readonly hpBar: HpBarRenderer
  private readonly radius: number
  private readonly team: Team
  private flashTimer = 0
  private isFlashing = false

  constructor(scene: Phaser.Scene, tower: TowerState, isAlly: boolean) {
    this.radius = tower.radius
    this.team = tower.team
    const color = TOWER_COLORS[tower.team]

    this.container = scene.add.container(tower.position.x, tower.position.y)

    this.bodyGraphics = scene.add.graphics()
    this.drawBody(color)
    this.container.add(this.bodyGraphics)

    this.hpBar = new HpBarRenderer(scene, this.radius, tower.maxHp, isAlly)
    this.container.add(this.hpBar.gameObject)

    this.sync(tower)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  sync(tower: TowerState): void {
    this.container.setVisible(!tower.dead)
    this.hpBar.sync(tower.hp, tower.maxHp)
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
      this.drawBody(TOWER_COLORS[this.team])
    }
  }

  destroy(): void {
    this.container.destroy()
  }

  private drawBody(color: number): void {
    const r = this.radius

    // Outer circle
    this.bodyGraphics.fillStyle(color, BODY_FILL_ALPHA)
    this.bodyGraphics.fillCircle(0, 0, r)
    this.bodyGraphics.lineStyle(BODY_STROKE_WIDTH, color, 1)
    this.bodyGraphics.strokeCircle(0, 0, r)

    // Inner square (tower-specific indicator)
    const s = r * INNER_SQUARE_SCALE
    this.bodyGraphics.fillStyle(color, INNER_SQUARE_ALPHA)
    this.bodyGraphics.fillRect(-s, -s, s * 2, s * 2)
  }
}
