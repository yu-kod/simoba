## MODIFIED Requirements

### Requirement: ダメージ適用
ダメージを受けたエンティティの HP を `attackDamage` 分減少させる純粋関数を提供しなければならない（SHALL）。HP は 0 未満にならないよう下限クランプしなければならない（SHALL）。`CombatManager.applyLocalDamage(targetId, amount)` は単一の `entityManager.updateEntity(targetId, (e) => applyDamage(e, amount))` で実装しなければならない（SHALL）。ヒーロー/リモートプレイヤー/レジストリエンティティによる分岐を行ってはならない（SHALL NOT）。

#### Scenario: 通常ダメージ
- **WHEN** HP 650 のエンティティに 60 ダメージを適用する
- **THEN** HP が 590 に更新される

#### Scenario: HP が 0 以下にならない
- **WHEN** HP 30 のエンティティに 60 ダメージを適用する
- **THEN** HP が 0 に更新される（負の値にならない）

#### Scenario: イミュータブルな更新
- **WHEN** ダメージを適用する
- **THEN** 元のエンティティオブジェクトは変更されず、新しいオブジェクトが返される

#### Scenario: ヒーローへのダメージが統一パスで適用される
- **WHEN** ローカルヒーローにタワーからダメージが発生する
- **THEN** `updateEntity(targetId, ...)` 経由でダメージが適用される（localHero 専用パスを経由しない）

#### Scenario: 全エンティティが同一パスでダメージを受ける
- **WHEN** ヒーロー、タワー、ミニオンにそれぞれダメージが適用される
- **THEN** 3つとも同一の `updateEntity` + `applyDamage` 経路で処理される（分岐なし）
