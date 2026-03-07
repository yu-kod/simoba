import Phaser from 'phaser'
import { createText } from '@/scenes/ui/createText'
import type { UiScale } from '@/scenes/ui/uiScale'
import type { HeroState } from '@shared/entities/Hero'
import { DESIGN_WIDTH } from './uiConstants'
const PANEL_Y = 510
const SLOT_SIZE = 54
const SLOT_SPACING = 80
const SKILL_ICON_SIZE = 44
const SKILL_ICON_GAP = 12

const COLORS = {
  slotEmpty: 0x1a1a2e,
  slotFilled: 0x2c3e50,
  slotBorder: 0xe67e22,
  slotBorderLocked: 0x555566,
  ownedBg: 0x34495e,
  ownedIcon: 0x9b59b6,
  selected: 0xf1c40f,
} as const

export interface SkillSlotCallbacks {
  readonly onAssignSkillSlot: (skillId: string, slot: string) => void
  readonly onSwapSkillSlots: (slotA: string, slotB: string) => void
  readonly onUnequipSkillSlot: (slot: string) => void
}

export class SkillSlotPanel {
  private readonly scene: Phaser.Scene
  private readonly scale: UiScale
  private readonly cameraZoom: number
  private readonly container: Phaser.GameObjects.Container
  private readonly callbacks: SkillSlotCallbacks
  private readonly ownedSkillLayer: Phaser.GameObjects.Container

  private slotGfxMap = new Map<string, Phaser.GameObjects.Graphics>()
  private slotLabelMap = new Map<string, Phaser.GameObjects.Text>()
  private ownedSkillElements: Phaser.GameObjects.Container[] = []
  private lastOwnedSkillIds: readonly string[] = []
  private slotPanelBuilt = false

  // Selection state (click-based assignment)
  private selectedSkillId: string | null = null
  private selectedSource: 'owned' | 'slot' | null = null
  private selectedSlot: string | null = null
  private selectionGfx: Phaser.GameObjects.Graphics | null = null

  private lastHeroState: HeroState | null = null

  // Cached layout positions (shared between rendering and hit-testing)
  private slotStartX = 0
  private ownedStartX = 0
  private ownedStartY = PANEL_Y + SLOT_SIZE + 34

  constructor(
    scene: Phaser.Scene,
    scale: UiScale,
    cameraZoom: number,
    container: Phaser.GameObjects.Container,
    ownedSkillLayer: Phaser.GameObjects.Container,
    callbacks: SkillSlotCallbacks,
  ) {
    this.scene = scene
    this.scale = scale
    this.cameraZoom = cameraZoom
    this.container = container
    this.ownedSkillLayer = ownedSkillLayer
    this.callbacks = callbacks
  }

  build(): void {
    if (this.slotPanelBuilt) return
    this.slotPanelBuilt = true

    const label = this.createOverlayText(DESIGN_WIDTH / 2, PANEL_Y - 28, 'SKILL SLOTS', {
      fontSize: this.scale.fontSize(24),
      color: '#888888',
    })
    label.setOrigin(0.5)
    this.container.add(label)

    const slots = ['Q', 'E', 'R'] as const
    this.slotStartX = DESIGN_WIDTH / 2 - (slots.length - 1) * SLOT_SPACING / 2 - SLOT_SIZE / 2

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!
      const sx = this.slotStartX + i * SLOT_SPACING
      const el = this.scene.add.container(sx, PANEL_Y)

      const gfx = this.scene.add.graphics()
      el.add(gfx)

      const keyLabel = this.createOverlayText(SLOT_SIZE / 2, -14, slot, {
        fontSize: this.scale.fontSize(24),
        color: '#BBBBBB',
        fontStyle: 'bold',
      })
      keyLabel.setOrigin(0.5)
      el.add(keyLabel)

      const skillLabel = this.createOverlayText(SLOT_SIZE / 2, SLOT_SIZE / 2, '', {
        fontSize: this.scale.fontSize(18),
        color: '#FFFFFF',
        align: 'center',
      })
      skillLabel.setOrigin(0.5)
      el.add(skillLabel)

      this.container.add(el)
      this.slotGfxMap.set(slot, gfx)
      this.slotLabelMap.set(slot, skillLabel)
    }

    const ownedLabel = this.createOverlayText(DESIGN_WIDTH / 2, PANEL_Y + SLOT_SIZE + 18, 'Owned Skills', {
      fontSize: this.scale.fontSize(22),
      color: '#888888',
    })
    ownedLabel.setOrigin(0.5)
    this.container.add(ownedLabel)
  }

  update(hero: HeroState): void {
    this.lastHeroState = hero
    this.updateSlotVisuals(hero)
    this.rebuildOwnedSkills(hero)
  }

  /** Returns true if the pointer hit a slot or owned skill element. */
  handlePointerDown(localX: number, localY: number): boolean {
    // Check slot hits (rect test)
    if (this.slotPanelBuilt) {
      const slots = ['Q', 'E', 'R'] as const
      for (let i = 0; i < slots.length; i++) {
        const sx = this.slotStartX + i * SLOT_SPACING
        if (localX >= sx && localX <= sx + SLOT_SIZE && localY >= PANEL_Y && localY <= PANEL_Y + SLOT_SIZE) {
          this.onSlotClick(slots[i]!)
          return true
        }
      }
    }

    // Check owned skill hits
    if (this.lastHeroState && this.lastHeroState.ownedSkills.length > 0) {
      const skills = this.lastHeroState.ownedSkills
      for (let i = 0; i < skills.length; i++) {
        const sx = this.ownedStartX + i * (SKILL_ICON_SIZE + SKILL_ICON_GAP)
        if (localX >= sx && localX <= sx + SKILL_ICON_SIZE && localY >= this.ownedStartY && localY <= this.ownedStartY + SKILL_ICON_SIZE) {
          this.onOwnedSkillClick(skills[i]!)
          return true
        }
      }
    }

    return false
  }

  clearSelection(): void {
    this.selectedSkillId = null
    this.selectedSource = null
    this.selectedSlot = null
    if (this.selectionGfx) {
      this.selectionGfx.destroy()
      this.selectionGfx = null
    }
  }

  destroy(): void {
    this.clearSelection()
    this.slotGfxMap.clear()
    this.slotLabelMap.clear()
    this.ownedSkillElements = []
  }

  // ---------- Private ----------

  private updateSlotVisuals(hero: HeroState): void {
    const map: Record<string, string> = {
      Q: hero.skillSlotQ,
      E: hero.skillSlotE,
      R: hero.skillSlotR,
    }

    for (const [slot, skillId] of Object.entries(map)) {
      const gfx = this.slotGfxMap.get(slot)
      const label = this.slotLabelMap.get(slot)
      if (!gfx) continue

      gfx.clear()
      gfx.fillStyle(skillId ? COLORS.slotFilled : COLORS.slotEmpty, 0.85)
      gfx.fillRect(0, 0, SLOT_SIZE, SLOT_SIZE)

      if (skillId) {
        const cx = SLOT_SIZE / 2
        const cy = SLOT_SIZE / 2
        const ir = SLOT_SIZE * 0.2
        gfx.fillStyle(0xe67e22, 0.9)
        gfx.beginPath()
        gfx.moveTo(cx, cy - ir)
        gfx.lineTo(cx + ir, cy)
        gfx.lineTo(cx, cy + ir)
        gfx.lineTo(cx - ir, cy)
        gfx.closePath()
        gfx.fillPath()
      }

      gfx.lineStyle(1, skillId ? COLORS.slotBorder : COLORS.slotBorderLocked, 0.8)
      gfx.strokeRect(0, 0, SLOT_SIZE, SLOT_SIZE)

      if (label) label.setText(skillId ? this.shortName(skillId) : '')
    }
  }

  private rebuildOwnedSkills(hero: HeroState): void {
    const skills = hero.ownedSkills

    const changed = skills.length !== this.lastOwnedSkillIds.length
      || skills.some((s, i) => s !== this.lastOwnedSkillIds[i])
    if (!changed) return
    this.lastOwnedSkillIds = skills

    for (const c of this.ownedSkillElements) c.destroy()
    this.ownedSkillElements = []
    if (skills.length === 0) return

    this.ownedStartX = DESIGN_WIDTH / 2 - (skills.length - 1) * (SKILL_ICON_SIZE + SKILL_ICON_GAP) / 2 - SKILL_ICON_SIZE / 2

    for (let i = 0; i < skills.length; i++) {
      const skillId = skills[i]!
      const sx = this.ownedStartX + i * (SKILL_ICON_SIZE + SKILL_ICON_GAP)
      const el = this.scene.add.container(sx, this.ownedStartY)

      const gfx = this.scene.add.graphics()
      gfx.fillStyle(COLORS.ownedBg, 0.85)
      gfx.fillRect(0, 0, SKILL_ICON_SIZE, SKILL_ICON_SIZE)

      const cx = SKILL_ICON_SIZE / 2
      const cy = SKILL_ICON_SIZE / 2
      const r = SKILL_ICON_SIZE * 0.22
      gfx.fillStyle(COLORS.ownedIcon, 0.9)
      gfx.beginPath()
      gfx.moveTo(cx, cy - r)
      gfx.lineTo(cx + r, cy)
      gfx.lineTo(cx, cy + r)
      gfx.lineTo(cx - r, cy)
      gfx.closePath()
      gfx.fillPath()

      gfx.lineStyle(1, 0x7f8c8d, 0.8)
      gfx.strokeRect(0, 0, SKILL_ICON_SIZE, SKILL_ICON_SIZE)
      el.add(gfx)

      const nameText = this.createOverlayText(cx, SKILL_ICON_SIZE + 4, this.shortName(skillId), {
        fontSize: this.scale.fontSize(18),
        color: '#AAAAAA',
        align: 'center',
      })
      nameText.setOrigin(0.5, 0)
      el.add(nameText)

      this.ownedSkillLayer.add(el)
      this.ownedSkillElements.push(el)
    }
  }

  private onOwnedSkillClick(skillId: string): void {
    if (this.selectedSkillId === skillId && this.selectedSource === 'owned') {
      this.clearSelection()
      return
    }
    this.setSelection('owned', skillId)
  }

  private onSlotClick(slot: string): void {
    if (!this.lastHeroState) return

    const slotValue = this.getSlotValue(slot)

    if (this.selectedSkillId) {
      if (this.selectedSource === 'owned' && !slotValue) {
        this.callbacks.onAssignSkillSlot(this.selectedSkillId, slot)
        this.clearSelection()
      } else if (this.selectedSource === 'slot' && this.selectedSlot && this.selectedSlot !== slot) {
        this.callbacks.onSwapSkillSlots(this.selectedSlot, slot)
        this.clearSelection()
      } else if (this.selectedSource === 'slot' && this.selectedSlot === slot) {
        this.callbacks.onUnequipSkillSlot(slot)
        this.clearSelection()
      } else {
        this.clearSelection()
      }
      return
    }

    if (slotValue) {
      this.setSelection('slot', slotValue, slot)
    }
  }

  private setSelection(source: 'owned' | 'slot', skillId: string, slot?: string): void {
    this.clearSelection()
    this.selectedSkillId = skillId
    this.selectedSource = source
    this.selectedSlot = slot ?? null

    this.selectionGfx = this.scene.add.graphics()
    this.selectionGfx.lineStyle(2, COLORS.selected, 1)
    this.selectionGfx.strokeCircle(0, 0, 24)
    this.container.add(this.selectionGfx)

    if (source === 'owned') {
      const idx = this.lastHeroState?.ownedSkills.indexOf(skillId) ?? -1
      if (idx >= 0 && this.ownedSkillElements[idx]) {
        const el = this.ownedSkillElements[idx]
        this.selectionGfx.setPosition(
          el.x + SKILL_ICON_SIZE / 2,
          el.y + SKILL_ICON_SIZE / 2,
        )
      }
    } else if (source === 'slot' && slot) {
      const slots = ['Q', 'E', 'R']
      const idx = slots.indexOf(slot)
      const slotStartX = DESIGN_WIDTH / 2 - (slots.length - 1) * SLOT_SPACING / 2 - SLOT_SIZE / 2
      this.selectionGfx.setPosition(
        slotStartX + idx * SLOT_SPACING + SLOT_SIZE / 2,
        PANEL_Y + SLOT_SIZE / 2,
      )
    }
  }

  private getSlotValue(slot: string): string {
    if (!this.lastHeroState) return ''
    switch (slot) {
      case 'Q': return this.lastHeroState.skillSlotQ
      case 'E': return this.lastHeroState.skillSlotE
      case 'R': return this.lastHeroState.skillSlotR
      default: return ''
    }
  }

  private shortName(skillId: string): string {
    const parts = skillId.split('-')
    return parts.length > 1
      ? parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      : skillId
  }

  private createOverlayText(
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    const t = createText(this.scene, x, y, text, style)
    t.setResolution(this.cameraZoom)
    return t
  }
}
