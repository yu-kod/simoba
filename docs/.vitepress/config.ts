import { defineConfig } from 'vitepress'

function spec(dir: string, label: string): { text: string; link: string } {
  return { text: label, link: `/${dir}/` }
}

export default defineConfig({
  title: 'MOBA.io Specs',
  description: '2v2 Micro Arena — Game Specification Docs',
  lang: 'ja',
  srcDir: '../openspec/specs',
  base: '/simoba/',

  // Map <name>/spec.md → <name>/index.md so URLs become /game/combat/attack-system/
  rewrites: {
    ':a/:b/:c/spec.md': ':a/:b/:c/index.md',
    ':a/:b/spec.md': ':a/:b/index.md',
  },

  themeConfig: {
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Game', link: '/game/combat/attack-system/' },
      { text: 'Infra', link: '/infra/ci-testing/' },
    ],

    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Top', link: '/' },
          { text: 'Game Mechanics', link: '/game-mechanics' },
          { text: 'Heroes', link: '/heroes' },
          { text: 'Tech Architecture', link: '/tech-architecture' },
          { text: 'Dev Phases', link: '/dev-phases' },
        ],
      },
      {
        text: 'Combat',
        collapsed: false,
        items: [
          spec('game/combat/attack-system', 'Attack System'),
          spec('game/combat/combat-events', 'Combat Events'),
          spec('game/combat/projectile-system', 'Projectile System'),
          spec('game/combat/skill-execution', 'Skill Execution'),
          spec('game/combat/skill-slots', 'Skill Slots'),
        ],
      },
      {
        text: 'Skills',
        collapsed: true,
        items: [
          {
            text: 'AURA',
            collapsed: true,
            items: [
              spec('game/skills/aura-barrier', 'Barrier'),
              spec('game/skills/aura-haste', 'Haste'),
              spec('game/skills/aura-heal', 'Heal'),
              spec('game/skills/aura-nova', 'Nova'),
              spec('game/skills/aura-sanctuary', 'Sanctuary'),
              spec('game/skills/aura-weaken', 'Weaken'),
              spec('game/skills/slow-field', 'Slow Field'),
            ],
          },
          {
            text: 'BLADE',
            collapsed: true,
            items: [
              spec('game/skills/blade-block', 'Block'),
              spec('game/skills/blade-charge', 'Charge'),
              spec('game/skills/blade-execute', 'Execute'),
              spec('game/skills/blade-fortify', 'Fortify'),
              spec('game/skills/blade-fury', 'Fury'),
              spec('game/skills/blade-whirlwind', 'Whirlwind'),
            ],
          },
          {
            text: 'BOLT',
            collapsed: true,
            items: [
              spec('game/skills/bolt-barrage', 'Barrage'),
              spec('game/skills/bolt-dash', 'Dash'),
              spec('game/skills/bolt-ricochet', 'Ricochet'),
              spec('game/skills/bolt-snipe', 'Snipe'),
              spec('game/skills/bolt-trap', 'Trap'),
              spec('game/skills/bolt-turret', 'Turret'),
              spec('game/skills/pierce-shot', 'Pierce Shot'),
            ],
          },
        ],
      },
      {
        text: 'UI',
        collapsed: true,
        items: [
          spec('game/ui/game-hud', 'Game HUD'),
          spec('game/ui/hero-rendering', 'Hero Rendering'),
          spec('game/ui/hp-bar-rendering', 'HP Bar Rendering'),
          spec('game/ui/lobby-scene', 'Lobby Scene'),
          spec('game/ui/match-end-ui', 'Match End UI'),
          spec('game/ui/world-camera', 'World Camera'),
          spec('game/ui/zone-rendering', 'Zone Rendering'),
        ],
      },
      {
        text: 'Systems',
        collapsed: true,
        items: [
          {
            text: 'Hero',
            collapsed: true,
            items: [
              spec('game/hero/hero-stats', 'Hero Stats'),
              spec('game/hero/hero-selection', 'Hero Selection'),
              spec('game/hero/hero-kill-xp', 'Hero Kill XP'),
              spec('game/hero/debug-hero-switch', 'Debug Hero Switch'),
            ],
          },
          {
            text: 'Progression',
            collapsed: true,
            items: [
              spec('game/progression/xp-level-sync', 'XP Level Sync'),
              spec('game/progression/talent-tree', 'Talent Tree'),
              spec('game/progression/talent-effects', 'Talent Effects'),
              spec('game/progression/talent-tree-expansion', 'Talent Tree Expansion'),
              spec('game/progression/bot-talent-spending', 'Bot Talent Spending'),
            ],
          },
          {
            text: 'Entity',
            collapsed: true,
            items: [
              spec('game/entity/entity-registry', 'Entity Registry'),
              spec('game/entity/entity-interpolation', 'Entity Interpolation'),
              spec('game/entity/lane-creeps', 'Lane Creeps'),
              spec('game/entity/tower-entity', 'Tower Entity'),
            ],
          },
          {
            text: 'Match',
            collapsed: true,
            items: [
              spec('game/match/match-end', 'Match End'),
              spec('game/match/online-multiplayer', 'Online Multiplayer'),
              spec('game/match/solo-play-mode', 'Solo Play Mode'),
              spec('game/match/death-respawn', 'Death & Respawn'),
              spec('game/match/respawn-timer-scaling', 'Respawn Timer Scaling'),
              spec('game/match/room-lock-disconnect', 'Room Lock & Disconnect'),
            ],
          },
          {
            text: 'Core',
            collapsed: true,
            items: [
              spec('game/core/map-layout', 'Map Layout'),
              spec('game/core/input-system', 'Input System'),
              spec('game/core/unified-world', 'Unified World'),
              spec('game/core/mvc-architecture', 'MVC Architecture'),
            ],
          },
        ],
      },
      {
        text: 'Infra',
        collapsed: true,
        items: [
          spec('infra/game-server-infra', 'Game Server Infra'),
          spec('infra/game-server-deploy-workflow', 'Game Server Deploy'),
          spec('infra/frontend-deploy-workflow', 'Frontend Deploy'),
          spec('infra/vpc-networking', 'VPC Networking'),
          spec('infra/custom-domain-ssl', 'Custom Domain & SSL'),
          spec('infra/ci-testing', 'CI Testing'),
          spec('infra/e2e-testing', 'E2E Testing'),
          spec('infra/unit-testing', 'Unit Testing'),
          spec('infra/code-linting', 'Code Linting'),
          spec('infra/logging', 'Logging'),
        ],
      },
    ],

    search: { provider: 'local' },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yu-kod/simoba' },
    ],
  },
})
