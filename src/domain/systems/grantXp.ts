import type { HeroState } from '@shared/entities/Hero'

export function grantXp(hero: HeroState, amount: number): HeroState {
  return {
    ...hero,
    xp: hero.xp + amount,
  }
}
