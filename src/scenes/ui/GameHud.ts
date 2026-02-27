import Phaser from 'phaser'
import type { HeroState } from '@shared/entities/Hero'
import type { SkillSlotConfig } from '@/domain/ui/skillSlotConfig'
import { DEBUG_SKILL_SLOTS } from '@/domain/ui/skillSlotConfig'
import { computeHudLayout } from '@/domain/ui/hudLayout'
import { createUiScale, type UiScale } from './uiScale'
import { SkillSlotRenderer } from './SkillSlotRenderer'
import { LevelBadge } from './LevelBadge'
import { HudHpBar } from './HudHpBar'

const HUD_DEPTH = 1100
const PANEL_BG_COLOR = 0x1a1a2e
const PANEL_BG_ALPHA = 0.75
const PANEL_CORNER_RADIUS = 3

/**
 * Base design dimensions for HUD layout.
 * computeHudLayout returns positions in this 1280x720 coordinate space.
 *
 * For scrollFactor(0) objects, Phaser applies camera zoom around the
 * viewport center (vpW/2, vpH/2).  Screen formula:
 *   screen_x = (world_x - vpW/2) * zoom + vpW/2
 *
 * To map design coords (0..1280) onto the full canvas (0..2560), the
 * container must be offset so that design (0,0) maps to screen (0,0):
 *   offset = BASE * (zoom - 1) / 2
 */
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720

export class GameHud {
  private readonly container: Phaser.GameObjects.Container
  private readonly panelGraphics: Phaser.GameObjects.Graphics
  private readonly slotRenderers: SkillSlotRenderer[]
  private readonly levelBadge: LevelBadge
  private readonly hpBar: HudHpBar
  private readonly scale: UiScale

  constructor(scene: Phaser.Scene, cameraZoom: number) {
    // UiScale divides by zoom — used for SIZES and FONTS only, never for positions.
    this.scale = createUiScale(cameraZoom)
    const slots = DEBUG_SKILL_SLOTS
    const layout = computeHudLayout(BASE_WIDTH, BASE_HEIGHT, slots.length)

    // Offset so the 1280x720 design space maps to the full canvas when
    // camera zoom scales scrollFactor(0) objects around the viewport center.
    const offsetX = BASE_WIDTH * (cameraZoom - 1) / 2
    const offsetY = BASE_HEIGHT * (cameraZoom - 1) / 2
    this.container = scene.add.container(offsetX, offsetY)
    this.container.setScrollFactor(0)
    this.container.setDepth(HUD_DEPTH)

    // Panel background — all in world coords (camera zoom handles canvas scaling)
    this.panelGraphics = scene.add.graphics()
    this.panelGraphics.fillStyle(PANEL_BG_COLOR, PANEL_BG_ALPHA)
    this.panelGraphics.fillRoundedRect(
      layout.panelX,
      layout.panelY,
      layout.panelWidth,
      layout.panelHeight,
      PANEL_CORNER_RADIUS
    )
    this.container.add(this.panelGraphics)

    // Skill slots
    this.slotRenderers = slots.map((slotConfig: SkillSlotConfig, i: number) => {
      const slotLayout = layout.slots[i]
      const renderer = new SkillSlotRenderer(
        scene,
        slotConfig,
        slotLayout.x,
        slotLayout.y,
        slotLayout.size,
        this.scale
      )
      this.container.add(renderer.gameObject)
      return renderer
    })

    // Level badge (XP progress displayed as pie chart fill)
    this.levelBadge = new LevelBadge(
      scene,
      layout.badgeX,
      layout.badgeY,
      layout.badgeSize,
      this.scale
    )
    this.container.add(this.levelBadge.gameObject)

    // HP bar
    this.hpBar = new HudHpBar(
      scene,
      layout.hpBarX,
      layout.hpBarY,
      layout.hpBarWidth,
      layout.hpBarHeight,
      this.scale
    )
    this.container.add(this.hpBar.gameObject)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  update(_delta: number, heroState: HeroState): void {
    this.levelBadge.update(heroState.level, heroState.xp)
    this.hpBar.update(heroState.hp, heroState.maxHp)

    for (const renderer of this.slotRenderers) {
      renderer.update(0, this.scale)
    }
  }

  destroy(): void {
    for (const renderer of this.slotRenderers) {
      renderer.destroy()
    }
    this.levelBadge.destroy()
    this.hpBar.destroy()
    this.container.destroy()
  }
}
