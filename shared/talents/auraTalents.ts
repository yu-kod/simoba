import type { TalentTreeDefinition } from './types'

export const AURA_TALENT_TREE: TalentTreeDefinition = {
  heroType: 'AURA',
  nodes: [
    {
      id: 'aura-vitality',
      name: 'Vitality',
      description: 'Max HP +60',
      cost: 1,
      prerequisites: [],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 60, mode: 'flat' }],
    },
    {
      id: 'aura-focus',
      name: 'Focus',
      description: 'Attack Speed +10%',
      cost: 1,
      prerequisites: [],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 10, mode: 'percent' }],
    },
    {
      id: 'aura-heal',
      name: 'Heal',
      description: 'Unlock Heal skill — restore ally HP',
      cost: 1,
      prerequisites: ['aura-vitality'],
      effects: [{ type: 'grant_skill', skillId: 'aura-heal' }],
    },
    {
      id: 'aura-shield',
      name: 'Shield',
      description: 'Unlock Shield skill — grant temporary shield',
      cost: 1,
      prerequisites: ['aura-focus'],
      effects: [{ type: 'grant_skill', skillId: 'aura-shield' }],
    },
    {
      id: 'aura-resilience',
      name: 'Resilience',
      description: 'Max HP +10%',
      cost: 1,
      prerequisites: ['aura-heal'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 10, mode: 'percent' }],
    },
  ],
}
