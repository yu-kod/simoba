import Phaser from 'phaser'
import { createText } from '@/scenes/ui/createText'
import { createUiScale, type UiScale } from '@/scenes/ui/uiScale'
import type { TalentTreeDefinition, TalentNode } from '@shared/talents/types'
import type { HeroType } from '@shared/types'
import type { HeroState } from '@shared/entities/Hero'
import { TALENT_TREES } from '@shared/talents/index'

// Design space (pre-zoom)
const BASE_WIDTH = 1280
const BASE_HEIGHT = 720
const OVERLAY_DEPTH = 1500

// Tree layout
const TREE_START_Y = 110
const ROW_GAP = 120
const COL_GAP = 180
const NODE_RADIUS = 32

// Colors
const COLORS = {
  bg: 0x0a0a1a,
  acquired: 0x27ae60,
  available: 0xf39c12,
  locked: 0x444455,
  borderAcquired: 0x2ecc71,
  borderAvailable: 0xf1c40f,
  borderLocked: 0x666677,
  lineDefault: 0x555566,
  lineAcquired: 0x27ae60,
  slotEmpty: 0x1a1a2e,
  slotFilled: 0x2c3e50,
  slotBorder: 0xe67e22,
  slotBorderLocked: 0x555566,
  ownedBg: 0x34495e,
  ownedIcon: 0x9b59b6,
  selected: 0xf1c40f,
  tooltipBg: 0x1a1a2e,
  tooltipBorder: 0x888888,
} as const

// Skill panel
const PANEL_Y = 510
const SLOT_SIZE = 54
const SLOT_SPACING = 80
const SKILL_ICON_SIZE = 44
const SKILL_ICON_GAP = 12

type NodeState = 'acquired' | 'available' | 'locked'

interface NodeLayout {
  readonly node: TalentNode
  readonly x: number
  readonly y: number
}

export interface TalentTreeCallbacks {
  readonly onAcquireTalent: (talentId: string) => void
  readonly onAssignSkillSlot: (skillId: string, slot: string) => void
  readonly onSwapSkillSlots: (slotA: string, slotB: string) => void
  readonly onUnequipSkillSlot: (slot: string) => void
}

export class TalentTreeOverlay {
  private readonly container: Phaser.GameObjects.Container
  private readonly scene: Phaser.Scene
  private readonly scale: UiScale
  private readonly cameraZoom: number
  private readonly callbacks: TalentTreeCallbacks

  private visible = false
  private treeDef: TalentTreeDefinition | null = null
  private nodeLayouts: NodeLayout[] = []
  private lastHeroState: HeroState | null = null

  // Tree
  private readonly lineGfx: Phaser.GameObjects.Graphics
  private nodeGfxMap = new Map<string, Phaser.GameObjects.Graphics>()
  private nodeElementMap = new Map<string, Phaser.GameObjects.Container>()
  private pointsText: Phaser.GameObjects.Text

  // Tooltip
  private readonly tooltipContainer: Phaser.GameObjects.Container
  private readonly tooltipGfx: Phaser.GameObjects.Graphics
  private readonly tooltipName: Phaser.GameObjects.Text
  private readonly tooltipDesc: Phaser.GameObjects.Text
  private readonly tooltipCost: Phaser.GameObjects.Text

  // Skill slots
  private slotGfxMap = new Map<string, Phaser.GameObjects.Graphics>()
  private slotLabelMap = new Map<string, Phaser.GameObjects.Text>()
  private readonly ownedSkillLayer: Phaser.GameObjects.Container
  private ownedSkillElements: Phaser.GameObjects.Container[] = []
  private lastOwnedSkillIds: readonly string[] = []
  private slotPanelBuilt = false

  // Selection state (click-based assignment)
  private selectedSkillId: string | null = null
  private selectedSource: 'owned' | 'slot' | null = null
  private selectedSlot: string | null = null
  private selectionGfx: Phaser.GameObjects.Graphics | null = null

  constructor(
    scene: Phaser.Scene,
    cameraZoom: number,
    callbacks: TalentTreeCallbacks,
  ) {
    this.scene = scene
    this.scale = createUiScale(cameraZoom)
    this.cameraZoom = cameraZoom
    this.callbacks = callbacks

    // Fixed overlay — scrollFactor(0) + offset for stable, jitter-free rendering
    const offsetX = BASE_WIDTH * (cameraZoom - 1) / 2
    const offsetY = BASE_HEIGHT * (cameraZoom - 1) / 2
    this.container = scene.add.container(offsetX, offsetY)
    this.container.setScrollFactor(0)
    this.container.setDepth(OVERLAY_DEPTH)
    this.container.setVisible(false)

    // Background (blocks clicks from reaching game)
    const bg = scene.add.graphics()
    bg.fillStyle(COLORS.bg, 0.8)
    bg.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT)
    this.container.add(bg)

    // Connection lines (below nodes)
    this.lineGfx = scene.add.graphics()
    this.container.add(this.lineGfx)

    // Title
    const title = this.createOverlayText(BASE_WIDTH / 2, 24, 'TALENT TREE', {
      fontSize: this.scale.fontSize(52),
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    })
    title.setOrigin(0.5)
    this.container.add(title)

    // Talent points display
    this.pointsText = this.createOverlayText(BASE_WIDTH / 2, 72, 'Points: 0', {
      fontSize: this.scale.fontSize(32),
      color: '#FFFFFF',
    })
    this.pointsText.setOrigin(0.5)
    this.container.add(this.pointsText)

    // Owned skills layer (rebuilt on state change)
    this.ownedSkillLayer = scene.add.container(0, 0)
    this.container.add(this.ownedSkillLayer)

    // Close hint
    const hint = this.createOverlayText(BASE_WIDTH / 2, BASE_HEIGHT - 18, 'TAB to close', {
      fontSize: this.scale.fontSize(22),
      color: '#666666',
    })
    hint.setOrigin(0.5)
    this.container.add(hint)

    // Tooltip container (hidden by default, shown on hover)
    this.tooltipContainer = scene.add.container(0, 0)
    this.tooltipContainer.setVisible(false)
    this.tooltipGfx = scene.add.graphics()
    this.tooltipContainer.add(this.tooltipGfx)

    this.tooltipName = this.createOverlayText(0, 0, '', {
      fontSize: this.scale.fontSize(36),
      color: '#FFD700',
      fontStyle: 'bold',
    })
    this.tooltipContainer.add(this.tooltipName)

    this.tooltipDesc = this.createOverlayText(0, 0, '', {
      fontSize: this.scale.fontSize(30),
      color: '#CCCCCC',
      wordWrap: { width: 340 },
    })
    this.tooltipContainer.add(this.tooltipDesc)

    this.tooltipCost = this.createOverlayText(0, 0, '', {
      fontSize: this.scale.fontSize(30),
      color: '#F39C12',
    })
    this.tooltipContainer.add(this.tooltipCost)

    // Tooltip must be on top of everything else in the container
    this.container.add(this.tooltipContainer)
  }

  setHeroType(heroType: HeroType): void {
    const treeDef = TALENT_TREES[heroType]
    if (!treeDef || treeDef === this.treeDef) return
    this.treeDef = treeDef
    this.rebuildTree()
    this.buildSlotPanel()
  }

  toggle(): void {
    this.visible = !this.visible
    this.container.setVisible(this.visible)
    if (!this.visible) {
      this.clearSelection()
      this.tooltipContainer.setVisible(false)
    }
  }

  isOpen(): boolean {
    return this.visible
  }

  update(heroState: HeroState): void {
    if (!this.visible || !this.treeDef) return
    this.lastHeroState = heroState

    this.pointsText.setText(`Points: ${heroState.talentPoints}`)

    for (const layout of this.nodeLayouts) {
      const state = this.getNodeState(layout.node, heroState)
      const gfx = this.nodeGfxMap.get(layout.node.id)
      if (gfx) this.drawHexNode(gfx, state)
    }

    this.drawConnections(heroState.acquiredTalents)
    this.updateSlotVisuals(heroState)
    this.rebuildOwnedSkills(heroState)
  }

  destroy(): void {
    this.clearSelection()
    this.container.destroy()
    this.nodeGfxMap.clear()
    this.nodeElementMap.clear()
    this.slotGfxMap.clear()
    this.slotLabelMap.clear()
    this.ownedSkillElements = []
  }

  // ---------- Helpers ----------

  /** Create text with resolution set for crisp rendering at camera zoom. */
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

  // ---------- Tree ----------

  private rebuildTree(): void {
    for (const c of this.nodeElementMap.values()) c.destroy()
    this.nodeElementMap.clear()
    this.nodeGfxMap.clear()

    if (!this.treeDef) return
    this.nodeLayouts = this.computeLayout(this.treeDef)

    for (const layout of this.nodeLayouts) {
      this.createNode(layout)
    }
  }

  private computeLayout(tree: TalentTreeDefinition): NodeLayout[] {
    const depthOf = new Map<string, number>()
    const getDepth = (n: TalentNode): number => {
      if (depthOf.has(n.id)) return depthOf.get(n.id)!
      const d = n.prerequisites.length === 0
        ? 0
        : Math.max(...n.prerequisites.map(pid => {
          const p = tree.nodes.find(x => x.id === pid)
          return p ? getDepth(p) + 1 : 0
        }))
      depthOf.set(n.id, d)
      return d
    }
    for (const n of tree.nodes) getDepth(n)

    const groups = new Map<number, TalentNode[]>()
    for (const n of tree.nodes) {
      const d = depthOf.get(n.id) ?? 0
      if (!groups.has(d)) groups.set(d, [])
      groups.get(d)!.push(n)
    }

    const cx = BASE_WIDTH / 2
    const result: NodeLayout[] = []
    for (const [depth, nodes] of groups) {
      const w = (nodes.length - 1) * COL_GAP
      for (let i = 0; i < nodes.length; i++) {
        result.push({
          node: nodes[i]!,
          x: cx - w / 2 + i * COL_GAP,
          y: TREE_START_Y + depth * ROW_GAP,
        })
      }
    }
    return result
  }

  private createNode(layout: NodeLayout): void {
    const { node, x, y } = layout
    const el = this.scene.add.container(x, y)

    const gfx = this.scene.add.graphics()
    el.add(gfx)
    this.drawHexNode(gfx, 'locked')

    // Node name label (below hex)
    const name = this.createOverlayText(0, NODE_RADIUS + 8, node.name, {
      fontSize: this.scale.fontSize(22),
      color: '#CCCCCC',
      align: 'center',
    })
    name.setOrigin(0.5, 0)
    el.add(name)

    this.container.add(el)
    this.nodeElementMap.set(node.id, el)
    this.nodeGfxMap.set(node.id, gfx)
  }

  private drawHexNode(gfx: Phaser.GameObjects.Graphics, state: NodeState): void {
    gfx.clear()
    const r = NODE_RADIUS
    const fill = state === 'acquired' ? COLORS.acquired
      : state === 'available' ? COLORS.available : COLORS.locked
    const border = state === 'acquired' ? COLORS.borderAcquired
      : state === 'available' ? COLORS.borderAvailable : COLORS.borderLocked

    const hexPath = () => {
      gfx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        const px = Math.cos(a) * r
        const py = Math.sin(a) * r
        if (i === 0) gfx.moveTo(px, py)
        else gfx.lineTo(px, py)
      }
      gfx.closePath()
    }

    gfx.fillStyle(fill, 0.85)
    hexPath()
    gfx.fillPath()
    gfx.lineStyle(2, border, 1)
    hexPath()
    gfx.strokePath()
  }

  private drawConnections(acquired: readonly string[]): void {
    this.lineGfx.clear()
    const layoutMap = new Map(this.nodeLayouts.map(l => [l.node.id, l]))
    const acqSet = new Set(acquired)

    for (const layout of this.nodeLayouts) {
      for (const pid of layout.node.prerequisites) {
        const parent = layoutMap.get(pid)
        if (!parent) continue
        const both = acqSet.has(pid) && acqSet.has(layout.node.id)
        this.lineGfx.lineStyle(both ? 3 : 2, both ? COLORS.lineAcquired : COLORS.lineDefault, both ? 1 : 0.4)
        this.lineGfx.beginPath()
        this.lineGfx.moveTo(parent.x, parent.y)
        this.lineGfx.lineTo(layout.x, layout.y)
        this.lineGfx.strokePath()
      }
    }
  }

  private getNodeState(node: TalentNode, hero: HeroState): NodeState {
    if (hero.acquiredTalents.includes(node.id)) return 'acquired'
    const prereqsMet = node.prerequisites.every(p => hero.acquiredTalents.includes(p))
    return prereqsMet && hero.talentPoints >= node.cost ? 'available' : 'locked'
  }

  private onNodeClick(nodeId: string): void {
    if (!this.lastHeroState || !this.treeDef) return
    const node = this.treeDef.nodes.find(n => n.id === nodeId)
    if (!node) return
    if (this.getNodeState(node, this.lastHeroState) === 'available') {
      this.callbacks.onAcquireTalent(nodeId)
    }
  }

  // ---------- Tooltip ----------

  private showTooltip(node: TalentNode, nodeX: number, nodeY: number): void {
    const padding = 14
    const tooltipW = 360

    this.tooltipName.setText(node.name)
    this.tooltipName.setPosition(padding, padding)

    // Name height in world space: fontSize(36) = 18px world
    const descStartY = padding + this.tooltipName.height + 4
    this.tooltipDesc.setText(node.description)
    this.tooltipDesc.setPosition(padding, descStartY)
    this.tooltipDesc.setWordWrapWidth(tooltipW - padding * 2)

    const descBottom = descStartY + this.tooltipDesc.height
    const costLabel = this.lastHeroState
      ? (this.getNodeState(node, this.lastHeroState) === 'acquired' ? 'Acquired' : `Cost: ${node.cost}`)
      : `Cost: ${node.cost}`
    this.tooltipCost.setText(costLabel)
    this.tooltipCost.setPosition(padding, descBottom + 6)

    const tooltipH = descBottom + 6 + this.tooltipCost.height + padding

    this.tooltipGfx.clear()
    this.tooltipGfx.fillStyle(COLORS.tooltipBg, 0.95)
    this.tooltipGfx.fillRoundedRect(0, 0, tooltipW, tooltipH, 6)
    this.tooltipGfx.lineStyle(1, COLORS.tooltipBorder, 0.8)
    this.tooltipGfx.strokeRoundedRect(0, 0, tooltipW, tooltipH, 6)

    // Position tooltip to the right of the node, clamped to overlay bounds
    let tx = nodeX + NODE_RADIUS + 14
    let ty = nodeY - tooltipH / 2
    if (tx + tooltipW > BASE_WIDTH - 10) tx = nodeX - NODE_RADIUS - tooltipW - 14
    if (ty < 10) ty = 10
    if (ty + tooltipH > BASE_HEIGHT - 10) ty = BASE_HEIGHT - tooltipH - 10

    this.tooltipContainer.setPosition(tx, ty)
    this.tooltipContainer.setVisible(true)
    this.container.bringToTop(this.tooltipContainer)
  }

  private hideTooltip(): void {
    this.tooltipContainer.setVisible(false)
  }

  // ---------- Scene-level input ----------

  handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.visible) return
    const localX = pointer.x / this.cameraZoom
    const localY = pointer.y / this.cameraZoom

    // Check node hits (circle test)
    for (const layout of this.nodeLayouts) {
      const dx = localX - layout.x
      const dy = localY - layout.y
      if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
        this.onNodeClick(layout.node.id)
        return
      }
    }

    // Check slot hits (rect test)
    if (this.slotPanelBuilt) {
      const slots = ['Q', 'E', 'R'] as const
      const slotStartX = BASE_WIDTH / 2 - (slots.length - 1) * SLOT_SPACING / 2 - SLOT_SIZE / 2
      for (let i = 0; i < slots.length; i++) {
        const sx = slotStartX + i * SLOT_SPACING
        if (localX >= sx && localX <= sx + SLOT_SIZE && localY >= PANEL_Y && localY <= PANEL_Y + SLOT_SIZE) {
          this.onSlotClick(slots[i]!)
          return
        }
      }
    }

    // Check owned skill hits
    if (this.lastHeroState && this.lastHeroState.ownedSkills.length > 0) {
      const skills = this.lastHeroState.ownedSkills
      const ownedStartX = BASE_WIDTH / 2 - (skills.length - 1) * (SKILL_ICON_SIZE + SKILL_ICON_GAP) / 2 - SKILL_ICON_SIZE / 2
      const ownedStartY = PANEL_Y + SLOT_SIZE + 34
      for (let i = 0; i < skills.length; i++) {
        const sx = ownedStartX + i * (SKILL_ICON_SIZE + SKILL_ICON_GAP)
        if (localX >= sx && localX <= sx + SKILL_ICON_SIZE && localY >= ownedStartY && localY <= ownedStartY + SKILL_ICON_SIZE) {
          this.onOwnedSkillClick(skills[i]!)
          return
        }
      }
    }

    // Click on background — clear selection
    this.clearSelection()
  }

  handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.visible) return
    const localX = pointer.x / this.cameraZoom
    const localY = pointer.y / this.cameraZoom

    // Check node hovers for tooltip
    for (const layout of this.nodeLayouts) {
      const dx = localX - layout.x
      const dy = localY - layout.y
      if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
        this.showTooltip(layout.node, layout.x, layout.y)
        return
      }
    }

    this.hideTooltip()
  }

  // ---------- Skill Slot Panel ----------

  private buildSlotPanel(): void {
    if (this.slotPanelBuilt) return
    this.slotPanelBuilt = true

    const label = this.createOverlayText(BASE_WIDTH / 2, PANEL_Y - 28, 'SKILL SLOTS', {
      fontSize: this.scale.fontSize(24),
      color: '#888888',
    })
    label.setOrigin(0.5)
    this.container.add(label)

    const slots = ['Q', 'E', 'R'] as const
    const startX = BASE_WIDTH / 2 - (slots.length - 1) * SLOT_SPACING / 2 - SLOT_SIZE / 2

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]!
      const sx = startX + i * SLOT_SPACING
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

    const ownedLabel = this.createOverlayText(BASE_WIDTH / 2, PANEL_Y + SLOT_SIZE + 18, 'Owned Skills', {
      fontSize: this.scale.fontSize(22),
      color: '#888888',
    })
    ownedLabel.setOrigin(0.5)
    this.container.add(ownedLabel)
  }

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

    // Skip rebuild if unchanged
    const changed = skills.length !== this.lastOwnedSkillIds.length
      || skills.some((s, i) => s !== this.lastOwnedSkillIds[i])
    if (!changed) return
    this.lastOwnedSkillIds = skills

    for (const c of this.ownedSkillElements) c.destroy()
    this.ownedSkillElements = []
    if (skills.length === 0) return

    const startX = BASE_WIDTH / 2 - (skills.length - 1) * (SKILL_ICON_SIZE + SKILL_ICON_GAP) / 2 - SKILL_ICON_SIZE / 2
    const startY = PANEL_Y + SLOT_SIZE + 34

    for (let i = 0; i < skills.length; i++) {
      const skillId = skills[i]!
      const sx = startX + i * (SKILL_ICON_SIZE + SKILL_ICON_GAP)
      const el = this.scene.add.container(sx, startY)

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

  // ---------- Click-based Assignment ----------

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

    // If we have a selected skill, try to assign/swap/unequip
    if (this.selectedSkillId) {
      if (this.selectedSource === 'owned' && !slotValue) {
        // Assign owned skill to empty slot
        this.callbacks.onAssignSkillSlot(this.selectedSkillId, slot)
        this.clearSelection()
      } else if (this.selectedSource === 'slot' && this.selectedSlot && this.selectedSlot !== slot) {
        // Swap two slots
        this.callbacks.onSwapSkillSlots(this.selectedSlot, slot)
        this.clearSelection()
      } else if (this.selectedSource === 'slot' && this.selectedSlot === slot) {
        // Same slot clicked again — unequip
        this.callbacks.onUnequipSkillSlot(slot)
        this.clearSelection()
      } else {
        this.clearSelection()
      }
      return
    }

    // No selection — click on filled slot to select it
    if (slotValue) {
      this.setSelection('slot', slotValue, slot)
    }
  }

  private setSelection(source: 'owned' | 'slot', skillId: string, slot?: string): void {
    this.clearSelection()
    this.selectedSkillId = skillId
    this.selectedSource = source
    this.selectedSlot = slot ?? null

    // Visual indicator: floating selection marker
    this.selectionGfx = this.scene.add.graphics()
    this.selectionGfx.lineStyle(2, COLORS.selected, 1)
    this.selectionGfx.strokeCircle(0, 0, 24)
    this.container.add(this.selectionGfx)

    // Position at the source
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
      const slotContainer = this.slotGfxMap.get(slot)
      if (slotContainer) {
        const slots = ['Q', 'E', 'R']
        const idx = slots.indexOf(slot)
        const slotStartX = BASE_WIDTH / 2 - (slots.length - 1) * SLOT_SPACING / 2 - SLOT_SIZE / 2
        this.selectionGfx.setPosition(
          slotStartX + idx * SLOT_SPACING + SLOT_SIZE / 2,
          PANEL_Y + SLOT_SIZE / 2,
        )
      }
    }
  }

  private clearSelection(): void {
    this.selectedSkillId = null
    this.selectedSource = null
    this.selectedSlot = null
    if (this.selectionGfx) {
      this.selectionGfx.destroy()
      this.selectionGfx = null
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
}
