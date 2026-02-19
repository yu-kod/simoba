## MODIFIED Requirements

### Requirement: エンティティレジストリへの登録・削除

`EntityManager` は全エンティティを単一の `Map<string, CombatEntityState>` で管理し、`registerEntity`, `removeEntity`, `updateEntity` で操作しなければならない（SHALL）。ヒーロー専用 API（`localHero` getter, `enemy` getter, `updateLocalHero`, `updateEnemy`）は廃止しなければならない（SHALL）。ヒーローは初期化時に `registerEntity` で登録し、以後は他のエンティティと同じ `updateEntity` で更新しなければならない（SHALL）。

#### Scenario: エンティティを登録する
- **WHEN** `registerEntity(towerState)` でタワーを登録する
- **THEN** `getEntity(towerState.id)` でタワーが取得可能になる

#### Scenario: ヒーローを登録する
- **WHEN** `registerEntity(heroState)` でヒーローを登録する
- **THEN** `getEntity(heroState.id)` でヒーローが取得可能になる
- **THEN** 他のエンティティと同じ Map に格納される

#### Scenario: エンティティを削除する
- **WHEN** `removeEntity(minionId)` でミニオンを削除する
- **THEN** `getEntity(minionId)` は `null` を返す

#### Scenario: エンティティをイミュータブルに更新する
- **WHEN** `updateEntity(id, (e) => ({ ...e, hp: e.hp - 10 }))` を呼び出す
- **THEN** Map 内のエンティティが新しいオブジェクトに差し替わる
- **THEN** 元のオブジェクトは変更されない

#### Scenario: ヒーローも updateEntity で更新する
- **WHEN** `updateEntity<HeroState>(heroId, (h) => ({ ...h, position: newPos }))` を呼び出す
- **THEN** ヒーローの position が更新される（専用メソッド不要）

### Requirement: 統合エンティティ検索

`getEntity(id)` は単一 Map から O(1) でエンティティを取得しなければならない（SHALL）。複数コレクションの横断検索を行ってはならない（SHALL NOT）。

#### Scenario: ヒーロー ID で検索する
- **WHEN** ヒーローの ID で `getEntity` を呼び出す
- **THEN** ヒーローの `HeroState` が返される（単一 Map lookup）

#### Scenario: レジストリ内エンティティの ID で検索する
- **WHEN** タワーの ID で `getEntity` を呼び出す
- **THEN** タワーの `CombatEntityState` が返される

#### Scenario: 存在しない ID で検索する
- **WHEN** どこにも存在しない ID で `getEntity` を呼び出す
- **THEN** `null` が返される

### Requirement: チーム別敵エンティティ検索

`getEnemiesOf(team)` は単一 Map を1回フィルタし、指定チームにとっての敵エンティティを返さなければならない（SHALL）。`dead === true` のエンティティは除外しなければならない（SHALL）。`neutral` チームのエンティティは全チームの敵として扱わなければならない（SHALL）。

#### Scenario: blue チームの敵を検索する
- **WHEN** `getEnemiesOf('blue')` を呼び出す
- **THEN** `team === 'red'` かつ `dead === false` の全エンティティが返される
- **THEN** `team === 'neutral'` かつ `dead === false` の全エンティティも含まれる
- **THEN** `team === 'blue'` のエンティティは含まれない

#### Scenario: dead エンティティが除外される
- **WHEN** red チームのタワーが `dead === true` の状態で `getEnemiesOf('blue')` を呼び出す
- **THEN** そのタワーは結果に含まれない

## REMOVED Requirements

### Requirement: 既存ヒーロー API が維持される
**Reason**: unified-world モデルにより localHero/enemy の特別扱いを廃止。全エンティティが単一 Map で管理され、ヒーローは `localHeroId` 経由の `getEntity`/`updateEntity` でアクセスする。
**Migration**: `entityManager.localHero` → `entityManager.getEntity(entityManager.localHeroId) as HeroState`、`entityManager.updateLocalHero(fn)` → `entityManager.updateEntity<HeroState>(entityManager.localHeroId, fn)`

### Requirement: 後方互換の getEnemies
**Reason**: `localHero` getter が廃止されるため、`getEnemies()` の `getEnemiesOf(localHero.team)` エイリアスも廃止。呼び出し側がチームを明示的に指定する。
**Migration**: `entityManager.getEnemies()` → `entityManager.getEnemiesOf(team)`（team は呼び出し側が保持）
