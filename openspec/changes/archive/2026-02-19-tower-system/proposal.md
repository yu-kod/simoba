## Why

Phase 1 の Map rendering deliverable に「tower」が含まれているが、現状タワーは視覚的な円として描画されるだけで、HP・攻撃・破壊といったゲームロジックが存在しない。タワーはレーン戦の核であり、ミニオンシステムや勝敗条件の前提となるため、早期に実装する必要がある。

## What Changes

- タワーをゲームエンティティ（HP・攻撃能力を持つ構造物）として実装
- タワーの自動攻撃ロジック（射程内の敵ヒーローを自動ターゲット・攻撃）
- タワーの HP バー表示と破壊処理
- タワー破壊時のビジュアルフィードバック
- 既存の `EntityManager` / `CombatManager` にタワーエンティティを統合
- マップレイアウトの既存タワー位置定義を活用（blue: x=600, red: x=2600）

## Capabilities

### New Capabilities
- `tower-entity`: タワーの状態管理（HP, 攻撃ステータス, チーム, 位置）、自動攻撃ロジック、破壊処理、レンダリング

### Modified Capabilities
- `attack-system`: タワーからの攻撃イベント発火と、タワーへのダメージ適用を追加。既存の `CombatEntityState` インタフェースはそのまま利用可能

## Impact

- `src/domain/entities/` — 新規 `TowerState` 型、タワー定義の追加
- `src/domain/systems/` — タワー自動攻撃ロジック（ターゲット選択 + 攻撃ステート管理）
- `src/scenes/EntityManager.ts` — タワーエンティティの管理
- `src/scenes/CombatManager.ts` — タワーの攻撃処理統合
- `src/scenes/` — タワー用レンダラー（`TowerRenderer`）+ HP バー
- `src/scenes/mapRenderer.ts` — 静的タワー描画からエンティティベース描画への移行
- ユニットテスト + E2E テストの追加
