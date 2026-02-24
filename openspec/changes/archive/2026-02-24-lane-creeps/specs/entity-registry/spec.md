## ADDED Requirements

### Requirement: MinionState 型定義

`MinionState` は `AttackerEntityState` を拡張し、`entityType: 'minion'`、`minionType: 'melee' | 'ranged'`、`projectileSpeed: number`、`projectileRadius: number` を持たなければならない（SHALL）。

#### Scenario: MinionState は AttackerEntityState を拡張する
- **WHEN** `MinionState` が定義される
- **THEN** `AttackerEntityState` を拡張し、minion 固有フィールド（`minionType`, `projectileSpeed`, `projectileRadius`）を持つ
- **THEN** `entityType` は `'minion'` である

### Requirement: ミニオン列挙メソッド

`EntityManager` は全ミニオンを返す `getMinions(): MinionState[]` メソッドを提供しなければならない（SHALL）。`entityType === 'minion'` でフィルタし、型ガード付きで `MinionState[]` を返さなければならない（SHALL）。

#### Scenario: 全ミニオンを取得する
- **WHEN** ヒーロー2体、タワー2基、ミニオン8体が登録された状態で `getMinions()` を呼び出す
- **THEN** ミニオン8体のみが `MinionState[]` として返される

#### Scenario: dead ミニオンも含まれる
- **WHEN** dead なミニオンが存在する状態で `getMinions()` を呼び出す
- **THEN** dead なミニオンも結果に含まれる（死亡処理・削除タイミング制御で必要）

### Requirement: isMinion 型ガード

`isMinion(entity): entity is MinionState` 型ガード関数を提供しなければならない（SHALL）。`entityType === 'minion'` で判別しなければならない（SHALL）。

#### Scenario: ミニオンを判別する
- **WHEN** `entityType === 'minion'` のエンティティに `isMinion` を適用する
- **THEN** `true` が返され、TypeScript が `MinionState` に型を絞り込む

#### Scenario: 非ミニオンを判別する
- **WHEN** `entityType === 'hero'` のエンティティに `isMinion` を適用する
- **THEN** `false` が返される
