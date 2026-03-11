## Why

BOLT の火力ビルドに中距離の集団戦向けスキルが不足している。Ricochet（跳弾）は敵間を跳ね回る弾丸で、密集した敵チームに対して効率的にダメージを与えるスキル。Issue #208。

## What Changes

- `ProjectileEffectParams` に `bounceCount` / `bounceRange` フィールドを追加
- `ProjectileSchema` に `bounceRemaining` / `bounceRange` フィールドを追加
- `ServerProjectileSystem.ts` の `processLinearProjectile` にバウンスロジックを追加（ヒット時に最近接敵にリターゲット）
- `shared/skills/skillDefinitions.ts` に `bolt-ricochet` スキル定義を追加
- サーバーテスト追加（バウンド動作、範囲外停止、既ヒット除外）

## Capabilities

### New Capabilities
- `bolt-ricochet`: Ricochet スキル定義とバウンスプロジェクタイルシステム

### Modified Capabilities
- `projectile-system`: プロジェクタイルにバウンス動作を追加（`bounceCount`/`bounceRange`）

## Impact

- `shared/skills/skillDefinitions.ts` — `ProjectileEffectParams` 拡張 + スキル定義追加
- `server/src/schema/ProjectileSchema.ts` — `bounceRemaining`, `bounceRange` フィールド追加
- `server/src/game/ServerProjectileSystem.ts` — バウンスロジック追加
- `server/src/game/skills/handlers/projectileEffectHandler.ts` — バウンスフィールド設定
- `shared/talents/boltTalents.ts` — 既に `bolt-ricochet` ノード存在（変更不要）
