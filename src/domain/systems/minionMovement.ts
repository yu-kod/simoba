import type { MinionState } from '@shared/entities/Minion'

export function updateMinionMovement(
  minion: MinionState,
  deltaSeconds: number,
): MinionState {
  if (minion.dead || minion.attackTargetId !== null) {
    return minion
  }

  const direction = minion.team === 'blue' ? 1 : -1
  const dx = minion.stats.speed * deltaSeconds * direction

  return {
    ...minion,
    position: {
      x: minion.position.x + dx,
      y: minion.position.y,
    },
    facing: direction === 1 ? 0 : Math.PI,
  }
}
