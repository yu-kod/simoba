import type { TalentTreeDefinition } from './types'

export const AURA_TALENT_TREE: TalentTreeDefinition = {
  heroType: 'AURA',
  nodes: [
    // =========================================================================
    // Depth 0 — Root (2 nodes)
    // =========================================================================
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

    // =========================================================================
    // Depth 1 — First branch (4 nodes)
    // =========================================================================
    {
      id: 'aura-heal',
      name: 'Heal',
      description: 'Unlock Heal skill',
      cost: 1,
      prerequisites: ['aura-vitality'],
      effects: [{ type: 'grant_skill', skillId: 'aura-heal' }],
    },
    {
      id: 'aura-resilience',
      name: 'Resilience',
      description: 'Max HP +10%',
      cost: 1,
      prerequisites: ['aura-vitality'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 10, mode: 'percent' }],
    },
    {
      id: 'aura-shield',
      name: 'Shield',
      description: 'Unlock Shield skill',
      cost: 1,
      prerequisites: ['aura-focus'],
      effects: [{ type: 'grant_skill', skillId: 'aura-shield' }],
    },
    {
      id: 'aura-swift-mind',
      name: 'Swift Mind',
      description: 'Movement Speed +12',
      cost: 1,
      prerequisites: ['aura-focus'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 12, mode: 'flat' }],
    },

    // =========================================================================
    // Depth 2 — Healer / Enchanter expand (6 nodes)
    // =========================================================================
    {
      id: 'aura-mending-touch',
      name: 'Mending Touch',
      description: 'Max HP +40',
      cost: 1,
      prerequisites: ['aura-heal'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 40, mode: 'flat' }],
    },
    {
      id: 'aura-regen',
      name: 'Regeneration',
      description: 'Unlock passive HP regen',
      cost: 1,
      prerequisites: ['aura-heal'],
      effects: [{ type: 'unlock_passive', passiveId: 'aura-regen' }],
    },
    {
      id: 'aura-fortify',
      name: 'Fortify',
      description: 'Max HP +80',
      cost: 1,
      prerequisites: ['aura-resilience'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 80, mode: 'flat' }],
    },
    {
      id: 'aura-barrier',
      name: 'Barrier',
      description: 'Unlock Barrier skill',
      cost: 2,
      prerequisites: ['aura-shield'],
      effects: [{ type: 'grant_skill', skillId: 'aura-barrier' }],
    },
    {
      id: 'aura-empower',
      name: 'Empower',
      description: 'Attack Damage +10',
      cost: 1,
      prerequisites: ['aura-shield'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 10, mode: 'flat' }],
    },
    {
      id: 'aura-haste',
      name: 'Haste',
      description: 'Unlock Haste skill',
      cost: 2,
      prerequisites: ['aura-swift-mind'],
      effects: [{ type: 'grant_skill', skillId: 'aura-haste' }],
    },

    // =========================================================================
    // Depth 3 — Healer / Enchanter / Hybrid begin (7 nodes)
    // =========================================================================
    {
      id: 'aura-purify',
      name: 'Purify',
      description: 'Unlock Purify skill',
      cost: 2,
      prerequisites: ['aura-mending-touch'],
      effects: [{ type: 'grant_skill', skillId: 'aura-purify' }],
    },
    {
      id: 'aura-inner-peace',
      name: 'Inner Peace',
      description: 'Max HP +8%',
      cost: 1,
      prerequisites: ['aura-regen'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 8, mode: 'percent' }],
    },
    {
      id: 'aura-endurance',
      name: 'Endurance',
      description: 'Max HP +6%',
      cost: 1,
      prerequisites: ['aura-fortify'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 6, mode: 'percent' }],
    },
    {
      id: 'aura-aegis',
      name: 'Aegis',
      description: 'Max HP +50',
      cost: 1,
      prerequisites: ['aura-barrier'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 50, mode: 'flat' }],
    },
    {
      id: 'aura-inspiration',
      name: 'Inspiration',
      description: 'Unlock ally buff passive',
      cost: 2,
      prerequisites: ['aura-empower'],
      effects: [{ type: 'unlock_passive', passiveId: 'aura-inspiration' }],
    },
    {
      id: 'aura-quickstep',
      name: 'Quickstep',
      description: 'Movement Speed +8%',
      cost: 1,
      prerequisites: ['aura-haste'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 8, mode: 'percent' }],
    },
    {
      id: 'aura-shared-vigor',
      name: 'Shared Vigor',
      description: 'Attack Speed +8%',
      cost: 1,
      prerequisites: ['aura-fortify', 'aura-barrier'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 8, mode: 'percent' }],
    },

    // =========================================================================
    // Depth 4 — Mid tree (9 nodes)
    // =========================================================================
    {
      id: 'aura-deep-heal',
      name: 'Deep Heal',
      description: 'Max HP +100',
      cost: 2,
      prerequisites: ['aura-purify'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 100, mode: 'flat' }],
    },
    {
      id: 'aura-soothing-aura',
      name: 'Soothing Aura',
      description: 'Attack on heal targets',
      cost: 1,
      prerequisites: ['aura-purify'],
      effects: [{ type: 'modify_basic_attack', property: 'healOnHit', value: true }],
    },
    {
      id: 'aura-serenity',
      name: 'Serenity',
      description: 'Movement Speed +10',
      cost: 1,
      prerequisites: ['aura-inner-peace'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 10, mode: 'flat' }],
    },
    {
      id: 'aura-ironwall',
      name: 'Iron Wall',
      description: 'Max HP +12%',
      cost: 2,
      prerequisites: ['aura-endurance'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 12, mode: 'percent' }],
    },
    {
      id: 'aura-guardian',
      name: 'Guardian',
      description: 'Attack Range +10%',
      cost: 1,
      prerequisites: ['aura-aegis'],
      effects: [{ type: 'stat_modifier', stat: 'attackRange', value: 10, mode: 'percent' }],
    },
    {
      id: 'aura-rally',
      name: 'Rally',
      description: 'Attack Damage +8',
      cost: 1,
      prerequisites: ['aura-inspiration'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 8, mode: 'flat' }],
    },
    {
      id: 'aura-wind-ward',
      name: 'Wind Ward',
      description: 'Movement Speed +6%',
      cost: 1,
      prerequisites: ['aura-quickstep'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 6, mode: 'percent' }],
    },
    {
      id: 'aura-harmony',
      name: 'Harmony',
      description: 'Unlock team sync passive',
      cost: 2,
      prerequisites: ['aura-shared-vigor'],
      effects: [{ type: 'unlock_passive', passiveId: 'aura-harmony' }],
    },
    {
      id: 'aura-sacrifice',
      name: 'Sacrifice',
      description: 'Unlock self-sacrifice passive',
      cost: 2,
      prerequisites: ['aura-shared-vigor'],
      effects: [{ type: 'unlock_passive', passiveId: 'aura-sacrifice' }],
    },

    // =========================================================================
    // Depth 5 — Upper tree (8 nodes)
    // =========================================================================
    {
      id: 'aura-miracle',
      name: 'Miracle',
      description: 'Max HP +60, Speed +8',
      cost: 2,
      prerequisites: ['aura-deep-heal'],
      effects: [
        { type: 'stat_modifier', stat: 'maxHp', value: 60, mode: 'flat' },
        { type: 'stat_modifier', stat: 'speed', value: 8, mode: 'flat' },
      ],
    },
    {
      id: 'aura-lifelink',
      name: 'Lifelink',
      description: 'Attacks restore HP',
      cost: 2,
      prerequisites: ['aura-soothing-aura', 'aura-serenity'],
      effects: [{ type: 'modify_basic_attack', property: 'lifeSteal', value: 5 }],
    },
    {
      id: 'aura-bastion',
      name: 'Bastion',
      description: 'Max HP +150',
      cost: 2,
      prerequisites: ['aura-ironwall'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 150, mode: 'flat' }],
    },
    {
      id: 'aura-holy-reach',
      name: 'Holy Reach',
      description: 'Attack Range +15%',
      cost: 1,
      prerequisites: ['aura-guardian'],
      effects: [{ type: 'stat_modifier', stat: 'attackRange', value: 15, mode: 'percent' }],
    },
    {
      id: 'aura-war-cry',
      name: 'War Cry',
      description: 'Attack Damage +15%',
      cost: 2,
      prerequisites: ['aura-rally'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 15, mode: 'percent' }],
    },
    {
      id: 'aura-gale-force',
      name: 'Gale Force',
      description: 'Movement Speed +10%',
      cost: 1,
      prerequisites: ['aura-wind-ward'],
      effects: [{ type: 'stat_modifier', stat: 'speed', value: 10, mode: 'percent' }],
    },
    {
      id: 'aura-unity',
      name: 'Unity',
      description: 'Attack Speed +12%',
      cost: 1,
      prerequisites: ['aura-harmony'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 12, mode: 'percent' }],
    },
    {
      id: 'aura-martyr',
      name: 'Martyr',
      description: 'Max HP +10%, Dmg +6',
      cost: 2,
      prerequisites: ['aura-sacrifice'],
      effects: [
        { type: 'stat_modifier', stat: 'maxHp', value: 10, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackDamage', value: 6, mode: 'flat' },
      ],
    },

    // =========================================================================
    // Depth 6 — Upper branches converge (8 nodes)
    // =========================================================================
    {
      id: 'aura-revive',
      name: 'Revive',
      description: 'Unlock Revive skill',
      cost: 3,
      prerequisites: ['aura-miracle'],
      effects: [{ type: 'grant_skill', skillId: 'aura-revive' }],
    },
    {
      id: 'aura-renewal',
      name: 'Renewal',
      description: 'Max HP +8%, Speed +5%',
      cost: 2,
      prerequisites: ['aura-lifelink'],
      effects: [
        { type: 'stat_modifier', stat: 'maxHp', value: 8, mode: 'percent' },
        { type: 'stat_modifier', stat: 'speed', value: 5, mode: 'percent' },
      ],
    },
    {
      id: 'aura-unbreakable',
      name: 'Unbreakable',
      description: 'Max HP +15%',
      cost: 2,
      prerequisites: ['aura-bastion'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 15, mode: 'percent' }],
    },
    {
      id: 'aura-nova',
      name: 'Nova',
      description: 'Unlock Nova skill',
      cost: 3,
      prerequisites: ['aura-holy-reach', 'aura-war-cry'],
      effects: [{ type: 'grant_skill', skillId: 'aura-nova' }],
    },
    {
      id: 'aura-tempest',
      name: 'Tempest',
      description: 'Attack Speed +15%',
      cost: 2,
      prerequisites: ['aura-gale-force'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 15, mode: 'percent' }],
    },
    {
      id: 'aura-beacon',
      name: 'Beacon',
      description: 'Attack Damage +12',
      cost: 1,
      prerequisites: ['aura-unity'],
      effects: [{ type: 'stat_modifier', stat: 'attackDamage', value: 12, mode: 'flat' }],
    },
    {
      id: 'aura-devotion',
      name: 'Devotion',
      description: 'Max HP +120',
      cost: 1,
      prerequisites: ['aura-martyr'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 120, mode: 'flat' }],
    },
    {
      id: 'aura-convergence',
      name: 'Convergence',
      description: 'All stats +5%',
      cost: 3,
      prerequisites: ['aura-unbreakable', 'aura-unity'],
      effects: [
        { type: 'stat_modifier', stat: 'maxHp', value: 5, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackDamage', value: 5, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackSpeed', value: 5, mode: 'percent' },
      ],
    },

    // =========================================================================
    // Depth 7 — Capstone (6 nodes)
    // =========================================================================
    {
      id: 'aura-divine-grace',
      name: 'Divine Grace',
      description: 'Max HP +200',
      cost: 3,
      prerequisites: ['aura-revive', 'aura-renewal'],
      effects: [{ type: 'stat_modifier', stat: 'maxHp', value: 200, mode: 'flat' }],
    },
    {
      id: 'aura-sanctuary',
      name: 'Sanctuary',
      description: 'Unlock Sanctuary skill',
      cost: 3,
      prerequisites: ['aura-nova', 'aura-tempest'],
      effects: [{ type: 'grant_skill', skillId: 'aura-sanctuary' }],
    },
    {
      id: 'aura-eternal-bond',
      name: 'Eternal Bond',
      description: 'Attack Speed +20%',
      cost: 2,
      prerequisites: ['aura-convergence', 'aura-devotion'],
      effects: [{ type: 'stat_modifier', stat: 'attackSpeed', value: 20, mode: 'percent' }],
    },
    {
      id: 'aura-blessed-strikes',
      name: 'Blessed Strikes',
      description: 'Slow on basic attack',
      cost: 3,
      prerequisites: ['aura-beacon', 'aura-devotion'],
      effects: [{ type: 'modify_basic_attack', property: 'slowOnHit', value: true }],
    },
    {
      id: 'aura-transcendence',
      name: 'Transcendence',
      description: 'Max HP +20%, Dmg +10%',
      cost: 3,
      prerequisites: ['aura-divine-grace'],
      effects: [
        { type: 'stat_modifier', stat: 'maxHp', value: 20, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackDamage', value: 10, mode: 'percent' },
      ],
    },
    {
      id: 'aura-ascension',
      name: 'Ascension',
      description: 'Speed +15%, Range +10%',
      cost: 3,
      prerequisites: ['aura-sanctuary'],
      effects: [
        { type: 'stat_modifier', stat: 'speed', value: 15, mode: 'percent' },
        { type: 'stat_modifier', stat: 'attackRange', value: 10, mode: 'percent' },
      ],
    },
  ],
}
