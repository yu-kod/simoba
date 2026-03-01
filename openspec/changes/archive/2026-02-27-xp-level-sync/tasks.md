## 1. Shared — レベルアップ純粋関数

- [x] 1.1 `shared/systems/levelUp.ts` に `computeLevelUp(currentLevel, xp): LevelUpResult` を作成
- [x] 1.2 `shared/systems/__tests__/levelUp.test.ts` にユニットテスト（閾値ちょうど、未満、複数レベルジャンプ、MAX_LEVEL 上限）

## 2. Shared — HeroState 拡張

- [x] 2.1 `shared/entities/Hero.ts` の `HeroState` に `talentPoints: number` を追加、`createHeroState` で初期値 0 に設定

## 3. Server — Schema & レベルアップ

- [x] 3.1 `server/src/schema/HeroSchema.ts` に `level: uint8`（初期値 1）、`talentPoints: uint8`（初期値 0）を追加
- [x] 3.2 `server/src/game/ServerMinionSystem.ts` の `processMinionDeaths` で XP 加算後に `computeLevelUp` を呼び、レベルアップ時に `level`, `talentPoints` を更新
- [x] 3.3 ステータス成長関数 `applyStatsGrowth(hero, definition, newLevel)` を作成し、レベルアップ時に `HeroSchema` のステータスフィールドを更新（maxHp 増加時は hp も増加）
- [x] 3.4 `server/src/__tests__/levelUpIntegration.test.ts` にサーバー側レベルアップ統合テスト（XP 付与 → level 変化 → stats 成長 → talentPoints 付与）

## 4. Client — 同期パイプライン

- [x] 4.1 `src/network/GameMode.ts` の `ServerHeroState` に `xp`, `level`, `talentPoints` フィールドを追加
- [x] 4.2 `src/network/OnlineGameMode.ts` で `xp`, `level`, `talentPoints` のリスナー追加と `notifyServerHeroUpdate` で抽出
- [x] 4.3 `src/scenes/GameScene.ts` の `applyServerHeroNonPositionState` で `xp`, `level`, `talentPoints` を `HeroState` に反映

## 5. Tests — 既存テスト確認

- [x] 5.1 全ユニットテスト PASS 確認（`npm run test:unit`）
