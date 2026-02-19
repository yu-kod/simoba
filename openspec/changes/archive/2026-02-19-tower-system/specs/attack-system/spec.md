## ADDED Requirements

### Requirement: CombatManager のタワー攻撃処理
`CombatManager` はタワーエンティティの攻撃を毎フレーム処理するメソッドを提供しなければならない（SHALL）。タワーの自動ターゲット選択を行い、`updateAttackState()` を適用し、結果のイベント（`ProjectileSpawnEvent`）をゲームシーンに返さなければならない（SHALL）。処理順序はヒーロー攻撃の後、プロジェクタイル解決の前でなければならない（SHALL）。

#### Scenario: タワー攻撃が毎フレーム処理される
- **WHEN** `GameScene.update()` が呼ばれる
- **THEN** `CombatManager` がすべての生存中タワーに対してターゲット選択と攻撃状態更新を実行する

#### Scenario: タワー攻撃の処理順序
- **WHEN** ヒーロー攻撃とタワー攻撃とプロジェクタイル解決が同一フレームで処理される
- **THEN** ヒーロー攻撃 → タワー攻撃 → プロジェクタイル解決の順で処理される

#### Scenario: タワーの ProjectileSpawnEvent がプロジェクタイルシステムに渡される
- **WHEN** タワーの攻撃が発動し `ProjectileSpawnEvent` が発行される
- **THEN** そのイベントが既存のプロジェクタイルシステムに渡され、プロジェクタイルが生成・追跡される

#### Scenario: 破壊済みタワーは処理をスキップする
- **WHEN** `dead === true` のタワーが攻撃処理対象に含まれる
- **THEN** そのタワーの攻撃処理はスキップされ、イベントは発行されない
