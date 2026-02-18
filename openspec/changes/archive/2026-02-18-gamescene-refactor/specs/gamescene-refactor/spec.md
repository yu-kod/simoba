## ADDED Requirements

### Requirement: リファクタリング後の挙動同一性
GameScene のマネージャー分割後、ゲームプレイの観測可能な挙動はリファクタリング前と完全に一致しなければならない (SHALL)。既存の全ユニットテストおよび E2E テストが変更なしで PASS することを以って検証する。

#### Scenario: 既存ユニットテストが全て PASS する
- **WHEN** `npm run test:unit` を実行する
- **THEN** リファクタリング前と同じテストが全て PASS する

#### Scenario: 既存 E2E テストが全て PASS する
- **WHEN** `npm run test:e2e` を実行する
- **THEN** リファクタリング前と同じテストが全て PASS する

### Requirement: GameScene の行数削減
リファクタリング後の `GameScene.ts` はオーケストレーション責務のみを持ち、200 行以下に収まらなければならない (SHALL)。

#### Scenario: GameScene が 200 行以下である
- **WHEN** リファクタリング完了後の `src/scenes/GameScene.ts` の行数を計測する
- **THEN** 200 行以下である
