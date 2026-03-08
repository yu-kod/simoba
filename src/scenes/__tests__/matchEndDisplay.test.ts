import { describe, it, expect } from 'vitest'
import { getMatchEndDisplay } from '../matchEndDisplay'

describe('getMatchEndDisplay', () => {
  it('should show VICTORY for tower_destroyed when winner', () => {
    const result = getMatchEndDisplay(true, 'tower_destroyed')
    expect(result.resultText).toBe('VICTORY')
    expect(result.resultColor).toBe('#FFD700')
    expect(result.subText).toBeNull()
  })

  it('should show DEFEAT for tower_destroyed when loser', () => {
    const result = getMatchEndDisplay(false, 'tower_destroyed')
    expect(result.resultText).toBe('DEFEAT')
    expect(result.resultColor).toBe('#FF4444')
    expect(result.subText).toBeNull()
  })

  it('should show VICTORY for player_disconnected when winner', () => {
    const result = getMatchEndDisplay(true, 'player_disconnected')
    expect(result.resultText).toBe('VICTORY')
    expect(result.resultColor).toBe('#FFD700')
    expect(result.subText).toBeNull()
  })

  it('should show DISCONNECTED with subtext for player_disconnected when loser', () => {
    const result = getMatchEndDisplay(false, 'player_disconnected')
    expect(result.resultText).toBe('DISCONNECTED')
    expect(result.resultColor).toBe('#AAAAAA')
    expect(result.subText).toBe('味方が切断したため終了')
  })
})
