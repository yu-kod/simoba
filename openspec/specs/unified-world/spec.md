## Requirements

### Requirement: 単一エンティティコレクション
`EntityManager` は全エンティティ（ヒーロー、タワー、ミニオン、ボス等）を単一の `Map<string, CombatEntityState>` で管理しなければならない（SHALL）。ヒーロー専用フィールド（`_localHero`, `_enemy`）やリモートプレイヤー用の別 Map（`_remotePlayers`）を持ってはならない（SHALL NOT）。

#### Scenario: ヒーローとタワーが同一 Map に存在する
- **WHEN** ヒーロー2体とタワー2基が登録された状態で全エンティティを取得する
- **THEN** 4つのエンティティが同一コレクションから返される

#### Scenario: エンティティの追加が Map への set のみ
- **WHEN** 新しいエンティティ（ミニオン等）を追加する
- **THEN** `registerEntity` が単一 Map に追加する（ヒーロー/非ヒーローで分岐しない）

### Requirement: localHeroId によるプレイヤー操縦対象の特定
`EntityManager` は `localHeroId: string` を保持し、ローカルプレイヤーが操縦するヒーローの ID を特定しなければならない（SHALL）。`localHero`/`enemy` の専用 getter や `updateLocalHero()`/`updateEnemy()` の専用メソッドは提供してはならない（SHALL NOT）。呼び出し側は `getEntity(localHeroId)` / `updateEntity(localHeroId, ...)` で統一的にアクセスしなければならない（SHALL）。

#### Scenario: localHeroId でローカルヒーローを取得する
- **WHEN** `getEntity(entityManager.localHeroId)` を呼び出す
- **THEN** ローカルプレイヤーが操縦するヒーローの `HeroState` が返される

#### Scenario: localHeroId でローカルヒーローを更新する
- **WHEN** `updateEntity(localHeroId, (h) => ({ ...h, position: newPos }))` を呼び出す
- **THEN** ローカルヒーローの position が更新される（専用メソッド不要）

#### Scenario: ローカルヒーローと敵ヒーローの API が同一
- **WHEN** ローカルヒーローと敵ヒーローそれぞれに対して `getEntity` / `updateEntity` を呼び出す
- **THEN** 同じ API で両方にアクセスできる（分岐なし）

### Requirement: ヒーロー列挙メソッド
`EntityManager` は全ヒーローを返す `getHeroes(): HeroState[]` メソッドを提供しなければならない（SHALL）。`entityType === 'hero'` でフィルタし、型ガード付きで `HeroState[]` を返さなければならない（SHALL）。

#### Scenario: 全ヒーローを取得する
- **WHEN** ヒーロー2体とタワー2基が登録された状態で `getHeroes()` を呼び出す
- **THEN** ヒーロー2体のみが `HeroState[]` として返される

#### Scenario: dead ヒーローも含まれる
- **WHEN** dead なヒーローが存在する状態で `getHeroes()` を呼び出す
- **THEN** dead なヒーローも結果に含まれる（死亡判定・リスポーンで必要）

### Requirement: 全エンティティ取得
`EntityManager` は `allEntities: CombatEntityState[]` getter を提供し、Map 内の全エンティティを返さなければならない（SHALL）。

#### Scenario: allEntities で全エンティティを取得する
- **WHEN** ヒーロー2体、タワー2基が登録された状態で `allEntities` にアクセスする
- **THEN** 4つのエンティティすべてが返される

### Requirement: レンダラーの統合管理
`GameScene` はエンティティのレンダラーを `entityRenderers: Map<string, Renderer>` で統一管理しなければならない（SHALL）。`heroRenderer`/`enemyRenderer`/`remoteRenderers`/`towerRenderers` の個別フィールドを持ってはならない（SHALL NOT）。フラッシュエフェクトは `entityRenderers.get(targetId)?.flash()` で統一的に呼び出さなければならない（SHALL）。

#### Scenario: ダメージフラッシュが統一的に呼び出される
- **WHEN** 任意のエンティティ（ヒーロー/タワー/ミニオン）がダメージを受ける
- **THEN** `entityRenderers.get(targetId)?.flash()` で分岐なくフラッシュが再生される

#### Scenario: カメラ追従はレンダラー Map から localHeroId で取得
- **WHEN** ゲーム開始時にカメラ追従を設定する
- **THEN** `entityRenderers.get(localHeroId)` のゲームオブジェクトにカメラが追従する

### Requirement: 死亡・リスポーンのループ処理
`GameScene.updateDeathRespawn()` は `getHeroes()` でヒーローをループし、各ヒーローに対して死亡判定・リスポーンタイマー更新・リスポーン処理を行わなければならない（SHALL）。localHero/enemy のハードコードされた個別処理を行ってはならない（SHALL NOT）。

#### Scenario: 全ヒーローの死亡判定がループで処理される
- **WHEN** 毎フレーム `updateDeathRespawn()` が呼ばれる
- **THEN** `getHeroes()` の全ヒーローに対して `checkHeroDeath` と `updateRespawnTimer` が適用される

#### Scenario: localHeroId のヒーローがリスポーン時にカメラが追従再開する
- **WHEN** `localHeroId` のヒーローがリスポーンする
- **THEN** カメラがリスポーン位置に移動し、追従が再開される

#### Scenario: localHeroId 以外のヒーローのリスポーンではカメラは動かない
- **WHEN** 敵ヒーローがリスポーンする
- **THEN** カメラ追従に影響しない
