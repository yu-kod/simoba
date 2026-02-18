## ADDED Requirements

### Requirement: 読み取り専用テスト API の提供

dev ビルド (`import.meta.env.DEV === true`) において、`window.__test__` にゲーム状態を読み取るクエリオブジェクトを公開する。
API はプリミティブ値のみ返し、内部オブジェクト (`HeroState` 等) を直接公開してはならない (SHALL NOT)。
prod ビルドでは `window.__test__` が存在してはならない (SHALL NOT)。

#### Scenario: dev ビルドで API が利用可能
- **WHEN** dev モードでゲームを起動し GameScene がアクティブになる
- **THEN** `window.__test__` オブジェクトが存在する

#### Scenario: prod ビルドで API が存在しない
- **WHEN** prod ビルド (`import.meta.env.DEV === false`) でゲームを起動する
- **THEN** `window.__test__` は `undefined` である

### Requirement: ヒーロー状態の読み取り

`window.__test__` は以下のヒーロー状態クエリを提供する (SHALL):
- `getHeroType()` → `string` (例: `'BLADE'`, `'BOLT'`, `'AURA'`)
- `getHeroPosition()` → `{ x: number, y: number }`
- `getHeroHp()` → `{ current: number, max: number }`

#### Scenario: ヒーロータイプの取得
- **WHEN** `window.__test__.getHeroType()` を呼び出す
- **THEN** 現在のヒーロータイプ文字列が返る (例: `'BLADE'`)

#### Scenario: ヒーロー切り替え後のタイプ取得
- **WHEN** キー `2` を押して BOLT に切り替えた後に `getHeroType()` を呼び出す
- **THEN** `'BOLT'` が返る

#### Scenario: ヒーロー位置の取得
- **WHEN** `window.__test__.getHeroPosition()` を呼び出す
- **THEN** 現在のヒーロー座標 `{ x, y }` が返る

#### Scenario: ヒーロー HP の取得
- **WHEN** `window.__test__.getHeroHp()` を呼び出す
- **THEN** `{ current, max }` が返り、`current <= max` かつ `max > 0` である

### Requirement: 敵状態の読み取り

`window.__test__` は以下の敵状態クエリを提供する (SHALL):
- `getEnemyHp()` → `{ current: number, max: number }`
- `getEnemyPosition()` → `{ x: number, y: number }`

#### Scenario: 敵 HP の取得
- **WHEN** `window.__test__.getEnemyHp()` を呼び出す
- **THEN** `{ current, max }` が返り、初期状態では `current === max` である

#### Scenario: 敵がダメージを受けた後の HP
- **WHEN** ヒーローが敵を攻撃して HP が減少した後に `getEnemyHp()` を呼び出す
- **THEN** `current < max` である

### Requirement: 投射物状態の読み取り

`window.__test__` は以下の投射物クエリを提供する (SHALL):
- `getProjectileCount()` → `number`

#### Scenario: 投射物が存在しない場合
- **WHEN** 攻撃していない状態で `getProjectileCount()` を呼び出す
- **THEN** `0` が返る

#### Scenario: BOLT 攻撃中の投射物カウント
- **WHEN** BOLT が攻撃して投射物が飛行中に `getProjectileCount()` を呼び出す
- **THEN** `1` 以上の値が返る

### Requirement: E2E テストは内部 state を書き換えない

全ての E2E テストはユーザー入力 (キーボード/マウス) のみでゲーム操作を行う (SHALL)。
`page.evaluate()` でゲーム内部 state を変更するコードを含んではならない (SHALL NOT)。
唯一の例外は `window.__test__` API 経由の読み取りである。

#### Scenario: 近接攻撃テスト
- **WHEN** WASD で敵に接近し、敵を右クリックする
- **THEN** 敵 HP が減少する（`window.__test__.getEnemyHp()` で検証）

#### Scenario: 投射物攻撃テスト
- **WHEN** キー `2` で BOLT に切り替え、WASD で敵に接近し、敵を右クリックする
- **THEN** 投射物が生成され、敵 HP が減少する

### Requirement: GameScene テスト用ゲッターの廃止

GameScene から以下のテスト用プロパティを削除する (SHALL):
- `get heroState()` / `set heroState()`
- `get enemyState()`
- `get projectiles()`

#### Scenario: ゲッター削除後もテスト全 PASS
- **WHEN** GameScene からゲッター/セッターを削除する
- **THEN** `window.__test__` API を使用する新しい E2E テストが全て PASS する
