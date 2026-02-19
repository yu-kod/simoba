## ADDED Requirements

### Requirement: タワー状態定義
タワーは `AttackerEntityState` を実装する `TowerState` 型で管理しなければならない（SHALL）。`entityType` は `'tower'` でなければならない（SHALL）。`position` は生成後に変更されてはならない（SHALL NOT）。`facing` は常に 0 でなければならない（SHALL）。`dead` は `hp === 0` のとき `true` でなければならない（SHALL）。

#### Scenario: タワーの初期状態
- **WHEN** blue チームのタワーが生成される
- **THEN** `entityType` が `'tower'`、`team` が `'blue'`、`position` が `{ x: 600, y: 360 }`、`hp` が `maxHp` と等しい、`dead` が `false`、`facing` が `0` である

#### Scenario: red チームのタワーの初期状態
- **WHEN** red チームのタワーが生成される
- **THEN** `position` が `{ x: 2600, y: 360 }`、`team` が `'red'` である

#### Scenario: タワーは移動しない
- **WHEN** タワーの `stats.speed` を参照する
- **THEN** `0` が返される

### Requirement: タワー定義データ
タワーのステータスは `TowerDefinition` として定義しなければならない（SHALL）。`stats: StatBlock`（`maxHp`、`speed: 0`、`attackDamage`、`attackRange`、`attackSpeed`）、`radius`、`projectileSpeed`、`projectileRadius` を含まなければならない（SHALL）。

#### Scenario: タワーのステータス参照
- **WHEN** デフォルトタワーの定義を参照する
- **THEN** `stats.speed` が `0`、`stats.attackRange` が `350` 以上、`projectileSpeed` が `0` より大きい値が返される

#### Scenario: タワーは遠距離攻撃
- **WHEN** タワーの `projectileSpeed` を参照する
- **THEN** `0` より大きい値が返され、攻撃時にプロジェクタイルが生成される

### Requirement: タワー自動ターゲット選択
タワーは `attackRange` 内の敵エンティティを毎フレーム自動で検索し、最も近い敵をターゲットとして選択しなければならない（SHALL）。射程内に敵がいない場合はターゲットを `null` にしなければならない（SHALL）。`dead === true` のエンティティはターゲット候補から除外しなければならない（SHALL）。

#### Scenario: 射程内に敵が1体いる
- **WHEN** タワーの `attackRange` 内に生存中の敵エンティティが1体いる
- **THEN** その敵が `attackTargetId` として設定される

#### Scenario: 射程内に敵が複数いる
- **WHEN** タワーの `attackRange` 内に生存中の敵エンティティが2体いる
- **THEN** タワーに最も近い敵が `attackTargetId` として設定される

#### Scenario: 射程内に敵がいない
- **WHEN** タワーの `attackRange` 内に敵エンティティがいない
- **THEN** `attackTargetId` が `null` に設定される

#### Scenario: 死亡した敵はターゲット候補から除外される
- **WHEN** 射程内に `dead === true` の敵と `dead === false` の敵がいる
- **THEN** `dead === false` の敵のみがターゲット候補となる

#### Scenario: ターゲットが射程外に出る
- **WHEN** 現在のターゲットがタワーの `attackRange` 外に移動する
- **THEN** `attackTargetId` が `null` に戻り、次フレームで再検索される

### Requirement: タワー攻撃処理
タワーの攻撃は既存の `updateAttackState()` を使用して処理しなければならない（SHALL）。ターゲット選択後、`updateAttackState()` がクールダウン・射程判定・プロジェクタイル生成を行わなければならない（SHALL）。

#### Scenario: タワーがターゲットに攻撃する
- **WHEN** タワーに `attackTargetId` が設定され、ターゲットが射程内にいて、`attackCooldown` が 0 以下である
- **THEN** `ProjectileSpawnEvent` が発行され、プロジェクタイルがタワーの位置からターゲットに向かって生成される

#### Scenario: タワーのクールダウン中
- **WHEN** タワーの `attackCooldown` が 0 より大きい
- **THEN** 攻撃は発動せず、プロジェクタイルは生成されない

### Requirement: タワー破壊
タワーの `hp` が 0 になった場合、`dead` を `true` に設定しなければならない（SHALL）。破壊されたタワーは攻撃を行ってはならない（SHALL NOT）。破壊されたタワーはリスポーンしてはならない（SHALL NOT）。

#### Scenario: タワーの HP が 0 になる
- **WHEN** タワーにダメージが適用され HP が 0 になる
- **THEN** `dead` が `true` に設定される

#### Scenario: 破壊されたタワーは攻撃しない
- **WHEN** `dead === true` のタワーの攻撃処理が呼ばれる
- **THEN** ターゲット選択・攻撃は一切行われない

#### Scenario: 破壊されたタワーはリスポーンしない
- **WHEN** タワーが破壊されてから時間が経過する
- **THEN** タワーは `dead === true` のままであり、HP が回復しない

### Requirement: タワーレンダリング
タワーは `TowerRenderer` によって描画しなければならない（SHALL）。ジオメトリックスタイル（Canvas 図形のみ）で描画しなければならない（SHALL）。チームカラーを反映しなければならない（SHALL）。HP バーを表示しなければならない（SHALL）。

#### Scenario: タワーの描画
- **WHEN** タワーが生存中である
- **THEN** チームカラーの円形（radius に基づくサイズ）がタワーの position に描画される

#### Scenario: タワーの HP バー表示
- **WHEN** タワーが生存中である
- **THEN** タワーの上部に HP バーが表示され、現在の HP / maxHp の比率で長さが変わる

#### Scenario: タワーの被ダメージフラッシュ
- **WHEN** タワーがダメージを受ける
- **THEN** タワーの描画が一瞬白くフラッシュし、元の色に戻る

#### Scenario: 破壊されたタワーの非表示
- **WHEN** タワーの `dead` が `true` になる
- **THEN** タワーの描画（本体 + HP バー）が非表示になる

### Requirement: EntityManager へのタワー登録
タワーは `EntityManager.registerEntity()` を使用してエンティティレジストリに登録しなければならない（SHALL）。`getEnemiesOf(team)` で敵タワーが検索結果に含まれなければならない（SHALL）。`getEntity(id)` でタワーが取得可能でなければならない（SHALL）。

#### Scenario: タワーがレジストリに登録される
- **WHEN** ゲーム開始時にタワーが生成される
- **THEN** `EntityManager.getEntity(towerId)` でタワーの `CombatEntityState` が取得できる

#### Scenario: 敵タワーが getEnemiesOf に含まれる
- **WHEN** blue チームのヒーローから `getEnemiesOf('blue')` を呼び出す
- **THEN** red チームのタワーが結果に含まれる

### Requirement: 静的タワー描画の廃止
`mapRenderer` の `drawTowers()` によるタワーの静的描画を廃止し、`TowerRenderer` によるエンティティベースの描画に置き換えなければならない（SHALL）。

#### Scenario: マップレンダリング時にタワーが二重描画されない
- **WHEN** ゲームシーンが描画される
- **THEN** タワーは `TowerRenderer` のみによって描画され、`drawTowers()` による静的描画は行われない
