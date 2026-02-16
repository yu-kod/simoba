import Phaser from 'phaser'
import type { HeroState } from '@/domain/entities/Hero'
import { HERO_DEFINITIONS } from '@/domain/entities/heroDefinitions'
import type { HeroType } from '@/domain/types'
import { HpBarRenderer } from '@/scenes/ui/HpBarRenderer'

/** Type-specific body colors (not team colors — team is shown via HP bar) */
const HERO_COLORS: Record<HeroType, number> = {
  BLADE: 0xe74c3c, // red — aggressive melee fighter
  BOLT: 0x3498db, // blue — precise ranged attacker
  AURA: 0x2ecc71, // green — supportive healer
}

const FACING_INDICATOR_SIZE = 6
const FACING_INDICATOR_OFFSET = 1.3 // multiplier of radius
const BODY_FILL_ALPHA = 0.3
const BODY_STROKE_WIDTH = 2
const TYPE_INDICATOR_ALPHA = 0.8
const TYPE_INDICATOR_SCALE = 0.6
const DIAMOND_ASPECT_RATIO = 0.6
const FLASH_DURATION_MS = 100
const FLASH_COLOR = 0xffffff

export class HeroRenderer {
  private readonly container: Phaser.GameObjects.Container
  private readonly bodyGraphics: Phaser.GameObjects.Graphics
  private readonly indicatorGraphics: Phaser.GameObjects.Graphics
  private readonly hpBar: HpBarRenderer
  private readonly radius: number
  private readonly heroType: HeroType
  private flashTimer = 0
  private isFlashing = false

  constructor(scene: Phaser.Scene, heroState: HeroState, isAlly: boolean) {
    const definition = HERO_DEFINITIONS[heroState.type]
    this.radius = definition.radius
    this.heroType = heroState.type
    const color = HERO_COLORS[heroState.type]

    this.container = scene.add.container(
      heroState.position.x,
      heroState.position.y
    )

    // Body: circle base + type indicator shape
    this.bodyGraphics = scene.add.graphics()
    this.drawBody(heroState.type, color)
    this.container.add(this.bodyGraphics)

    // Facing indicator: small triangle showing direction
    this.indicatorGraphics = scene.add.graphics()
    this.drawFacingIndicator(color)
    this.container.add(this.indicatorGraphics)

    // HP bar (positioned relative to container)
    this.hpBar = new HpBarRenderer(scene, this.radius, heroState.maxHp, isAlly)
    this.container.add(this.hpBar.gameObject)

    this.sync(heroState)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  sync(heroState: HeroState): void {
    this.container.setPosition(heroState.position.x, heroState.position.y)

    // Rotate facing indicator around the hero
    const offset = this.radius * FACING_INDICATOR_OFFSET
    this.indicatorGraphics.setPosition(
      Math.cos(heroState.facing) * offset,
      Math.sin(heroState.facing) * offset
    )
    this.indicatorGraphics.setRotation(heroState.facing)

    // Update HP bar
    this.hpBar.sync(heroState.hp, heroState.maxHp)
  }

  /** Trigger a white flash on hit */
  flash(): void {
    this.isFlashing = true
    this.flashTimer = 0
    this.bodyGraphics.clear()
    this.drawBody(this.heroType, FLASH_COLOR)
  }

  /** Update time-based effects (hit flash fade, HP bar trail) */
  update(delta: number): void {
    this.hpBar.update(delta)

    if (!this.isFlashing) return

    this.flashTimer += delta
    if (this.flashTimer >= FLASH_DURATION_MS) {
      this.isFlashing = false
      this.bodyGraphics.clear()
      this.drawBody(this.heroType, HERO_COLORS[this.heroType])
    }
  }

  destroy(): void {
    this.container.destroy()
  }

  private drawBody(type: HeroType, color: number): void {
    const r = this.radius

    // Circle base (all types)
    this.bodyGraphics.fillStyle(color, BODY_FILL_ALPHA)
    this.bodyGraphics.fillCircle(0, 0, r)
    this.bodyGraphics.lineStyle(BODY_STROKE_WIDTH, color, 1)
    this.bodyGraphics.strokeCircle(0, 0, r)

    // Type-specific indicator shape overlay
    const indicatorSize = r * TYPE_INDICATOR_SCALE
    this.bodyGraphics.fillStyle(color, TYPE_INDICATOR_ALPHA)
    switch (type) {
      case 'BLADE':
        this.drawTriangle(indicatorSize)
        break
      case 'BOLT':
        this.drawDiamond(indicatorSize)
        break
      case 'AURA':
        this.drawHexagon(indicatorSize)
        break
      default: {
        const _exhaustive: never = type
        throw new Error(`Unknown hero type: ${_exhaustive}`)
      }
    }
  }

  /** Equilateral triangle centered at origin */
  private drawTriangle(size: number): void {
    const h = size * Math.sqrt(3) / 2
    this.bodyGraphics.fillTriangle(
      0, -h * 2 / 3,
      -size / 2, h / 3,
      size / 2, h / 3
    )
  }

  /** Diamond (rotated square) centered at origin */
  private drawDiamond(size: number): void {
    this.bodyGraphics.beginPath()
    this.bodyGraphics.moveTo(0, -size)
    this.bodyGraphics.lineTo(size * DIAMOND_ASPECT_RATIO, 0)
    this.bodyGraphics.lineTo(0, size)
    this.bodyGraphics.lineTo(-size * DIAMOND_ASPECT_RATIO, 0)
    this.bodyGraphics.closePath()
    this.bodyGraphics.fillPath()
  }

  /** Regular hexagon centered at origin */
  private drawHexagon(size: number): void {
    this.bodyGraphics.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      const px = Math.cos(angle) * size
      const py = Math.sin(angle) * size
      if (i === 0) {
        this.bodyGraphics.moveTo(px, py)
      } else {
        this.bodyGraphics.lineTo(px, py)
      }
    }
    this.bodyGraphics.closePath()
    this.bodyGraphics.fillPath()
  }

  /** Small triangle pointing right, rotated by facing */
  private drawFacingIndicator(color: number): void {
    const s = FACING_INDICATOR_SIZE
    this.indicatorGraphics.fillStyle(color, 1)
    this.indicatorGraphics.fillTriangle(s, 0, -s / 2, -s / 2, -s / 2, s / 2)
  }
}
