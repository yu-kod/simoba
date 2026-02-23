import type { Position } from '@/domain/types'

export type SkillSlot = 'Q' | 'E' | 'R'
export type CastMode = 'quick' | 'normal'

export type TargetingState =
  | { readonly phase: 'idle' }
  | {
      readonly phase: 'targeting'
      readonly skill: SkillSlot
      readonly mode: CastMode
    }
  | {
      readonly phase: 'fired'
      readonly skill: SkillSlot
      readonly target: Position
    }
  | { readonly phase: 'cancelled' }

export interface WASDKeys {
  readonly w: boolean
  readonly a: boolean
  readonly s: boolean
  readonly d: boolean
}

export interface InputState {
  readonly movement: Position
  readonly aimDirection: Position
  readonly aimWorldPosition: Position
  readonly attack: boolean
  readonly targeting: TargetingState
  readonly dodge: boolean
}

export function createDefaultInputState(): InputState {
  return {
    movement: { x: 0, y: 0 },
    aimDirection: { x: 0, y: 0 },
    aimWorldPosition: { x: 0, y: 0 },
    attack: false,
    targeting: { phase: 'idle' },
    dodge: false,
  }
}
