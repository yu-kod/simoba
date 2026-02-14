## 1. ディレクトリ構成とベース型定義

- [x] 1.1 `src/domain/`、`src/domain/entities/`、`src/domain/systems/` ディレクトリを作成する
- [x] 1.2 `src/domain/types.ts` に共通型（Position, Team, EntityState）を定義する
- [x] 1.3 `src/domain/constants.ts` にゲームルール定数（HERO_SPEED, MATCH_DURATION, MAX_LEVEL 等）を定義する

## 2. エンティティ状態型の定義

- [x] 2.1 `src/domain/entities/Hero.ts` に HeroState interface を定義する（id, type, team, position, hp, maxHp, level, xp — 全プロパティ readonly）
- [x] 2.2 `src/domain/entities/Hero.ts` に HeroState を生成するファクトリ関数 `createHeroState()` を実装する

## 3. ドメインシステムの実装

- [x] 3.1 `src/domain/systems/MovementSystem.ts` に `move()` 純粋関数を実装する（position, direction, speed, delta → 新しい Position を返す）
- [x] 3.2 `move()` がイミュータブル（元オブジェクト不変）かつ delta に比例する移動量であることを確認する

## 4. GameScene のリファクタリング

- [x] 4.1 `GameScene.create()` で HeroState を初期化し、ジオメトリック描画（円）で表示する
- [x] 4.2 `GameScene.update()` を3ステップ構成に変更する：入力読み取り → `move()` 呼び出し → Phaser オブジェクト位置更新
- [x] 4.3 既存の E2E テスト（`e2e/game-launch.spec.ts`）が引き続き PASS することを確認する

## 5. ユニットテスト（モック不要の実証）

- [x] 5.1 `src/domain/systems/__tests__/MovementSystem.test.ts` を作成する（vi.mock('phaser') なし。純粋関数テスト、参照透過性、イミュータブル、delta 比例の検証）
- [x] 5.2 `src/domain/entities/__tests__/Hero.test.ts` を作成する（vi.mock('phaser') なし。createHeroState の検証、readonly プロパティの型チェック）
- [x] 5.3 `src/domain/__tests__/types.test.ts` を作成する（vi.mock('phaser') なし。Position, Team, EntityState の型検証）
- [x] 5.4 全ユニットテストが `npm run test:unit` で PASS することを確認する

## 6. Phaser 非依存の検証

- [x] 6.1 `src/domain/` 配下の全ファイルに `phaser` の import が存在しないことを検証する
- [x] 6.2 `npm run test:unit` と `npm run test:e2e` の両方が PASS することを最終確認する
