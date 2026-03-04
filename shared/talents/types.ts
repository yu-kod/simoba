import type { HeroType, StatBlock } from '@shared/types'

// ---------------------------------------------------------------------------
// Talent Effect types (tagged union)
// ---------------------------------------------------------------------------

export interface StatModifierEffect {
  readonly type: 'stat_modifier'
  readonly stat: keyof StatBlock
  readonly value: number
  readonly mode: 'flat' | 'percent'
}

export interface GrantSkillEffect {
  readonly type: 'grant_skill'
  readonly skillId: string
}

export interface ModifyBasicAttackEffect {
  readonly type: 'modify_basic_attack'
  readonly property: string
  readonly value: unknown
}

export interface UnlockPassiveEffect {
  readonly type: 'unlock_passive'
  readonly passiveId: string
}

export type TalentEffect =
  | StatModifierEffect
  | GrantSkillEffect
  | ModifyBasicAttackEffect
  | UnlockPassiveEffect

// ---------------------------------------------------------------------------
// Talent Node & Tree
// ---------------------------------------------------------------------------

export interface TalentNode {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly cost: number
  readonly prerequisites: readonly string[]
  readonly effects: readonly TalentEffect[]
}

export interface TalentTreeDefinition {
  readonly heroType: HeroType
  readonly nodes: readonly TalentNode[]
}

// ---------------------------------------------------------------------------
// Skill Slot
// ---------------------------------------------------------------------------

export type SkillSlot = 'Q' | 'E' | 'R'
