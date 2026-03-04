import type { TalentTreeDefinition } from './types'

export const BLADE_TALENT_TREE: TalentTreeDefinition = {
  heroType: 'BLADE',
  nodes: [
    {
      id: 'blade-toughness',
      name: 'Toughness',
      description: 'Max HP +80',
      cost: 1,
      prerequisites: [],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 80, mode: 'flat' }],
    },
    {
      id: 'blade-sharp-edge',
      name: 'Sharp Edge',
      description: 'Attack Damage +12',
      cost: 1,
      prerequisites: [],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 12, mode: 'flat' }],
    },
    {
      id: 'blade-charge',
      name: 'Charge',
      description: 'Unlock Charge skill — dash forward',
      cost: 1,
      prerequisites: ['blade-toughness'],
      effects: [{ type: 'grant_skill', skillId: 'blade-charge' }],
    },
    {
      id: 'blade-cleave',
      name: 'Cleave',
      description: 'Unlock Cleave skill — AoE slash',
      cost: 1,
      prerequisites: ['blade-sharp-edge'],
      effects: [{ type: 'grant_skill', skillId: 'blade-cleave' }],
    },
    {
      id: 'blade-berserker',
      name: 'Berserker',
      description: 'Attack Speed +20%',
      cost: 1,
      prerequisites: ['blade-charge', 'blade-cleave'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 20, mode: 'percent' }],
    },
  ],
}
