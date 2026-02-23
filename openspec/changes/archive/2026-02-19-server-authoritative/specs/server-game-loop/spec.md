## ADDED Requirements

### Requirement: サーバーゲームティック
GameRoom は `setSimulationInterval` を使用して 60Hz（約 16.6ms）の固定ティックループを実行しなければならない（SHALL）。各ティックで移動処理、攻撃処理、投射物処理、死亡/リスポーン処理を順に実行しなければならない（SHALL）。ティック内の state 変更は Colyseus のバイナリ差分同期により自動的にクライアントに伝播されなければならない（SHALL）。

#### Scenario: 60Hz ティックループが動作する
- **WHEN** GameRoom が `onCreate` で初期化される
- **THEN** `setSimulationInterval` が約 16.6ms 間隔で登録される
- **THEN** 各ティックで `update(deltaTime)` が呼び出される

#### Scenario: ティック内の処理順序
- **WHEN** サーバーティックが実行される
- **THEN** 入力適用 → 移動処理 → 攻撃処理 → 投射物処理 → 死亡/リスポーン処理 の順で実行される

#### Scenario: state 変更が自動同期される
- **WHEN** ティック内でヒーローの HP が変更される
- **THEN** 次の Colyseus パッチサイクルでバイナリ差分がクライアントに送信される

### Requirement: サーバー側エンティティスキーマ
GameRoomState は `heroes: MapSchema<HeroSchema>`, `towers: MapSchema<TowerSchema>`, `projectiles: MapSchema<ProjectileSchema>` をそれぞれ独立した MapSchema として保持しなければならない（SHALL）。各スキーマはそのエンティティ種別に必要最小限のフィールドのみを持たなければならない（SHALL）。

#### Scenario: HeroSchema のフィールド
- **WHEN** HeroSchema が定義される
- **THEN** `id`, `x`, `y`, `facing`, `hp`, `maxHp`, `dead`, `team`, `heroType`, `attackCooldown`, `attackTargetId`, `speed`, `attackDamage`, `attackRange`, `attackSpeed`, `radius`, `respawnTimer` を持つ

#### Scenario: TowerSchema のフィールド
- **WHEN** TowerSchema が定義される
- **THEN** `id`, `x`, `y`, `hp`, `maxHp`, `dead`, `team`, `radius`, `attackCooldown`, `attackTargetId`, `attackDamage`, `attackRange`, `attackSpeed` を持つ

#### Scenario: ProjectileSchema のフィールド
- **WHEN** ProjectileSchema が定義される
- **THEN** `id`, `x`, `y`, `targetX`, `targetY`, `speed`, `damage`, `ownerId`, `team` を持つ

#### Scenario: ゲーム開始時にタワーが登録される
- **WHEN** `gameStarted` が `true` に設定される
- **THEN** 両チームのタワーが `towers` MapSchema に登録される

### Requirement: サーバー側移動処理
サーバーは各ティックでプレイヤーの最新入力の `moveDir` を読み取り、`speed * deltaTime` で位置を更新しなければならない（SHALL）。マップ境界（0 〜 MAP_WIDTH, 0 〜 MAP_HEIGHT）を超える移動をクランプしなければならない（SHALL）。`dead === true` のヒーローの移動を無視しなければならない（SHALL）。

#### Scenario: 移動方向に基づいて位置が更新される
- **WHEN** プレイヤーの入力 `moveDir` が `{x: 1, y: 0}` で `speed` が 200 のとき、deltaTime が 16.6ms
- **THEN** ヒーローの `x` が約 3.32 増加する

#### Scenario: 停止入力で位置が変化しない
- **WHEN** プレイヤーの入力 `moveDir` が `{x: 0, y: 0}`
- **THEN** ヒーローの位置は変化しない

#### Scenario: マップ境界でクランプされる
- **WHEN** ヒーローがマップ端（x = MAP_WIDTH）にいて、さらに右に移動する入力が来る
- **THEN** `x` は MAP_WIDTH を超えない

#### Scenario: 死亡中のヒーローは移動しない
- **WHEN** `dead === true` のヒーローに移動入力が来る
- **THEN** 位置は変化しない

### Requirement: サーバー側攻撃処理
サーバーは各ティックで全ヒーローの攻撃状態を管理しなければならない（SHALL）。プレイヤーの入力 `attackTargetId` を受け取り、対象の存在・生存・敵チーム・射程をバリデーションしなければならない（SHALL）。`attackCooldown` をサーバー側で管理し、クールダウン完了時にダメージまたは投射物生成を実行しなければならない（SHALL）。

#### Scenario: 攻撃対象のバリデーション
- **WHEN** プレイヤーが `attackTargetId` を送信する
- **THEN** サーバーは対象が存在し、`dead === false` であり、敵チームであり、攻撃射程内であることを検証する

#### Scenario: バリデーション失敗で攻撃が無視される
- **WHEN** `attackTargetId` の対象が射程外である
- **THEN** 攻撃は実行されず、`attackTargetId` が `null` にリセットされる

#### Scenario: 近接攻撃（projectileSpeed === 0）のダメージ適用
- **WHEN** BLADE ヒーローのクールダウンが 0 に達し、対象が射程内
- **THEN** 対象の HP が `attackDamage` 分減少する（即時ダメージ）

#### Scenario: 遠距離攻撃（projectileSpeed > 0）の投射物生成
- **WHEN** BOLT ヒーローのクールダウンが 0 に達し、対象が射程内
- **THEN** `projectiles` MapSchema に新しい投射物が追加される

#### Scenario: クールダウンが毎ティック減少する
- **WHEN** ヒーローの `attackCooldown` が 0 より大きい
- **THEN** 各ティックで `attackCooldown -= deltaTime` が適用される

### Requirement: サーバー側投射物処理
サーバーは各ティックで全投射物の位置を更新し、衝突判定を実行しなければならない（SHALL）。投射物が対象位置に到達したら衝突判定を行い、命中時はダメージを適用して投射物を削除しなければならない（SHALL）。射程外に出た投射物も削除しなければならない（SHALL）。

#### Scenario: 投射物が毎ティック移動する
- **WHEN** 投射物が存在する状態でティックが実行される
- **THEN** 投射物の位置が `speed * deltaTime` で対象方向に更新される

#### Scenario: 投射物が敵に命中する
- **WHEN** 投射物が敵エンティティの `radius` 内に到達する
- **THEN** 対象の HP が `damage` 分減少し、投射物が `projectiles` から削除される

#### Scenario: 投射物が最大射程を超えて消滅する
- **WHEN** 投射物が発射位置から一定距離以上移動する
- **THEN** 投射物が `projectiles` から削除される（ダメージなし）

### Requirement: サーバー側タワー攻撃処理
サーバーは各ティックでタワーの自動攻撃を処理しなければならない（SHALL）。タワーは射程内の最も近い敵エンティティを自動的にターゲットし、クールダウン完了時に投射物を生成しなければならない（SHALL）。`dead === true` のタワーは攻撃しなくてよい（SHALL NOT）。

#### Scenario: タワーが射程内の敵を自動ターゲットする
- **WHEN** 敵ヒーローがタワーの `attackRange` 内に入る
- **THEN** タワーの `attackTargetId` がその敵ヒーローに設定される

#### Scenario: タワーが投射物を生成する
- **WHEN** タワーのクールダウンが 0 に達し、ターゲットが射程内
- **THEN** `projectiles` MapSchema にタワーの投射物が追加される

#### Scenario: 破壊されたタワーは攻撃しない
- **WHEN** タワーの `dead === true`
- **THEN** 攻撃処理がスキップされる

### Requirement: サーバー側死亡・リスポーン処理
サーバーは各ティックで全ヒーローの死亡判定とリスポーンタイマーを管理しなければならない（SHALL）。`hp <= 0` かつ `dead === false` のヒーローを `dead: true` に遷移させ、`respawnTimer` を設定しなければならない（SHALL）。`respawnTimer` が 0 に達したらヒーローをスポーン位置にリスポーンさせ、HP を全回復しなければならない（SHALL）。タワーはリスポーンしなくてよい（SHALL NOT）。

#### Scenario: HP 0 のヒーローが死亡する
- **WHEN** ヒーローの `hp` が 0 以下になる
- **THEN** `dead` が `true` に設定され、`respawnTimer` にリスポーン秒数が設定される

#### Scenario: リスポーンタイマーが毎ティック減少する
- **WHEN** ヒーローが `dead === true` でリスポーンタイマーが残っている
- **THEN** 各ティックで `respawnTimer -= deltaTime` が適用される

#### Scenario: リスポーンタイマー完了でヒーローが復活する
- **WHEN** `respawnTimer` が 0 以下になる
- **THEN** `dead` が `false`、`hp` が `maxHp`、位置がチームのスポーン位置にリセットされる

#### Scenario: タワーはリスポーンしない
- **WHEN** タワーの `dead === true`
- **THEN** タワーは破壊されたままでリスポーンしない
