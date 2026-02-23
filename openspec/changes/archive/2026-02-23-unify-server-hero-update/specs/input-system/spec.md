## ADDED Requirements

### Requirement: updateOnlineInput のフェーズ分離
`updateOnlineInput` は読み取り（gather）→ 計算（compute）→ 書き込み（apply）の3フェーズ構造で実装しなければならない（SHALL）。gather フェーズで取得したスナップショットは compute・apply フェーズを通じて一貫して使用しなければならない（SHALL）。gather フェーズ完了後に `updateEntity` を呼び出して取得済みの参照を stale にしてはならない（SHALL NOT）。

- **gather**: `localHero` スナップショット、入力状態（movement, aim, attack）を読み取る
- **compute**: attackTarget 判定、facing 計算、inputMsg 構築、prediction 位置計算を実行する。このフェーズは gather の出力のみに依存しなければならない（SHALL）
- **apply**: `updateEntity` を1回だけ呼び出し、`networkBridge.sendInput` で入力を送信する

#### Scenario: gather で取得した localHero が compute/apply で stale にならない
- **WHEN** updateOnlineInput が実行される
- **THEN** gather フェーズで localHero スナップショットを1回取得し、compute・apply フェーズではそのスナップショットのみを参照する

#### Scenario: updateEntity は apply フェーズでのみ呼ばれる
- **WHEN** updateOnlineInput が実行される
- **THEN** `updateEntity` は apply フェーズで1回だけ呼び出される

#### Scenario: compute フェーズが純粋計算である
- **WHEN** attackTarget, facing, prediction を計算する
- **THEN** 計算は gather フェーズの出力値のみに依存し、EntityManager への書き込みは行わない

### Requirement: updateOfflineHero のフェーズ分離
`updateOfflineHero` は gather → compute → apply の3フェーズ構造で実装しなければならない（SHALL）。ただし `combatManager.processAttack` が内部で `updateEntity` を呼ぶ攻撃処理は現行のまま維持してもよい（MAY）。facing 計算と移動計算における stale reference は排除しなければならない（SHALL）。

- **gather**: `localHero` スナップショット、入力状態を読み取る
- **compute**: facing、移動先位置を計算する
- **apply**: `updateEntity` と攻撃処理を実行する

#### Scenario: facing 計算が stale な attackTargetId を参照しない
- **WHEN** updateOfflineHero で facing を計算する
- **THEN** gather フェーズで取得した localHero の attackTargetId を使用し、途中の updateEntity による変更の影響を受けない

#### Scenario: 移動計算が stale な position を参照しない
- **WHEN** updateOfflineHero で移動先位置を計算する
- **THEN** gather フェーズで取得した localHero の position を使用する

#### Scenario: 攻撃処理の updateEntity 呼び出しは許容される
- **WHEN** combatManager.processAttack が内部で updateEntity を呼ぶ
- **THEN** 攻撃処理は現行動作を維持し、フェーズ分離の対象外とする
