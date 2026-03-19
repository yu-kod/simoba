# Specification

## Purpose
サーバーからクライアントへの攻撃イベント（AttackEvent）ブロードキャストと戦闘演出の仕様

## Requirements

### Requirement: Server broadcasts AttackEvent on hero attack
サーバーはヒーローが攻撃を発動したとき、AttackEvent を全クライアントに broadcast する。AttackEvent には攻撃者 ID、対象 ID、攻撃種別（melee/ranged）、攻撃者の位置・facing を含む。

#### Scenario: Melee hero attacks enemy
- **WHEN** サーバーがメレーヒーローの攻撃を処理し、即時ダメージを適用する
- **THEN** `attackType: 'melee'` の AttackEvent が broadcast される
- **THEN** AttackEvent の `position` と `facing` は攻撃者の現在位置・方向と一致する

#### Scenario: Ranged hero attacks enemy
- **WHEN** サーバーが遠距離ヒーローの攻撃を処理し、投射物を生成する
- **THEN** `attackType: 'ranged'` の AttackEvent が broadcast される

#### Scenario: Tower attacks hero
- **WHEN** サーバーがタワーの攻撃を処理する
- **THEN** AttackEvent が broadcast される（タワー ID が attackerId）

### Requirement: Server broadcasts DamageEvent on damage application
サーバーがエンティティにダメージを適用したとき、DamageEvent を全クライアントに broadcast する。DamageEvent には対象 ID、ダメージ量、攻撃元 ID を含む。

#### Scenario: Melee damage applied to hero
- **WHEN** メレー攻撃でヒーローにダメージが適用される
- **THEN** DamageEvent が broadcast され、targetId はダメージを受けたヒーロー、amount はダメージ量と一致する

#### Scenario: Projectile hits hero
- **WHEN** 投射物がヒーローに命中しダメージが適用される
- **THEN** DamageEvent が broadcast され、sourceId は投射物の所有者 ID と一致する

#### Scenario: Damage applied to tower
- **WHEN** タワーにダメージが適用される
- **THEN** DamageEvent が broadcast され、targetId はタワー ID と一致する

### Requirement: Server broadcasts DeathEvent on death and respawn
サーバーがヒーローの死亡・リスポーンを処理したとき、DeathEvent を全クライアントに broadcast する。

#### Scenario: Hero dies
- **WHEN** ヒーローの HP が 0 以下になり dead 状態に遷移する
- **THEN** `type: 'death'` の DeathEvent が broadcast され、position は死亡位置と一致する

#### Scenario: Hero respawns
- **WHEN** リスポーンタイマーが完了しヒーローが復活する
- **THEN** `type: 'respawn'` の DeathEvent が broadcast され、position はスポーン位置と一致する

### Requirement: Client triggers damage flash from DamageEvent
クライアントは DamageEvent を受信したとき、対象エンティティのダメージフラッシュを発火する。state-diff による HP 比較検知は使用しない。

#### Scenario: DamageEvent received for hero
- **WHEN** クライアントが DamageEvent を受信し、targetId がヒーロー ID である
- **THEN** 該当ヒーローの EntityRenderer.flash() が呼ばれる

#### Scenario: DamageEvent received for tower
- **WHEN** クライアントが DamageEvent を受信し、targetId がタワー ID である
- **THEN** 該当タワーの EntityRenderer.flash() が呼ばれる

#### Scenario: DamageEvent for unknown entity
- **WHEN** クライアントが DamageEvent を受信したが targetId に対応するエンティティが存在しない
- **THEN** エラーにならず、フラッシュは発火されない

### Requirement: Client triggers melee swing from AttackEvent
クライアントは AttackEvent（melee）を受信したとき、メレースイングエフェクトを発火する。state-diff による attackCooldown 比較検知は使用しない。

#### Scenario: Melee AttackEvent received
- **WHEN** クライアントが `attackType: 'melee'` の AttackEvent を受信する
- **THEN** MeleeSwingRenderer.play() が AttackEvent の position と facing で呼ばれる

#### Scenario: Ranged AttackEvent received
- **WHEN** クライアントが `attackType: 'ranged'` の AttackEvent を受信する
- **THEN** MeleeSwingRenderer.play() は呼ばれない（遠距離エフェクトは将来対応）

### Requirement: Death/respawn prediction reset remains state-based
死亡・リスポーン時の予測リセット（InputBuffer.clear, MovementPredictor.setPosition）は、Schema の `dead` プロパティ変化検知で発火し続ける。DeathEvent はビジュアル専用。

#### Scenario: Hero death prediction reset
- **WHEN** handleServerHeroUpdate で `dead` が false → true に変化する
- **THEN** InputBuffer.clear() と MovementPredictor.setPosition() が呼ばれる

#### Scenario: Hero respawn prediction reset
- **WHEN** サーバーからヒーローの `dead` が true → false に変化する
- **THEN** クライアント側の位置予測がリスポーン位置でリセットされる

### Requirement: attackCooldown のクライアント監視不要
クライアントは `attackCooldown` フィールドの変化を個別に監視しない（SHALL NOT）。メレースイング検知は AttackEvent ベースで行う。

#### Scenario: attackCooldown changes on server
- **WHEN** サーバーでヒーローの attackCooldown が変化する
- **THEN** クライアントに個別の通知は発生しない（AttackEvent で代替）

