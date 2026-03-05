import type { HeroType } from '@shared/types'
import type { TalentTreeDefinition } from './types'
import { BLADE_TALENT_TREE } from './bladeTalents'
import { BOLT_TALENT_TREE } from './boltTalents'
import { AURA_TALENT_TREE } from './auraTalents'

export const TALENT_TREES: Record<HeroType, TalentTreeDefinition> = {
  BLADE: BLADE_TALENT_TREE,
  BOLT: BOLT_TALENT_TREE,
  AURA: AURA_TALENT_TREE,
}

export type { TalentEffect, TalentNode, TalentTreeDefinition, SkillSlot } from './types'
export type {
  StatModifierEffect,
  GrantSkillEffect,
  ModifyBasicAttackEffect,
  UnlockPassiveEffect,
} from './types'
