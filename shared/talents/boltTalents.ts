import type { TalentTreeDefinition } from './types'

export const BOLT_TALENT_TREE: TalentTreeDefinition = {
  heroType: 'BOLT',
  nodes: [
    // =========================================================================
    // Depth 0 — Root (2 nodes)
    // =========================================================================
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

    // =========================================================================
    // Depth 1 — Early branches (4 nodes)
    // =========================================================================
    // Mobility branch (from swift)
    {
      id: 'bolt-trap',
      name: 'Trap',
      description: 'Unlock Trap skill',
      cost: 1,
      prerequisites: ['bolt-swift'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-trap' }],
    },
    {
      id: 'bolt-fleet-foot',
      name: 'Fleet Foot',
      description: 'Movement Speed +10',
      cost: 1,
      prerequisites: ['bolt-swift'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 10, mode: 'flat' }],
    },
    // Marksman branch (from precision)
    {
      id: 'bolt-pierce-shot',
      name: 'Pierce Shot',
      description: 'Unlock Pierce Shot skill',
      cost: 1,
      prerequisites: ['bolt-precision'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-pierce-shot' }],
    },
    {
      id: 'bolt-keen-eye',
      name: 'Keen Eye',
      description: 'Attack Range +8%',
      cost: 1,
      prerequisites: ['bolt-precision'],
      effects: [{ type: 'stat_modifier', stat: 'attackRange', value: 8, mode: 'percent' }],
    },

    // =========================================================================
    // Depth 2 — Branching out (6 nodes)
    // =========================================================================
    // Mobility
    {
      id: 'bolt-dash',
      name: 'Dash',
      description: 'Unlock Dash skill',
      cost: 2,
      prerequisites: ['bolt-fleet-foot'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-dash' }],
    },
    {
      id: 'bolt-snare-trap',
      name: 'Snare Trap',
      description: 'Unlock Snare skill',
      cost: 1,
      prerequisites: ['bolt-trap'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-snare' }],
    },
    // Marksman
    {
      id: 'bolt-sniper',
      name: 'Sniper',
      description: 'Attack Range +15%',
      cost: 1,
      prerequisites: ['bolt-pierce-shot'],
      effects: [{ type: 'stat_modifier', stat: 'attackRange', value: 15, mode: 'percent' }],
    },
    {
      id: 'bolt-rapid-fire',
      name: 'Rapid Fire',
      description: 'Attack Speed +10%',
      cost: 1,
      prerequisites: ['bolt-keen-eye'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 10, mode: 'percent' }],
    },
    // Utility (converges from both roots)
    {
      id: 'bolt-survival-instinct',
      name: 'Survival Instinct',
      description: 'Max HP +60',
      cost: 1,
      prerequisites: ['bolt-swift'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 60, mode: 'flat' }],
    },
    {
      id: 'bolt-steady-aim',
      name: 'Steady Aim',
      description: 'Attack Damage +5%',
      cost: 1,
      prerequisites: ['bolt-precision'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 5, mode: 'percent' }],
    },

    // =========================================================================
    // Depth 3 — Mid tree (8 nodes)
    // =========================================================================
    // Mobility
    {
      id: 'bolt-evasion',
      name: 'Evasion',
      description: 'Movement Speed +8%',
      cost: 1,
      prerequisites: ['bolt-dash'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 8, mode: 'percent' }],
    },
    {
      id: 'bolt-windwalk',
      name: 'Windwalk',
      description: 'Unlock Windwalk passive',
      cost: 2,
      prerequisites: ['bolt-dash'],
      effects: [{ type: 'unlock_passive', passiveId: 'bolt-windwalk' }],
    },
    {
      id: 'bolt-wide-net',
      name: 'Wide Net',
      description: 'Trap area +25%',
      cost: 1,
      prerequisites: ['bolt-snare-trap'],
      effects: [{ type: 'modify_basic_attack', property: 'trapRadius', value: 25 }],
    },
    // Marksman
    {
      id: 'bolt-longbow',
      name: 'Longbow',
      description: 'Attack Range +10%',
      cost: 1,
      prerequisites: ['bolt-sniper'],
      effects: [{ type: 'stat_modifier', stat: 'attackRange', value: 10, mode: 'percent' }],
    },
    {
      id: 'bolt-barrage',
      name: 'Barrage',
      description: 'Unlock Barrage skill',
      cost: 2,
      prerequisites: ['bolt-rapid-fire'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-barrage' }],
    },
    {
      id: 'bolt-sharp-tips',
      name: 'Sharp Tips',
      description: 'Attack Damage +10',
      cost: 1,
      prerequisites: ['bolt-steady-aim'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 10, mode: 'flat' }],
    },
    // Utility
    {
      id: 'bolt-thick-skin',
      name: 'Thick Skin',
      description: 'Max HP +40',
      cost: 1,
      prerequisites: ['bolt-survival-instinct'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 40, mode: 'flat' }],
    },
    {
      id: 'bolt-quickdraw',
      name: 'Quickdraw',
      description: 'Unlock Quickdraw passive',
      cost: 2,
      prerequisites: ['bolt-rapid-fire', 'bolt-steady-aim'],
      effects: [{ type: 'unlock_passive', passiveId: 'bolt-quickdraw' }],
    },

    // =========================================================================
    // Depth 4 — Expanding fan (9 nodes)
    // =========================================================================
    // Mobility
    {
      id: 'bolt-afterburn',
      name: 'Afterburn',
      description: 'Movement Speed +5%',
      cost: 1,
      prerequisites: ['bolt-evasion'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 5, mode: 'percent' }],
    },
    {
      id: 'bolt-slippery',
      name: 'Slippery',
      description: 'Speed +12 flat',
      cost: 1,
      prerequisites: ['bolt-windwalk'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 12, mode: 'flat' }],
    },
    {
      id: 'bolt-double-trap',
      name: 'Double Trap',
      description: 'Extra trap charge',
      cost: 1,
      prerequisites: ['bolt-wide-net'],
      effects: [{ type: 'modify_basic_attack', property: 'trapCharges', value: 2 }],
    },
    // Marksman
    {
      id: 'bolt-eagle-eye',
      name: 'Eagle Eye',
      description: 'Unlock Eagle Eye passive',
      cost: 2,
      prerequisites: ['bolt-longbow'],
      effects: [{ type: 'unlock_passive', passiveId: 'bolt-eagle-eye' }],
    },
    {
      id: 'bolt-volley',
      name: 'Volley',
      description: 'Attack Speed +15%',
      cost: 1,
      prerequisites: ['bolt-barrage'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 15, mode: 'percent' }],
    },
    {
      id: 'bolt-armor-break',
      name: 'Armor Break',
      description: 'Pierce projectile debuffs',
      cost: 2,
      prerequisites: ['bolt-sharp-tips', 'bolt-sniper'],
      effects: [{ type: 'modify_basic_attack', property: 'armorReduction', value: 10 }],
    },
    // Utility
    {
      id: 'bolt-ranger-poise',
      name: 'Ranger Poise',
      description: 'Max HP +5%',
      cost: 1,
      prerequisites: ['bolt-thick-skin'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 5, mode: 'percent' }],
    },
    {
      id: 'bolt-fast-hands',
      name: 'Fast Hands',
      description: 'Attack Speed +8%',
      cost: 1,
      prerequisites: ['bolt-quickdraw'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 8, mode: 'percent' }],
    },
    {
      id: 'bolt-ricochet',
      name: 'Ricochet',
      description: 'Unlock Ricochet skill',
      cost: 2,
      prerequisites: ['bolt-quickdraw'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-ricochet' }],
    },

    // =========================================================================
    // Depth 5 — Wide top (9 nodes)
    // =========================================================================
    // Mobility
    {
      id: 'bolt-ghost-step',
      name: 'Ghost Step',
      description: 'Movement Speed +6%',
      cost: 1,
      prerequisites: ['bolt-afterburn'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 6, mode: 'percent' }],
    },
    {
      id: 'bolt-wind-runner',
      name: 'Wind Runner',
      description: 'Speed +10%',
      cost: 1,
      prerequisites: ['bolt-slippery'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 10, mode: 'percent' }],
    },
    {
      id: 'bolt-minefield',
      name: 'Minefield',
      description: 'Trap damage +20%',
      cost: 1,
      prerequisites: ['bolt-double-trap'],
      effects: [{ type: 'modify_basic_attack', property: 'trapDamage', value: 20 }],
    },
    // Marksman
    {
      id: 'bolt-dead-eye',
      name: 'Dead Eye',
      description: 'Attack Damage +8%',
      cost: 1,
      prerequisites: ['bolt-eagle-eye'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 8, mode: 'percent' }],
    },
    {
      id: 'bolt-snipe',
      name: 'Snipe',
      description: 'Unlock Snipe skill — sniper stance',
      cost: 2,
      prerequisites: ['bolt-eagle-eye'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-snipe' }],
    },
    {
      id: 'bolt-rain',
      name: 'Arrow Rain',
      description: 'Unlock Rain skill',
      cost: 2,
      prerequisites: ['bolt-volley'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-rain' }],
    },
    {
      id: 'bolt-cripple',
      name: 'Cripple',
      description: 'Attacks slow enemies',
      cost: 1,
      prerequisites: ['bolt-armor-break'],
      effects: [{ type: 'modify_basic_attack', property: 'slowOnHit', value: true }],
    },
    // Utility
    {
      id: 'bolt-endurance',
      name: 'Endurance',
      description: 'Max HP +80',
      cost: 1,
      prerequisites: ['bolt-ranger-poise'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 80, mode: 'flat' }],
    },
    {
      id: 'bolt-chain-shot',
      name: 'Chain Shot',
      description: 'Ricochet bounces +1',
      cost: 1,
      prerequisites: ['bolt-ricochet'],
      effects: [{ type: 'modify_basic_attack', property: 'ricochetBounces', value: 1 }],
    },
    {
      id: 'bolt-headshot',
      name: 'Headshot',
      description: 'Unlock Headshot passive',
      cost: 2,
      prerequisites: ['bolt-fast-hands', 'bolt-eagle-eye'],
      effects: [{ type: 'unlock_passive', passiveId: 'bolt-headshot' }],
    },

    // =========================================================================
    // Depth 6 — Near capstones (7 nodes)
    // =========================================================================
    // Mobility
    {
      id: 'bolt-phantom-dash',
      name: 'Phantom Dash',
      description: 'Dash cooldown -30%',
      cost: 2,
      prerequisites: ['bolt-ghost-step', 'bolt-wind-runner'],
      effects: [{ type: 'modify_basic_attack', property: 'dashCooldown', value: -30 }],
    },
    {
      id: 'bolt-zone-denial',
      name: 'Zone Denial',
      description: 'Trap slow duration +50%',
      cost: 2,
      prerequisites: ['bolt-minefield'],
      effects: [{ type: 'modify_basic_attack', property: 'trapSlowDuration', value: 50 }],
    },
    // Marksman
    {
      id: 'bolt-overwatch',
      name: 'Overwatch',
      description: 'Unlock Overwatch skill',
      cost: 2,
      prerequisites: ['bolt-dead-eye', 'bolt-rain'],
      effects: [{ type: 'grant_skill', skillId: 'bolt-overwatch' }],
    },
    {
      id: 'bolt-piercing-rain',
      name: 'Piercing Rain',
      description: 'Rain ignores armor',
      cost: 2,
      prerequisites: ['bolt-rain', 'bolt-cripple'],
      effects: [{ type: 'modify_basic_attack', property: 'rainPierces', value: true }],
    },
    // Utility
    {
      id: 'bolt-vital-strike',
      name: 'Vital Strike',
      description: 'Attack Damage +12%',
      cost: 2,
      prerequisites: ['bolt-headshot'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 12, mode: 'percent' }],
    },
    {
      id: 'bolt-scatter-volley',
      name: 'Scatter Volley',
      description: 'Chain Shot area +30%',
      cost: 2,
      prerequisites: ['bolt-chain-shot'],
      effects: [{ type: 'modify_basic_attack', property: 'chainShotArea', value: 30 }],
    },
    {
      id: 'bolt-fortitude',
      name: 'Fortitude',
      description: 'Max HP +10%',
      cost: 2,
      prerequisites: ['bolt-endurance'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 10, mode: 'percent' }],
    },

    // =========================================================================
    // Depth 7 — Capstones (5 nodes)
    // =========================================================================
    {
      id: 'bolt-gale-force',
      name: 'Gale Force',
      description: 'Speed & Range +10%',
      cost: 3,
      prerequisites: ['bolt-phantom-dash', 'bolt-zone-denial'],
      effects: [
        { type: 'stat_modifier', stat: 'speed', value: 10, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackRange', value: 10, mode: 'percent' },
      ],
    },
    {
      id: 'bolt-deadeye-master',
      name: 'Deadeye Master',
      description: 'Damage & Speed +15%',
      cost: 3,
      prerequisites: ['bolt-overwatch'],
      effects: [
        { type: 'stat_modifier', stat: 'attackDamage', value: 15, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackSpeed', value: 15, mode: 'percent' },
      ],
    },
    {
      id: 'bolt-storm-archer',
      name: 'Storm Archer',
      description: 'Rain area & damage +25%',
      cost: 3,
      prerequisites: ['bolt-piercing-rain'],
      effects: [
        { type: 'modify_basic_attack', property: 'rainArea', value: 25 },
        { type: 'modify_basic_attack', property: 'rainDamage', value: 25 },
      ],
    },
    {
      id: 'bolt-apex-predator',
      name: 'Apex Predator',
      description: 'All attacks crit chance',
      cost: 3,
      prerequisites: ['bolt-vital-strike', 'bolt-scatter-volley'],
      effects: [{ type: 'modify_basic_attack', property: 'critChance', value: 15 }],
    },
    {
      id: 'bolt-iron-ranger',
      name: 'Iron Ranger',
      description: 'HP +15%, Damage +10%',
      cost: 3,
      prerequisites: ['bolt-fortitude'],
      effects: [
        { type: 'stat_modifier', stat: 'maxHp', value: 15, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackDamage', value: 10, mode: 'percent' },
      ],
    },
  ],
}
