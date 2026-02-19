## ADDED Requirements

### Requirement: エンティティ型階層

全戦闘エンティティは `EntityState` → `CombatEntityState` → `AttackerEntityState` の3層インターフェース階層に従わなければならない（SHALL）。`CombatEntityState` は `entityType`, `hp`, `maxHp`, `dead`, `radius` を持たなければならない（SHALL）。`AttackerEntityState` は `CombatEntityState` を拡張し `stats`, `attackCooldown`, `attackTargetId`, `facing` を持たなければならない（SHALL）。

#### Scenario: CombatEntityState のフィールド
- **WHEN** `CombatEntityState` を実装するエンティティが作成される
- **THEN** `entityType`, `hp`, `maxHp`, `dead`, `radius` が全て含まれる

#### Scenario: AttackerEntityState のフィールド
- **WHEN** `AttackerEntityState` を実装する攻撃可能エンティティが作成される
- **THEN** `CombatEntityState` の全フィールドに加え、`stats`（StatBlock）、`attackCooldown`、`attackTargetId`、`facing` が含まれる

#### Scenario: HeroState は AttackerEntityState を拡張する
- **WHEN** `HeroState` が定義される
- **THEN** `AttackerEntityState` を拡張し、hero 固有フィールド（`type`, `level`, `xp`, `respawnTimer`, `deathPosition`）を持つ
- **THEN** `entityType` は `'hero'` である

### Requirement: entityType による型判別

`CombatEntityState` の `entityType` フィールドは TypeScript の discriminated union として機能しなければならない（SHALL）。`EntityType` は `'hero' | 'tower' | 'minion' | 'boss' | 'structure'` の string literal union でなければならない（SHALL）。

#### Scenario: entityType でヒーローを判別する
- **WHEN** エンティティの `entityType` が `'hero'` である
- **THEN** TypeScript の型ガードにより `HeroState` として型が絞り込まれる

#### Scenario: switch 文による型分岐
- **WHEN** `switch (entity.entityType)` で分岐する
- **THEN** 各 case で対応するエンティティ型に自動的に絞り込まれる

### Requirement: Team 型の neutral サポート

`Team` 型は `'blue' | 'red' | 'neutral'` でなければならない（SHALL）。`neutral` はボス等の中立エンティティに使用し、両チームから攻撃対象として扱わなければならない（SHALL）。

#### Scenario: neutral エンティティは blue チームから攻撃可能
- **WHEN** blue チームのヒーローが敵を検索する
- **THEN** `team === 'red'` のエンティティに加え、`team === 'neutral'` のエンティティも敵として返される

#### Scenario: neutral エンティティは red チームから攻撃可能
- **WHEN** red チームのヒーローが敵を検索する
- **THEN** `team === 'blue'` のエンティティに加え、`team === 'neutral'` のエンティティも敵として返される

### Requirement: radius をエンティティ state に保持

`CombatEntityState` の `radius` フィールドにエンティティの当たり判定半径を保持しなければならない（SHALL）。エンティティ生成時に定義値から `radius` を state にコピーしなければならない（SHALL）。`getEntityRadius` は定義ファイルのルックアップではなく、エンティティ state の `radius` を直接参照しなければならない（SHALL）。

#### Scenario: ヒーロー生成時に radius が state に含まれる
- **WHEN** `createHeroState({ type: 'BLADE' })` でヒーローを生成する
- **THEN** 返される `HeroState` の `radius` が `HERO_DEFINITIONS['BLADE'].radius`（22）と等しい

#### Scenario: getEntityRadius がエンティティ state を参照する
- **WHEN** `getEntityRadius(id)` を呼び出す
- **THEN** 対応エンティティの `state.radius` を返す（`HERO_DEFINITIONS` のルックアップは行わない）

#### Scenario: 未知の ID に対するデフォルト値
- **WHEN** 存在しない ID で `getEntityRadius` を呼び出す
- **THEN** `DEFAULT_ENTITY_RADIUS`（20）を返す

### Requirement: エンティティレジストリへの登録・削除

`EntityManager` は汎用エンティティレジストリ（`Map<string, CombatEntityState>`）を持ち、`registerEntity`, `removeEntity`, `updateEntity` で管理しなければならない（SHALL）。既存のヒーロー専用 API（`localHero`, `enemy`, `updateLocalHero`, `updateEnemy`）は後方互換で維持しなければならない（SHALL）。

#### Scenario: エンティティを登録する
- **WHEN** `registerEntity(towerState)` でタワーを登録する
- **THEN** `getEntity(towerState.id)` でタワーが取得可能になる

#### Scenario: エンティティを削除する
- **WHEN** `removeEntity(minionId)` でミニオンを削除する
- **THEN** `getEntity(minionId)` は `null` を返す

#### Scenario: エンティティをイミュータブルに更新する
- **WHEN** `updateEntity(id, (e) => ({ ...e, hp: e.hp - 10 }))` を呼び出す
- **THEN** レジストリ内のエンティティが新しいオブジェクトに差し替わる
- **THEN** 元のオブジェクトは変更されない

#### Scenario: 既存ヒーロー API が維持される
- **WHEN** `entityManager.localHero` にアクセスする
- **THEN** 従来通り `HeroState` が返される（レジストリとは独立）

### Requirement: 統合エンティティ検索

`getEntity(id)` はヒーロー（localHero, enemy, remotePlayers）とレジストリの両方を横断検索しなければならない（SHALL）。ヒーローを先に検索し、見つからなければレジストリを検索しなければならない（SHALL）。

#### Scenario: ヒーロー ID で検索する
- **WHEN** localHero の ID で `getEntity` を呼び出す
- **THEN** localHero の `HeroState` が返される

#### Scenario: レジストリ内エンティティの ID で検索する
- **WHEN** レジストリに登録されたタワーの ID で `getEntity` を呼び出す
- **THEN** タワーの `CombatEntityState` が返される

#### Scenario: 存在しない ID で検索する
- **WHEN** どこにも存在しない ID で `getEntity` を呼び出す
- **THEN** `null` が返される

### Requirement: チーム別敵エンティティ検索

`getEnemiesOf(team)` は指定チームにとっての敵エンティティ（ヒーロー + レジストリ）を返さなければならない（SHALL）。`dead === true` のエンティティは除外しなければならない（SHALL）。`neutral` チームのエンティティは全チームの敵として扱わなければならない（SHALL）。既存の `getEnemies()` は `getEnemiesOf(localHero.team)` のエイリアスとして維持しなければならない（SHALL）。

#### Scenario: blue チームの敵を検索する
- **WHEN** `getEnemiesOf('blue')` を呼び出す
- **THEN** `team === 'red'` かつ `dead === false` の全エンティティが返される
- **THEN** `team === 'neutral'` かつ `dead === false` の全エンティティも含まれる
- **THEN** `team === 'blue'` のエンティティは含まれない

#### Scenario: dead エンティティが除外される
- **WHEN** red チームのタワーが `dead === true` の状態で `getEnemiesOf('blue')` を呼び出す
- **THEN** そのタワーは結果に含まれない

#### Scenario: 後方互換の getEnemies
- **WHEN** `getEnemies()` を呼び出す
- **THEN** `getEnemiesOf(localHero.team)` と同じ結果が返される

### Requirement: 汎用死亡判定

`checkDeath<T extends CombatEntityState>(entity: T): T` は任意の `CombatEntityState` に対して動作しなければならない（SHALL）。`hp <= 0` かつ `dead === false` の場合のみ `dead: true` に遷移しなければならない（SHALL）。既存のヒーロー専用死亡判定（`checkHeroDeath`）は汎用 `checkDeath` を内部で使用し、hero 固有フィールド（`respawnTimer`, `deathPosition`, `attackTargetId`）を追加でセットしなければならない（SHALL）。

#### Scenario: HP が 0 のエンティティが死亡する
- **WHEN** `hp === 0` かつ `dead === false` のエンティティに `checkDeath` を適用する
- **THEN** `dead` が `true` になる
- **THEN** 他のフィールドは変更されない

#### Scenario: 既に dead のエンティティは変化しない
- **WHEN** `dead === true` のエンティティに `checkDeath` を適用する
- **THEN** エンティティはそのまま返される（二重死亡しない）

#### Scenario: HP が残っているエンティティは変化しない
- **WHEN** `hp > 0` のエンティティに `checkDeath` を適用する
- **THEN** エンティティはそのまま返される

#### Scenario: ヒーロー専用死亡判定はリスポーン情報を含む
- **WHEN** HP が 0 のヒーローに `checkHeroDeath` を適用する
- **THEN** `dead` が `true` になる
- **THEN** `respawnTimer` にリスポーン秒数がセットされる
- **THEN** `deathPosition` に死亡時の座標が記録される
- **THEN** `attackTargetId` が `null` にリセットされる

#### Scenario: イミュータブルな更新
- **WHEN** `checkDeath` を適用する
- **THEN** 元のエンティティオブジェクトは変更されず、新しいオブジェクトが返される
