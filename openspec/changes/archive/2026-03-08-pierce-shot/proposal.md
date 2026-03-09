## Why

BOLTの火力ビルドの起点となるスキル Pierce Shot を実装する。現在のスキルシステムは `dash` effectType のみ対応しており、`projectile` effectType を追加することで今後のスキル（Barrage, Ricochet, Snipe 等）の基盤となる。Pierce Shot は Depth 1 / Cost 1 で最も取得しやすく、「方向指定で貫通弾を発射し複数の敵にヒットする」というシンプルな仕様のため、projectile effectType の最初の実装として最適。

## What Changes

- `shared/skills/skillDefinitions.ts` に `ProjectileEffectParams` インターフェースと `pierce-shot` スキル定義を追加
- `SkillEffectParams` 共用体に `ProjectileEffectParams` を追加
- サーバーに `projectileEffectHandler` を新規作成（スキル発動時にプロジェクタイルを生成）
- 既存のホーミングプロジェクタイルシステムを拡張し、「直進 + 貫通」タイプのプロジェクタイルをサポート
- `ProjectileSchema` に貫通関連フィールド（`pierceCount`, `hitEntityIds`）を追加
- クライアント側でスキル由来プロジェクタイルの描画を既存 `ProjectileRenderer` で対応
- `shared/talents/boltTalents.ts` の既存 `pierce-shot` タレントノードと連携確認

## Capabilities

### New Capabilities
- `pierce-shot`: Pierce Shot スキルの定義、projectile effectType ハンドラ、直進貫通プロジェクタイルの実装

### Modified Capabilities
- `projectile-system`: 既存のホーミングプロジェクタイルに加え、直進（non-homing）・貫通（pierce）タイプをサポート

## Impact

- **shared/skills/**: `ProjectileEffectParams` 追加、`SkillEffectParams` 共用体拡張
- **server/src/game/skills/handlers/**: 新規 `projectileEffectHandler.ts`
- **server/src/schema/**: `ProjectileSchema` に pierceCount, hitEntityIds 等を追加
- **server/src/game/**: `ServerProjectileSystem` に直進移動・貫通判定ロジック追加
- **src/scenes/effects/**: 既存 `ProjectileRenderer` でスキル由来プロジェクタイルも描画（変更最小限）
