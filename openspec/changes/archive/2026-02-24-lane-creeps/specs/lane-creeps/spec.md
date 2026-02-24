## ADDED Requirements

### Requirement: ミニオン定義データ

ミニオンのステータスは `MinionDefinition` として定義しなければならない（SHALL）。`stats: StatBlock`（`maxHp`, `speed`, `attackDamage`, `attackRange`, `attackSpeed`）、`radius`、`projectileSpeed`、`projectileRadius` を含まなければならない（SHALL）。近接ミニオン（`MELEE_MINION`）と遠距離ミニオン（`RANGED_MINION`）の2種を定義しなければならない（SHALL）。近接ミニオンの `projectileSpeed` は `0` でなければならない（SHALL）。遠距離ミニオンの `projectileSpeed` は `0` より大きくなければならない（SHALL）。

#### Scenario: 近接ミニオンの定義
- **WHEN** `MELEE_MINION` の定義を参照する
- **THEN** `stats.speed` が 0 より大きく、`projectileSpeed` が `0` である

#### Scenario: 遠距離ミニオンの定義
- **WHEN** `RANGED_MINION` の定義を参照する
- **THEN** `stats.speed` が 0 より大きく、`projectileSpeed` が `0` より大きい

#### Scenario: 近接と遠距離でHPが異なる
- **WHEN** `MELEE_MINION` と `RANGED_MINION` の `stats.maxHp` を比較する
- **THEN** 近接ミニオンの方が高い HP を持つ

### Requirement: ミニオン状態定義

ミニオンは `AttackerEntityState` を実装する `MinionState` 型で管理しなければならない（SHALL）。`entityType` は `'minion'` でなければならない（SHALL）。`minionType: 'melee' | 'ranged'` フィールドで近接/遠距離を区別しなければならない（SHALL）。`projectileSpeed` と `projectileRadius` を保持しなければならない（SHALL）。

#### Scenario: 近接ミニオンの初期状態
- **WHEN** blue チームの近接ミニオンが生成される
- **THEN** `entityType` が `'minion'`、`minionType` が `'melee'`、`team` が `'blue'`、`hp` が `maxHp` と等しい、`dead` が `false`、`projectileSpeed` が `0` である

#### Scenario: 遠距離ミニオンの初期状態
- **WHEN** red チームの遠距離ミニオンが生成される
- **THEN** `entityType` が `'minion'`、`minionType` が `'ranged'`、`team` が `'red'`、`projectileSpeed` が `0` より大きい

### Requirement: ウェーブスポーンシステム

各チームのベースから **30秒間隔** でミニオンウェーブをスポーンしなければならない（SHALL）。1ウェーブは近接ミニオン3体 + 遠距離ミニオン1体で構成しなければならない（SHALL）。近接ミニオンはベース寄りの前方、遠距離ミニオンはその後方に配置しなければならない（SHALL）。blue チームは左ベース付近（x=120〜150）、red チームは右ベース付近（x=3050〜3080）からスポーンしなければならない（SHALL）。近接ミニオン3体は y 方向にオフセット（340, 360, 380）して横並びにしなければならない（SHALL）。

#### Scenario: 試合開始時に最初のウェーブがスポーンする
- **WHEN** 試合が開始される（matchTime = 0）
- **THEN** blue と red の両チームから1ウェーブずつスポーンする

#### Scenario: 30秒後に次のウェーブがスポーンする
- **WHEN** matchTime が 30 秒に達する
- **THEN** 新しいウェーブが両チームからスポーンする

#### Scenario: ウェーブの構成
- **WHEN** 1ウェーブがスポーンする
- **THEN** 近接ミニオン3体と遠距離ミニオン1体の合計4体が生成される

#### Scenario: blue チームのスポーン位置
- **WHEN** blue チームのウェーブがスポーンする
- **THEN** 近接3体は x=150, y={340, 360, 380}、遠距離1体は x=120, y=360 に配置される

#### Scenario: red チームのスポーン位置
- **WHEN** red チームのウェーブがスポーンする
- **THEN** 近接3体は x=3050, y={340, 360, 380}、遠距離1体は x=3080, y=360 に配置される

### Requirement: ウェーブ設定の定数化

スポーン設定は `MinionWaveConfig` インターフェースとして定数化しなければならない（SHALL）。`interval`（スポーン間隔秒）、`meleeCount`（近接数）、`rangedCount`（遠距離数）、`statMultiplier`（ステータス倍率、初期値 1.0）を含まなければならない（SHALL）。`getWaveConfig(matchTime)` 関数で matchTime に応じた config を返さなければならない（SHALL）。現時点では常に同一 config を返さなければならない（SHALL）。

#### Scenario: デフォルトのウェーブ設定
- **WHEN** `getWaveConfig(0)` を呼び出す
- **THEN** `interval: 30`, `meleeCount: 3`, `rangedCount: 1`, `statMultiplier: 1.0` が返される

#### Scenario: 3分時点でも同じ設定が返される（バフ未実装）
- **WHEN** `getWaveConfig(180)` を呼び出す
- **THEN** `statMultiplier: 1.0` の同一設定が返される

### Requirement: ミニオン自動移動

ミニオンは `attackTargetId` が `null` の場合、レーンに沿って敵ベース方向に直進しなければならない（SHALL）。blue チームは右方向（facing = 0）、red チームは左方向（facing = π）に移動しなければならない（SHALL）。`attackTargetId` が設定されている（戦闘中）場合、移動を停止しなければならない（SHALL）。

#### Scenario: blue ミニオンが右に移動する
- **WHEN** blue チームのミニオンが `attackTargetId === null` で deltaTime 秒経過する
- **THEN** x 座標が `speed * deltaTime` 分だけ増加し、y 座標は変わらない

#### Scenario: red ミニオンが左に移動する
- **WHEN** red チームのミニオンが `attackTargetId === null` で deltaTime 秒経過する
- **THEN** x 座標が `speed * deltaTime` 分だけ減少し、y 座標は変わらない

#### Scenario: 戦闘中のミニオンは移動しない
- **WHEN** ミニオンの `attackTargetId` が敵ミニオンの ID に設定されている
- **THEN** ミニオンの position は変化しない

#### Scenario: ターゲットが死亡したら移動を再開する
- **WHEN** ミニオンのターゲットが死亡し `attackTargetId` が `null` に戻る
- **THEN** ミニオンは再び敵ベース方向へ移動を開始する

### Requirement: ミニオンターゲット優先度

ミニオンの自動ターゲット選択は **ミニオン > タワー > ヒーロー** の優先度で行わなければならない（SHALL）。`attackRange` 内の敵を優先度カテゴリ順に検索し、最初に見つかったカテゴリ内で最近接の敵を選択しなければならない（SHALL）。`dead === true` のエンティティはターゲット候補から除外しなければならない（SHALL）。射程内に敵がいない場合は `null` を返さなければならない（SHALL）。

#### Scenario: 射程内にミニオンとヒーローがいる場合
- **WHEN** ミニオンの射程内に敵ミニオン1体と敵ヒーロー1体がいる
- **THEN** 敵ミニオンがターゲットとして選択される（ヒーローより優先）

#### Scenario: 射程内にタワーとヒーローがいる場合
- **WHEN** ミニオンの射程内に敵ミニオンがおらず、敵タワーと敵ヒーローがいる
- **THEN** 敵タワーがターゲットとして選択される（ヒーローより優先）

#### Scenario: 射程内にヒーローのみの場合
- **WHEN** ミニオンの射程内に敵ヒーローのみがいる
- **THEN** 敵ヒーローがターゲットとして選択される

#### Scenario: 同カテゴリ内で最近接を選択
- **WHEN** ミニオンの射程内に敵ミニオンが2体いて、1体が距離50、もう1体が距離80にいる
- **THEN** 距離50の敵ミニオンがターゲットとして選択される

#### Scenario: 射程内に敵がいない場合
- **WHEN** ミニオンの射程内に敵がいない
- **THEN** `null` が返される

#### Scenario: dead な敵は除外される
- **WHEN** 射程内の全敵ミニオンが `dead === true` で、生存中の敵ヒーローがいる
- **THEN** 敵ヒーローがターゲットとして選択される

### Requirement: ミニオン戦闘処理

ミニオンの攻撃は既存の `updateAttackState()` を使用して処理しなければならない（SHALL）。`CombatManager` に `processMinionAttacks(deltaSeconds)` メソッドを追加しなければならない（SHALL）。処理順序はタワー攻撃の前、ヒーロー攻撃の後でなければならない（SHALL）。

#### Scenario: 近接ミニオンが攻撃する
- **WHEN** 近接ミニオンのターゲットが射程内にいて `attackCooldown` が 0 以下
- **THEN** 即時 DamageEvent が発行される（`projectileSpeed === 0`）

#### Scenario: 遠距離ミニオンが攻撃する
- **WHEN** 遠距離ミニオンのターゲットが射程内にいて `attackCooldown` が 0 以下
- **THEN** ProjectileSpawnEvent が発行される（`projectileSpeed > 0`）

#### Scenario: ミニオン攻撃の処理順序
- **WHEN** ヒーロー攻撃、ミニオン攻撃、タワー攻撃が同一フレームで処理される
- **THEN** ヒーロー攻撃 → ミニオン攻撃 → タワー攻撃の順で処理される

#### Scenario: 破壊済みミニオンは攻撃しない
- **WHEN** `dead === true` のミニオンの攻撃処理が呼ばれる
- **THEN** ターゲット選択・攻撃は一切行われない

### Requirement: ミニオン死亡処理

ミニオンの `hp` が 0 になった場合、汎用 `checkDeath` で `dead: true` に設定しなければならない（SHALL）。ミニオンはリスポーンしてはならない（SHALL NOT）。死亡後、短い delay（200ms）の後にエンティティレジストリから完全に削除しなければならない（SHALL）。

#### Scenario: ミニオンのHPが0になる
- **WHEN** ミニオンにダメージが適用されHPが0になる
- **THEN** `dead` が `true` に設定される

#### Scenario: dead ミニオンがレジストリから削除される
- **WHEN** ミニオンが `dead === true` になった後、200ms 経過する
- **THEN** `EntityManager` からそのミニオンが削除され、`getEntity(minionId)` は `null` を返す

#### Scenario: ミニオンはリスポーンしない
- **WHEN** ミニオンが死亡した後、時間が経過する
- **THEN** そのミニオンは再登場しない

### Requirement: ミニオンXP付与

敵ミニオンが死亡した時、死亡位置から半径 `XP_GRANT_RANGE` 以内の味方ヒーロー全員に XP を均等付与しなければならない（SHALL）。`HeroState.xp` に加算する純粋関数 `grantXp` を提供しなければならない（SHALL）。範囲内にヒーローがいない場合、XP は消失しなければならない（SHALL）。レベルアップ判定は行わない（SHALL NOT）。

#### Scenario: 1体のヒーローが範囲内にいる場合
- **WHEN** 敵ミニオンが死亡し、味方ヒーロー1体が `XP_GRANT_RANGE` 以内にいる
- **THEN** そのヒーローの `xp` に `MINION_XP_REWARD` が加算される

#### Scenario: 2体のヒーローが範囲内にいる場合
- **WHEN** 敵ミニオンが死亡し、味方ヒーロー2体が `XP_GRANT_RANGE` 以内にいる
- **THEN** 各ヒーローの `xp` に `MINION_XP_REWARD` が均等に加算される

#### Scenario: 範囲外のヒーローには付与されない
- **WHEN** 敵ミニオンが死亡し、味方ヒーローが `XP_GRANT_RANGE` 外にいる
- **THEN** そのヒーローの `xp` は変化しない

#### Scenario: 範囲内にヒーローがいない場合
- **WHEN** 敵ミニオンが死亡し、`XP_GRANT_RANGE` 以内に味方ヒーローがいない
- **THEN** XP は誰にも付与されない

#### Scenario: イミュータブルな更新
- **WHEN** `grantXp` を適用する
- **THEN** 元の HeroState オブジェクトは変更されず、新しいオブジェクトが返される

### Requirement: ミニオンレンダリング

ミニオンは `MinionRenderer` によって描画しなければならない（SHALL）。ジオメトリックスタイル（Canvas 図形のみ）で描画しなければならない（SHALL）。チームカラーを反映しなければならない（SHALL）。近接ミニオンは小さい円、遠距離ミニオンは小さいダイヤモンド形で描画しなければならない（SHALL）。HPバーを `HpBarRenderer` で表示しなければならない（SHALL）。

#### Scenario: 近接ミニオンの描画
- **WHEN** 近接ミニオンが生存中である
- **THEN** チームカラーの小さい円が描画され、HPバーが表示される

#### Scenario: 遠距離ミニオンの描画
- **WHEN** 遠距離ミニオンが生存中である
- **THEN** チームカラーの小さいダイヤモンド形が描画され、HPバーが表示される

#### Scenario: ミニオンの被ダメージフラッシュ
- **WHEN** ミニオンがダメージを受ける
- **THEN** ミニオンの描画が一瞬白くフラッシュし、元の色に戻る

#### Scenario: dead ミニオンの非表示
- **WHEN** ミニオンの `dead` が `true` になる
- **THEN** ミニオンの描画（本体 + HPバー）が非表示になる
