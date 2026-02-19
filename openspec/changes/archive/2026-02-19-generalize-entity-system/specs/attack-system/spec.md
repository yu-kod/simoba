## MODIFIED Requirements

### Requirement: 攻撃状態マシン
`AttackerEntityState` を実装する任意のエンティティは `attackTargetId: string | null` で現在のターゲットを保持しなければならない（SHALL）。ターゲット指定・距離判定・クールダウンに基づいて以下の状態遷移を行わなければならない（SHALL）。`updateAttackState` はジェネリクス `<T extends AttackerEntityState>` で定義し、入力と同じ型 `T` を返さなければならない（SHALL）。

#### Scenario: 敵を右クリックしてターゲットが attackRange 内
- **WHEN** 敵を右クリックし、ターゲットとの距離が `attackRange` 以内である
- **THEN** `attackTargetId` にターゲットの ID が設定され、攻撃ループが開始される

#### Scenario: 敵を右クリックしてターゲットが attackRange 外
- **WHEN** 敵を右クリックし、ターゲットとの距離が `attackRange` を超えている
- **THEN** `attackTargetId` は `null` のまま、facing のみターゲット方向に更新される。攻撃モーション・ダメージは一切発生しない

#### Scenario: 攻撃ループ中にターゲットが attackRange 外に出る
- **WHEN** 攻撃ループ中にターゲットとの距離が `attackRange` を超える
- **THEN** `attackTargetId` が `null` に戻り、攻撃が即終了する

#### Scenario: 地面を右クリックする
- **WHEN** 地面を右クリックする（ターゲット `null`）
- **THEN** クリック方向に facing が更新され、攻撃は発生しない

#### Scenario: ジェネリクスによる型保持
- **WHEN** `HeroState` を `updateAttackState` に渡す
- **THEN** 戻り値の `entity` フィールドは `HeroState` 型である（ダウンキャスト不要）

#### Scenario: 非ヒーローエンティティの攻撃状態更新
- **WHEN** `AttackerEntityState` を実装するタワーやミニオンを `updateAttackState` に渡す
- **THEN** 同じ攻撃ステートマシンロジック（クールダウン、射程判定、ターゲットドロップ）が適用される

### Requirement: 攻撃クールダウン
`attackSpeed`（attacks/sec）に基づくクールダウンを管理しなければならない（SHALL）。`attackCooldown` は毎フレーム `deltaTime` 分減少し、0 以下で攻撃可能と判定しなければならない（SHALL）。攻撃発動時に `1 / attackSpeed` 秒にリセットしなければならない（SHALL）。攻撃発動時、`projectileSpeed` が 0 のエンティティ（近接）は即時 DamageEvent を発行しなければならない（SHALL）。`projectileSpeed` が 0 より大きいエンティティ（遠距離）は DamageEvent の代わりに ProjectileSpawnEvent を発行しなければならない（SHALL）。

#### Scenario: クールダウンが 0 以下で攻撃可能
- **WHEN** `attackCooldown` が 0 以下でターゲットが `attackRange` 内にいる
- **THEN** 攻撃が発動し、ダメージイベントまたはプロジェクタイル生成イベントが発行される

#### Scenario: クールダウン中は攻撃不可
- **WHEN** `attackCooldown` が 0 より大きい
- **THEN** 攻撃は発動せず、ダメージイベントもプロジェクタイル生成イベントも発行されない

#### Scenario: 攻撃発動後にクールダウンがリセットされる
- **WHEN** attackSpeed が 0.8 (attacks/sec) で攻撃が発動する
- **THEN** `attackCooldown` が `1 / 0.8 = 1.25` 秒にリセットされる

#### Scenario: クールダウンがフレームごとに減少する
- **WHEN** `attackCooldown` が 1.0 で deltaTime が 0.016（約60fps）
- **THEN** `attackCooldown` が 0.984 に更新される

#### Scenario: 近接エンティティの攻撃発動で即時ダメージ
- **WHEN** `projectileSpeed === 0` のエンティティの攻撃が発動する
- **THEN** 即時 DamageEvent が発行され、ターゲットの HP が減少する

#### Scenario: 遠距離エンティティの攻撃発動でプロジェクタイル生成
- **WHEN** `projectileSpeed > 0` のエンティティの攻撃が発動する
- **THEN** DamageEvent の代わりに ProjectileSpawnEvent が発行され、プロジェクタイルが生成される

### Requirement: ダメージ適用
ダメージを受けたエンティティの HP を `attackDamage` 分減少させる純粋関数を提供しなければならない（SHALL）。HP は 0 未満にならないよう下限クランプしなければならない（SHALL）。ダメージ適用先はヒーローに限らず、レジストリに登録された全エンティティ（タワー、ミニオン等）を対象としなければならない（SHALL）。

#### Scenario: 通常ダメージ
- **WHEN** HP 650 のエンティティに 60 ダメージを適用する
- **THEN** HP が 590 に更新される

#### Scenario: HP が 0 以下にならない
- **WHEN** HP 30 のエンティティに 60 ダメージを適用する
- **THEN** HP が 0 に更新される（負の値にならない）

#### Scenario: イミュータブルな更新
- **WHEN** ダメージを適用する
- **THEN** 元のエンティティオブジェクトは変更されず、新しいオブジェクトが返される

#### Scenario: レジストリ内エンティティへのダメージ適用
- **WHEN** レジストリに登録されたタワー（`entityType === 'tower'`）にダメージを適用する
- **THEN** タワーの HP が減少する
- **THEN** ヒーローと同じダメージ計算ロジックが使用される

## ADDED Requirements

### Requirement: 全エンティティへのターゲット解決

`CombatManager` の `resolveTarget` はヒーローとレジストリの両方からターゲットを解決しなければならない（SHALL）。`EntityManager.getEntity(id)` を使用して統合検索しなければならない（SHALL）。

#### Scenario: ヒーローをターゲットとして解決する
- **WHEN** `attackTargetId` が敵ヒーローの ID である
- **THEN** 敵ヒーローの `CombatEntityState` が返される

#### Scenario: レジストリ内エンティティをターゲットとして解決する
- **WHEN** `attackTargetId` がレジストリ内タワーの ID である
- **THEN** タワーの `CombatEntityState` が返される

#### Scenario: 存在しないターゲットの解決
- **WHEN** `attackTargetId` がどこにも存在しない ID である
- **THEN** `null` が返される

### Requirement: 全エンティティへのプロジェクタイル当たり判定

`processProjectiles` はレジストリ内エンティティを含む全敵エンティティに対してプロジェクタイルの当たり判定を行わなければならない（SHALL）。`getEnemiesOf(team)` を使用してターゲットリストを取得しなければならない（SHALL）。

#### Scenario: プロジェクタイルがレジストリ内エンティティにヒットする
- **WHEN** blue チームのプロジェクタイルが red チームのタワー（レジストリ内）に到達する
- **THEN** タワーにダメージが適用される

#### Scenario: プロジェクタイルが dead エンティティを無視する
- **WHEN** プロジェクタイルのターゲットが `dead === true` である
- **THEN** プロジェクタイルは消滅し、ダメージは発生しない

### Requirement: 全エンティティへのクリックターゲット

`handleAttackInput` は `getEnemiesOf(team)` を使用して全敵エンティティ（ヒーロー + レジストリ）からクリックターゲットを検索しなければならない（SHALL）。

#### Scenario: レジストリ内エンティティを右クリックする
- **WHEN** 右クリックのワールド座標がレジストリ内の敵タワーの `radius` 以内にある
- **THEN** そのタワーがターゲットとして選択される

#### Scenario: ヒーローとレジストリエンティティが重なっている位置を右クリックする
- **WHEN** 右クリック位置にヒーローとタワーの両方がヒットする
- **THEN** クリック位置に最も近いエンティティがターゲットとして選択される
