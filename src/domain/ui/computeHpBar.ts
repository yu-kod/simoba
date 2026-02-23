const HP_PER_TICK = 250

export interface HpBarLayout {
  /** Width in pixels of the current HP portion */
  readonly currentHpWidth: number
  /** X positions (relative to bar left edge) of 250HP tick marks */
  readonly tickPositions: readonly number[]
}

/**
 * Compute the pixel layout of an HP bar.
 * Pure function — no side effects.
 */
export function computeHpBar(
  hp: number,
  maxHp: number,
  barWidth: number
): HpBarLayout {
  if (maxHp <= 0) {
    return { currentHpWidth: 0, tickPositions: [] }
  }

  const ratio = Math.max(0, Math.min(1, hp / maxHp))
  const currentHpWidth = ratio * barWidth

  const tickPositions: number[] = []
  for (let i = 1; i * HP_PER_TICK < maxHp; i++) {
    tickPositions.push((i * HP_PER_TICK / maxHp) * barWidth)
  }

  return { currentHpWidth, tickPositions }
}
