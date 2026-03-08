export interface MatchEndDisplay {
  resultText: string
  resultColor: string
  subText: string | null
}

/**
 * Determine match end overlay text based on win/loss and reason.
 * Pure function — extracted for testability.
 */
export function getMatchEndDisplay(isWinner: boolean, matchEndReason: string): MatchEndDisplay {
  // 2v2 向け: チームメイトが切断し自分が残った場合の表示。
  // 現在の 1v1 では切断側がルームを抜けるため到達しない。
  if (matchEndReason === 'player_disconnected' && !isWinner) {
    return {
      resultText: 'DISCONNECTED',
      resultColor: '#AAAAAA',
      subText: '味方が切断したため終了',
    }
  }
  if (isWinner) {
    return { resultText: 'VICTORY', resultColor: '#FFD700', subText: null }
  }
  return { resultText: 'DEFEAT', resultColor: '#FF4444', subText: null }
}
