export type SkillSlotType = 'active' | 'passive' | 'empty'

export interface SkillSlotConfig {
  readonly type: SkillSlotType
  /** Key label for active skills ('Q', 'E', 'R', etc.) */
  readonly key?: string
  /** Display name */
  readonly name: string
  /** Geometric icon shape identifier */
  readonly iconShape?: string
  /** Max cooldown in seconds (active only) */
  readonly cooldownMax?: number
}

/** Debug slot configuration for verifying all 3 slot states before talent tree is implemented */
export const DEBUG_SKILL_SLOTS: readonly SkillSlotConfig[] = [
  { type: 'active', key: 'Q', name: 'Skill 1', iconShape: 'diamond', cooldownMax: 8 },
  { type: 'passive', name: 'Passive 1', iconShape: 'circle' },
  { type: 'empty', name: '' },
]
