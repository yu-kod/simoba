/** Slot size in intended (pre-zoom) pixels */
const SLOT_SIZE = 56
/** Gap between slots */
const SLOT_GAP = 6
/** Level badge diameter */
const BADGE_SIZE = 44
/** Gap between badge and first slot */
const BADGE_GAP = 8
/** HP bar height */
const HP_BAR_HEIGHT = 14
/** Gap between skill bar row and HP bar */
const HP_GAP = 6
/** Padding inside the panel background */
const PANEL_PADDING = 8
/** Margin from bottom edge of screen */
const BOTTOM_MARGIN = 16

export interface SlotLayout {
  readonly x: number
  readonly y: number
  readonly size: number
}

export interface HudLayout {
  /** Panel background rect (relative to screen center-bottom) */
  readonly panelX: number
  readonly panelY: number
  readonly panelWidth: number
  readonly panelHeight: number

  /** Level badge center position */
  readonly badgeX: number
  readonly badgeY: number
  readonly badgeSize: number

  /** Skill slot positions (top-left of each slot) */
  readonly slots: readonly SlotLayout[]

  /** HP bar position */
  readonly hpBarX: number
  readonly hpBarY: number
  readonly hpBarWidth: number
  readonly hpBarHeight: number
}

/**
 * Compute HUD element positions for the given screen size and slot count.
 * All values are in intended (pre-zoom) pixels, centered horizontally.
 */
export function computeHudLayout(
  screenWidth: number,
  screenHeight: number,
  slotCount: number
): HudLayout {
  // Skill bar row width: badge + slots
  const slotsWidth = slotCount * SLOT_SIZE + Math.max(0, slotCount - 1) * SLOT_GAP
  const rowWidth = BADGE_SIZE + BADGE_GAP + slotsWidth

  // Total panel dimensions
  const panelWidth = rowWidth + PANEL_PADDING * 2
  const skillRowHeight = SLOT_SIZE
  const panelHeight =
    PANEL_PADDING + skillRowHeight + HP_GAP + HP_BAR_HEIGHT + PANEL_PADDING

  // Panel position (centered at bottom)
  const panelX = (screenWidth - panelWidth) / 2
  const panelY = screenHeight - panelHeight - BOTTOM_MARGIN

  // Content origin (inside panel padding)
  const contentX = panelX + PANEL_PADDING
  const contentY = panelY + PANEL_PADDING

  // Level badge (vertically centered in skill row)
  const badgeX = contentX + BADGE_SIZE / 2
  const badgeY = contentY + skillRowHeight / 2

  // Slots
  const slotsStartX = contentX + BADGE_SIZE + BADGE_GAP
  const slots: SlotLayout[] = []
  for (let i = 0; i < slotCount; i++) {
    slots.push({
      x: slotsStartX + i * (SLOT_SIZE + SLOT_GAP),
      y: contentY,
      size: SLOT_SIZE,
    })
  }

  // HP bar (full panel content width, below skill row)
  const hpBarY = contentY + skillRowHeight + HP_GAP
  const hpBarWidth = rowWidth
  const hpBarX = contentX

  return {
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    badgeX,
    badgeY,
    badgeSize: BADGE_SIZE,
    slots,
    hpBarX,
    hpBarY,
    hpBarWidth,
    hpBarHeight: HP_BAR_HEIGHT,
  }
}
