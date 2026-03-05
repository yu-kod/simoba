import Phaser from 'phaser'
import type { HeroState } from '@shared/entities/Hero'
import type { SkillSlotConfig } from '@/domain/ui/skillSlotConfig'
import { computeHudLayout } from '@/domain/ui/hudLayout'
import { createUiScale, type UiScale } from './uiScale'
import { createText } from './createText'
import { SkillSlotRenderer } from './SkillSlotRenderer'
import { LevelBadge } from './LevelBadge'
import { HudHpBar } from './HudHpBar'
import { drawHexPath } from './drawHexPath'

const HUD_DEPTH = 1100
const PANEL_BG_COLOR = 0x1a1a2e
const PANEL_BG_ALPHA = 0.75
const PANEL_CORNER_RADIUS = 3

const TALENT_BUTTON_SIZE = 32
const TALENT_BUTTON_COLOR = 0x2c3e50
const TALENT_BUTTON_BORDER = 0xf39c12
const BADGE_COLOR = 0xe74c3c

/**
 * Base design dimensions for HUD layout.
 * computeHudLayout returns positions in this 1280x720 coordinate space.
 * The container follows the camera worldView so it appears screen-fixed.
 */
const DESIGN_WIDTH = 1280
const DESIGN_HEIGHT = 720

/** Build a SkillSlotConfig from hero state for a given slot. */
function slotConfigFromHero(hero: HeroState, key: 'Q' | 'E' | 'R'): SkillSlotConfig {
  const slotMap = { Q: hero.skillSlotQ, E: hero.skillSlotE, R: hero.skillSlotR }
  const skillId = slotMap[key]
  if (skillId) {
    return { type: 'active', key, name: skillId }
  }
  return { type: 'empty', name: '' }
}

export class GameHud {
  private readonly container: Phaser.GameObjects.Container
  private readonly panelGraphics: Phaser.GameObjects.Graphics
  private slotRenderers: SkillSlotRenderer[]
  private readonly levelBadge: LevelBadge
  private readonly hpBar: HudHpBar
  private readonly scale: UiScale
  private readonly scene: Phaser.Scene
  private readonly cameraZoom: number
  private readonly onTalentButtonClick: () => void

  // Talent button
  private readonly talentButtonGfx: Phaser.GameObjects.Graphics
  private readonly talentBadgeGfx: Phaser.GameObjects.Graphics
  private readonly talentBadgeText: Phaser.GameObjects.Text
  private talentButtonX: number
  private talentButtonY: number
  private lastBadgeCount = 0

  // Track current slot config to avoid unnecessary rebuilds
  private currentSlotKeys: string[] = []

  constructor(scene: Phaser.Scene, cameraZoom: number, onTalentButtonClick: () => void) {
    this.scene = scene
    this.scale = createUiScale(cameraZoom)
    this.cameraZoom = cameraZoom
    this.onTalentButtonClick = onTalentButtonClick

    // Initial slots: 3 empty (Q, E, R)
    const initialSlots: SkillSlotConfig[] = [
      { type: 'empty', key: 'Q', name: '' },
      { type: 'empty', key: 'E', name: '' },
      { type: 'empty', key: 'R', name: '' },
    ]
    const layout = computeHudLayout(DESIGN_WIDTH, DESIGN_HEIGHT, initialSlots.length)

    // Fixed HUD — scrollFactor(0) + offset for stable, jitter-free rendering
    const offsetX = DESIGN_WIDTH * (cameraZoom - 1) / 2
    const offsetY = DESIGN_HEIGHT * (cameraZoom - 1) / 2
    this.container = scene.add.container(offsetX, offsetY)
    this.container.setScrollFactor(0)
    this.container.setDepth(HUD_DEPTH)

    // Panel background
    this.panelGraphics = scene.add.graphics()
    this.panelGraphics.fillStyle(PANEL_BG_COLOR, PANEL_BG_ALPHA)
    this.panelGraphics.fillRoundedRect(
      layout.panelX,
      layout.panelY,
      layout.panelWidth,
      layout.panelHeight,
      PANEL_CORNER_RADIUS,
    )
    this.container.add(this.panelGraphics)

    // Skill slots
    this.slotRenderers = initialSlots.map((slotConfig: SkillSlotConfig, i: number) => {
      const slotLayout = layout.slots[i]!
      const renderer = new SkillSlotRenderer(
        scene,
        slotConfig,
        slotLayout.x,
        slotLayout.y,
        slotLayout.size,
        this.scale,
      )
      this.container.add(renderer.gameObject)
      return renderer
    })
    this.currentSlotKeys = initialSlots.map(s => s.name)

    // Level badge
    this.levelBadge = new LevelBadge(
      scene,
      layout.badgeX,
      layout.badgeY,
      layout.badgeSize,
      this.scale,
      cameraZoom,
    )
    this.container.add(this.levelBadge.gameObject)

    // HP bar
    this.hpBar = new HudHpBar(
      scene,
      layout.hpBarX,
      layout.hpBarY,
      layout.hpBarWidth,
      layout.hpBarHeight,
      this.scale,
      cameraZoom,
    )
    this.container.add(this.hpBar.gameObject)

    // Talent button (above-left of panel)
    this.talentButtonX = layout.panelX - TALENT_BUTTON_SIZE - 8
    this.talentButtonY = layout.panelY + (layout.panelHeight - TALENT_BUTTON_SIZE) / 2

    this.talentButtonGfx = scene.add.graphics()
    this.drawTalentButton()
    this.container.add(this.talentButtonGfx)

    // Badge (talent point count)
    this.talentBadgeGfx = scene.add.graphics()
    this.container.add(this.talentBadgeGfx)
    this.talentBadgeText = createText(
      scene,
      this.talentButtonX + TALENT_BUTTON_SIZE - 2,
      this.talentButtonY - 2,
      '',
      {
        fontSize: this.scale.fontSize(11),
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'center',
      },
    )
    this.talentBadgeText.setOrigin(0.5)
    this.talentBadgeText.setResolution(cameraZoom)
    this.talentBadgeText.setVisible(false)
    this.container.add(this.talentBadgeText)
  }

  get gameObject(): Phaser.GameObjects.Container {
    return this.container
  }

  update(_delta: number, heroState: HeroState): void {
    this.levelBadge.update(heroState.level, heroState.xp)
    this.hpBar.update(heroState.hp, heroState.maxHp)

    // Update skill slot renderers if config changed
    this.updateSlotRenderers(heroState)

    for (const renderer of this.slotRenderers) {
      renderer.update(0, this.scale)
    }

    // Update talent badge
    this.updateTalentBadge(heroState.talentPoints)
  }

  destroy(): void {
    for (const renderer of this.slotRenderers) {
      renderer.destroy()
    }
    this.levelBadge.destroy()
    this.hpBar.destroy()
    this.container.destroy()
  }

  private drawTalentButton(): void {
    this.talentButtonGfx.clear()
    const cx = this.talentButtonX + TALENT_BUTTON_SIZE / 2
    const cy = this.talentButtonY + TALENT_BUTTON_SIZE / 2
    const r = TALENT_BUTTON_SIZE / 2

    this.talentButtonGfx.fillStyle(TALENT_BUTTON_COLOR, 0.85)
    drawHexPath(this.talentButtonGfx, cx, cy, r)
    this.talentButtonGfx.fillPath()

    this.talentButtonGfx.lineStyle(2, TALENT_BUTTON_BORDER, 0.9)
    drawHexPath(this.talentButtonGfx, cx, cy, r)
    this.talentButtonGfx.strokePath()

    // "T" letter inside
    this.talentButtonGfx.fillStyle(0xf39c12, 1)
    const barW = r * 0.8
    const barH = r * 0.15
    this.talentButtonGfx.fillRect(cx - barW / 2, cy - r * 0.35, barW, barH)
    this.talentButtonGfx.fillRect(cx - barH / 2, cy - r * 0.35, barH, r * 0.7)
  }

  private updateTalentBadge(talentPoints: number): void {
    if (talentPoints === this.lastBadgeCount) return
    this.lastBadgeCount = talentPoints

    this.talentBadgeGfx.clear()
    if (talentPoints > 0) {
      const bx = this.talentButtonX + TALENT_BUTTON_SIZE - 2
      const by = this.talentButtonY - 2
      const br = 8
      this.talentBadgeGfx.fillStyle(BADGE_COLOR, 1)
      this.talentBadgeGfx.fillCircle(bx, by, br)
      this.talentBadgeText.setText(talentPoints.toString())
      this.talentBadgeText.setVisible(true)
    } else {
      this.talentBadgeText.setVisible(false)
    }
  }

  /** Handle scene-level pointer click — returns true if talent button was hit. */
  handlePointerDown(pointer: Phaser.Input.Pointer): boolean {
    const localX = pointer.x / this.cameraZoom
    const localY = pointer.y / this.cameraZoom

    // Talent button hit test (circle)
    const bx = this.talentButtonX + TALENT_BUTTON_SIZE / 2
    const by = this.talentButtonY + TALENT_BUTTON_SIZE / 2
    const dx = localX - bx
    const dy = localY - by
    const r = TALENT_BUTTON_SIZE / 2
    if (dx * dx + dy * dy <= r * r) {
      this.onTalentButtonClick()
      return true
    }
    return false
  }

  private updateSlotRenderers(heroState: HeroState): void {
    const keys = ['Q', 'E', 'R'] as const
    const newKeys = keys.map(k => {
      const map = { Q: heroState.skillSlotQ, E: heroState.skillSlotE, R: heroState.skillSlotR }
      return map[k]
    })

    // Check if changed
    const changed = newKeys.some((k, i) => k !== this.currentSlotKeys[i])
    if (!changed) return
    this.currentSlotKeys = [...newKeys]

    // Rebuild slot renderers
    const layout = computeHudLayout(DESIGN_WIDTH, DESIGN_HEIGHT, keys.length)

    for (const renderer of this.slotRenderers) {
      renderer.destroy()
    }

    this.slotRenderers = keys.map((key, i) => {
      const config = slotConfigFromHero(heroState, key)
      const slotLayout = layout.slots[i]!
      const renderer = new SkillSlotRenderer(
        this.scene,
        config,
        slotLayout.x,
        slotLayout.y,
        slotLayout.size,
        this.scale,
      )
      this.container.add(renderer.gameObject)
      return renderer
    })
  }
}
