import type { Position } from '@/domain/types'
import type {
  TargetingState,
  SkillSlot,
  CastMode,
} from '@/domain/input/InputState'

export type TargetingAction =
  | {
      readonly type: 'SKILL_KEY_DOWN'
      readonly skill: SkillSlot
      readonly mode: CastMode
    }
  | {
      readonly type: 'SKILL_KEY_UP'
      readonly skill: SkillSlot
      readonly mouseWorldPosition: Position
    }
  | {
      readonly type: 'LEFT_CLICK'
      readonly mouseWorldPosition: Position
    }
  | { readonly type: 'RIGHT_CLICK' }
  | { readonly type: 'RESET' }

export function updateTargeting(
  state: TargetingState,
  action: TargetingAction
): TargetingState {
  switch (action.type) {
    case 'SKILL_KEY_DOWN':
      return {
        phase: 'targeting',
        skill: action.skill,
        mode: action.mode,
      }

    case 'SKILL_KEY_UP':
      if (
        state.phase === 'targeting' &&
        state.mode === 'quick' &&
        state.skill === action.skill
      ) {
        return {
          phase: 'fired',
          skill: state.skill,
          target: action.mouseWorldPosition,
        }
      }
      return state

    case 'LEFT_CLICK':
      if (state.phase === 'targeting' && state.mode === 'normal') {
        return {
          phase: 'fired',
          skill: state.skill,
          target: action.mouseWorldPosition,
        }
      }
      return state

    case 'RIGHT_CLICK':
      if (state.phase === 'targeting') {
        return { phase: 'cancelled' }
      }
      return state

    case 'RESET':
      if (state.phase === 'fired' || state.phase === 'cancelled') {
        return { phase: 'idle' }
      }
      return state
  }
}
