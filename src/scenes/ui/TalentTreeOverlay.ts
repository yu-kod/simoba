import Phaser from 'phaser'
import { createText } from '@/scenes/ui/createText'
import { createUiScale } from '@/scenes/ui/uiScale'
import type { TalentTreeDefinition, TalentNode } from '@shared/talents/types'
import type { HeroType } from '@shared/types'
import type { HeroState } from '@shared/entities/Hero'
import { TALENT_TREES } from '@shared/talents/index'
import { drawHexPath } from './drawHexPath'
import { SkillSlotPanel, type SkillSlotCallbacks } from './SkillSlotPanel'

// Design space (pre-zoom)
const DESIGN_WIDTH = 1280
const DESIGN_HEIGHT = 720
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
  tooltipBg: 0x1a1a2e,
  tooltipBorder: 0x888888,
} as const

type NodeState = 'acquired' | 'available' | 'locked'

interface NodeLayout {
  readonly node: TalentNode
  readonly x: number
  readonly y: number
}

export interface TalentTreeCallbacks extends SkillSlotCallbacks {
  readonly onAcquireTalent: (talentId: string) => void
}

export class TalentTreeOverlay {
  private readonly container: Phaser.GameObjects.Container
  private readonly scene: Phaser.Scene
  private readonly cameraZoom: number
  private readonly callbacks: TalentTreeCallbacks
  private readonly skillSlotPanel: SkillSlotPanel

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

  constructor(
    scene: Phaser.Scene,
    cameraZoom: number,
    callbacks: TalentTreeCallbacks,
  ) {
    this.scene = scene
    this.cameraZoom = cameraZoom
    this.callbacks = callbacks
    const scale = createUiScale(cameraZoom)

    // Fixed overlay — scrollFactor(0) + offset for stable, jitter-free rendering
    const offsetX = DESIGN_WIDTH * (cameraZoom - 1) / 2
    const offsetY = DESIGN_HEIGHT * (cameraZoom - 1) / 2
    this.container = scene.add.container(offsetX, offsetY)
    this.container.setScrollFactor(0)
    this.container.setDepth(OVERLAY_DEPTH)
    this.container.setVisible(false)

    // Background (blocks clicks from reaching game)
    const bg = scene.add.graphics()
    bg.fillStyle(COLORS.bg, 0.8)
    bg.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
    this.container.add(bg)

    // Connection lines (below nodes)
    this.lineGfx = scene.add.graphics()
    this.container.add(this.lineGfx)

    // Title
    const title = this.createOverlayText(DESIGN_WIDTH / 2, 24, 'TALENT TREE', {
      fontSize: scale.fontSize(52),
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    })
    title.setOrigin(0.5)
    this.container.add(title)

    // Talent points display
    this.pointsText = this.createOverlayText(DESIGN_WIDTH / 2, 72, 'Points: 0', {
      fontSize: scale.fontSize(32),
      color: '#FFFFFF',
    })
    this.pointsText.setOrigin(0.5)
    this.container.add(this.pointsText)

    // Owned skills layer (rebuilt on state change)
    const ownedSkillLayer = scene.add.container(0, 0)
    this.container.add(ownedSkillLayer)

    // Skill slot panel (delegated)
    this.skillSlotPanel = new SkillSlotPanel(scene, scale, cameraZoom, this.container, ownedSkillLayer, {
      onAssignSkillSlot: callbacks.onAssignSkillSlot,
      onSwapSkillSlots: callbacks.onSwapSkillSlots,
      onUnequipSkillSlot: callbacks.onUnequipSkillSlot,
    })

    // Close hint
    const hint = this.createOverlayText(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 18, 'TAB to close', {
      fontSize: scale.fontSize(22),
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
      fontSize: scale.fontSize(36),
      color: '#FFD700',
      fontStyle: 'bold',
    })
    this.tooltipContainer.add(this.tooltipName)

    this.tooltipDesc = this.createOverlayText(0, 0, '', {
      fontSize: scale.fontSize(30),
      color: '#CCCCCC',
      wordWrap: { width: 340 },
    })
    this.tooltipContainer.add(this.tooltipDesc)

    this.tooltipCost = this.createOverlayText(0, 0, '', {
      fontSize: scale.fontSize(30),
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
    this.skillSlotPanel.build()
  }

  toggle(): void {
    this.visible = !this.visible
    this.container.setVisible(this.visible)
    if (!this.visible) {
      this.skillSlotPanel.clearSelection()
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
    this.skillSlotPanel.update(heroState)
  }

  destroy(): void {
    this.skillSlotPanel.destroy()
    this.container.destroy()
    this.nodeGfxMap.clear()
    this.nodeElementMap.clear()
  }

  // ---------- Helpers ----------

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

    const cx = DESIGN_WIDTH / 2
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

    const name = this.createOverlayText(0, NODE_RADIUS + 8, node.name, {
      fontSize: createUiScale(this.cameraZoom).fontSize(22),
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
    const fill = state === 'acquired' ? COLORS.acquired
      : state === 'available' ? COLORS.available : COLORS.locked
    const border = state === 'acquired' ? COLORS.borderAcquired
      : state === 'available' ? COLORS.borderAvailable : COLORS.borderLocked

    gfx.fillStyle(fill, 0.85)
    drawHexPath(gfx, 0, 0, NODE_RADIUS)
    gfx.fillPath()
    gfx.lineStyle(2, border, 1)
    drawHexPath(gfx, 0, 0, NODE_RADIUS)
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

    let tx = nodeX + NODE_RADIUS + 14
    let ty = nodeY - tooltipH / 2
    if (tx + tooltipW > DESIGN_WIDTH - 10) tx = nodeX - NODE_RADIUS - tooltipW - 14
    if (ty < 10) ty = 10
    if (ty + tooltipH > DESIGN_HEIGHT - 10) ty = DESIGN_HEIGHT - tooltipH - 10

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

    // Delegate slot/owned-skill hits to panel
    if (this.skillSlotPanel.handlePointerDown(localX, localY)) return

    // Click on background — clear selection
    this.skillSlotPanel.clearSelection()
  }

  handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.visible) return
    const localX = pointer.x / this.cameraZoom
    const localY = pointer.y / this.cameraZoom

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
}
