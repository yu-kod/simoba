import type { TalentTreeDefinition } from './types'

export const BOLT_TALENT_TREE: TalentTreeDefinition = {
  heroType: 'BOLT',
  nodes: [
    {
      id: 'bolt-swift',
      name: 'Swift',
      description: 'Movement Speed +15',
      cost: 1,
      prerequisites: [],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 15, mode: 'flat' }],
    },
    {
      id: 'bolt-precision',
      name: 'Precision',
      description: 'Attack Damage +8',
      cost: 1,
      prerequisites: [],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 8, mode: 'flat' }],
    },
    {
      id: 'bolt-pierce-shot',
      name: 'Pierce Shot',
      description: 'Unlock Pierce Shot skill — piercing projectile',
      cost: 1,
      prerequisites: ['bolt-precision'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-pierce-shot' }],
    },
    {
      id: 'bolt-trap',
      name: 'Trap',
      description: 'Unlock Trap skill — place a ground trap',
      cost: 1,
      prerequisites: ['bolt-swift'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-trap' }],
    },
    {
      id: 'bolt-sniper',
      name: 'Sniper',
      description: 'Attack Range +15%',
      cost: 1,
      prerequisites: ['bolt-pierce-shot'],
      effects: [{ type: 'stat_modifier', stat: 'attackRange', value: 15, mode: 'percent' }],
    },
  ],
}
