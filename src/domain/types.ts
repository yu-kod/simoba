export interface Position {
  readonly x: number
  readonly y: number
}

export type Team = 'blue' | 'red'

export type HeroType = 'BLADE' | 'BOLT' | 'AURA'

export interface EntityState {
  readonly id: string
  readonly position: Position
  readonly team: Team
}
