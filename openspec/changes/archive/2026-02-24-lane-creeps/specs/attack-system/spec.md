## ADDED Requirements

### Requirement: ミニオン自動ターゲット選択

`selectMinionTarget(minion, enemies)` は優先度付きターゲット選択を行わなければならない（SHALL）。優先度は **ミニオン > タワー > ヒーロー** でなければならない（SHALL）。各優先度カテゴリ内で `attackRange` 以内の最近接敵を選択しなければならない（SHALL）。`dead === true` のエンティティは候補から除外しなければならない（SHALL）。

#### Scenario: ミニオンがタワーより優先される
- **WHEN** 射程内に敵ミニオン（距離80）と敵タワー（距離60）がいる
- **THEN** 敵ミニオンがターゲットとして選択される（距離が遠くても優先度が高い）

#### Scenario: タワーがヒーローより優先される
- **WHEN** 射程内にミニオンがおらず、敵タワー（距離100）と敵ヒーロー（距離50）がいる
- **THEN** 敵タワーがターゲットとして選択される

#### Scenario: 同カテゴリ内で最近接を選択
- **WHEN** 射程内に敵ミニオンが2体いて、1体が距離50、もう1体が距離80にいる
- **THEN** 距離50の敵ミニオンがターゲットとして選択される

### Requirement: CombatManager ミニオン攻撃処理

`CombatManager` は `processMinionAttacks(deltaSeconds)` メソッドを提供しなければならない（SHALL）。全生存中ミニオンに対して `selectMinionTarget` でターゲットを選択し、`updateAttackState()` で攻撃処理を行わなければならない（SHALL）。処理順序はヒーロー攻撃の後、タワー攻撃の前でなければならない（SHALL）。

#### Scenario: ミニオン攻撃が毎フレーム処理される
- **WHEN** `GameScene.update()` が呼ばれる
- **THEN** `CombatManager` がすべての生存中ミニオンに対してターゲット選択と攻撃状態更新を実行する

#### Scenario: 近接ミニオンの攻撃で DamageEvent が発行される
- **WHEN** 近接ミニオン（`projectileSpeed === 0`）の攻撃が発動する
- **THEN** 即時 DamageEvent が発行される

#### Scenario: 遠距離ミニオンの攻撃で ProjectileSpawnEvent が発行される
- **WHEN** 遠距離ミニオン（`projectileSpeed > 0`）の攻撃が発動する
- **THEN** ProjectileSpawnEvent が発行される

## MODIFIED Requirements

### Requirement: CombatManager のタワー攻撃処理
`CombatManager` はタワーエンティティの攻撃を毎フレーム処理するメソッドを提供しなければならない（SHALL）。タワーの自動ターゲット選択を行い、`updateAttackState()` を適用し、結果のイベント（`ProjectileSpawnEvent`）をゲームシーンに返さなければならない（SHALL）。処理順序はミニオン攻撃の後、プロジェクタイル解決の前でなければならない（SHALL）。タワーのターゲット候補にはヒーローに加えてミニオンも含まなければならない（SHALL）。

#### Scenario: タワー攻撃が毎フレーム処理される
- **WHEN** `GameScene.update()` が呼ばれる
- **THEN** `CombatManager` がすべての生存中タワーに対してターゲット選択と攻撃状態更新を実行する

#### Scenario: タワー攻撃の処理順序
- **WHEN** ヒーロー攻撃、ミニオン攻撃、タワー攻撃、プロジェクタイル解決が同一フレームで処理される
- **THEN** ヒーロー攻撃 → ミニオン攻撃 → タワー攻撃 → プロジェクタイル解決の順で処理される

#### Scenario: タワーの ProjectileSpawnEvent がプロジェクタイルシステムに渡される
- **WHEN** タワーの攻撃が発動し `ProjectileSpawnEvent` が発行される
- **THEN** そのイベントが既存のプロジェクタイルシステムに渡され、プロジェクタイルが生成・追跡される

#### Scenario: 破壊済みタワーは処理をスキップする
- **WHEN** `dead === true` のタワーが攻撃処理対象に含まれる
- **THEN** そのタワーの攻撃処理はスキップされ、イベントは発行されない

#### Scenario: タワーがミニオンを攻撃対象にする
- **WHEN** タワーの射程内に敵ミニオンがいる
- **THEN** そのミニオンがタワーのターゲット候補に含まれる
