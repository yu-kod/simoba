# Game Specifications

MOBA.io のゲーム仕様一覧。

## Combat

攻撃・ダメージ・戦闘システム。

- [Attack System](/game/combat/attack-system/)
- [Combat Events](/game/combat/combat-events/)
- [Projectile System](/game/combat/projectile-system/)
- [Skill Execution](/game/combat/skill-execution/)
- [Skill Slots](/game/combat/skill-slots/)

## Skills

各ヒーローのスキル仕様（20件）。

| AURA | BLADE | BOLT |
|------|-------|------|
| [Barrier](/game/skills/aura-barrier/) | [Block](/game/skills/blade-block/) | [Barrage](/game/skills/bolt-barrage/) |
| [Haste](/game/skills/aura-haste/) | [Charge](/game/skills/blade-charge/) | [Dash](/game/skills/bolt-dash/) |
| [Heal](/game/skills/aura-heal/) | [Execute](/game/skills/blade-execute/) | [Ricochet](/game/skills/bolt-ricochet/) |
| [Nova](/game/skills/aura-nova/) | [Fortify](/game/skills/blade-fortify/) | [Snipe](/game/skills/bolt-snipe/) |
| [Sanctuary](/game/skills/aura-sanctuary/) | [Fury](/game/skills/blade-fury/) | [Trap](/game/skills/bolt-trap/) |
| [Weaken](/game/skills/aura-weaken/) | [Whirlwind](/game/skills/blade-whirlwind/) | [Turret](/game/skills/bolt-turret/) |
| [Slow Field](/game/skills/slow-field/) | | [Pierce Shot](/game/skills/pierce-shot/) |

## UI

画面・レンダリング仕様。

- [Game HUD](/game/ui/game-hud/) / [Hero Rendering](/game/ui/hero-rendering/) / [HP Bar](/game/ui/hp-bar-rendering/) / [Lobby](/game/ui/lobby-scene/) / [Match End UI](/game/ui/match-end-ui/) / [World Camera](/game/ui/world-camera/) / [Zone Rendering](/game/ui/zone-rendering/)

## Systems

ヒーロー・エンティティ・マッチ・成長・基盤システム。

- **Hero**: [Stats](/game/hero/hero-stats/) / [Selection](/game/hero/hero-selection/) / [Kill XP](/game/hero/hero-kill-xp/) / [Debug Switch](/game/hero/debug-hero-switch/)
- **Progression**: [XP Level Sync](/game/progression/xp-level-sync/) / [Talent Tree](/game/progression/talent-tree/) / [Talent Effects](/game/progression/talent-effects/) / [Expansion](/game/progression/talent-tree-expansion/) / [Bot Spending](/game/progression/bot-talent-spending/)
- **Entity**: [Registry](/game/entity/entity-registry/) / [Interpolation](/game/entity/entity-interpolation/) / [Lane Creeps](/game/entity/lane-creeps/) / [Tower](/game/entity/tower-entity/)
- **Match**: [Match End](/game/match/match-end/) / [Online Multiplayer](/game/match/online-multiplayer/) / [Solo Play](/game/match/solo-play-mode/) / [Death & Respawn](/game/match/death-respawn/) / [Respawn Scaling](/game/match/respawn-timer-scaling/) / [Room Lock](/game/match/room-lock-disconnect/)
- **Core**: [Map Layout](/game/core/map-layout/) / [Input System](/game/core/input-system/) / [Unified World](/game/core/unified-world/) / [MVC](/game/core/mvc-architecture/)
