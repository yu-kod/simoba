## 1. Domain 型定義

- [x] 1.1 `StatBlock` 型を定義する (`src/domain/entities/StatBlock.ts`) [hero-stats]
- [x] 1.2 `CombatEntityState` を `types.ts` に追加し、`HeroState` が extends するよう変更する [hero-stats]
- [x] 1.3 `HeroDefinition` + `HeroGrowthStats` 型を定義する [hero-stats]
- [x] 1.4 `HeroState` に `stats: StatBlock` と `facing: number` を追加し、既存の `maxHp` を `CombatEntityState` 経由に変更する [hero-stats]

## 2. ヒーロー定義データ

- [x] 2.1 `HERO_DEFINITIONS: Record<HeroType, HeroDefinition>` を作成し、BLADE / BOLT / AURA の固有ベースステータスと成長量を定義する (`src/domain/entities/heroDefinitions.ts`) [hero-stats]
- [x] 2.2 `createHeroState` を更新し、`HERO_DEFINITIONS` から `stats` を初期化するようにする [hero-stats]
- [x] 2.3 `constants.ts` から `HERO_SPEED`, `HERO_RADIUS` を削除し、`HeroDefinition` に統合する [hero-stats]

## 3. 向き更新ロジック

- [x] 3.1 `updateFacing` 純粋関数を実装する (`src/domain/systems/updateFacing.ts`) [hero-stats]

## 4. ユニットテスト

- [x] 4.1 `createHeroState` のテスト — 3タイプそれぞれで正しい初期値が設定されることを検証する [hero-stats]
- [x] 4.2 `updateFacing` のテスト — 移動中・停止中・斜め移動のシナリオを検証する [hero-stats]

## 5. HeroRenderer

- [x] 5.1 `HeroRenderer` クラスを実装する (`src/scenes/HeroRenderer.ts`) — Container + Graphics、sync / destroy メソッド [hero-rendering]
- [x] 5.2 ヒーロータイプ別の形状描画を実装する (BLADE: 三角、BOLT: ひし形、AURA: 六角形) [hero-rendering]
- [x] 5.3 タイプ別固有色を定義する (チームカラーではなくタイプごとの色) [hero-rendering]
- [x] 5.4 向きインジケーターの描画を実装する (facing に応じて回転する小三角形) [hero-rendering]

## 6. GameScene 統合

- [x] 6.1 `GameScene` をリファクタ — インラインの描画コードを `HeroRenderer` に置き換え、`stats.speed` で移動するよう変更する [hero-rendering]
- [x] 6.2 `updateFacing` を `GameScene.update()` に統合し、移動方向に応じて facing を更新する [hero-rendering]

## 7. テスト実行

- [x] 7.1 `npm run test:unit` — 全ユニットテストが PASS することを確認する
- [x] 7.2 `npm run test:e2e -- --update-snapshots` — E2E テストを実行し、スナップショットを更新する
- [x] 7.3 `npm run test:e2e` — 更新後のスナップショットで E2E が PASS することを確認する
