## ADDED Requirements

### Requirement: Charge スキル定義
BLADE ヒーローのスキル `blade-charge` は以下のパラメータで定義されなければならない（SHALL）：targeting = `'direction'`、cooldown、distance（ダッシュ距離）、damage（接触ダメージ）、duration（ダッシュ所要時間）。パラメータの具体値はバランス定数テーブルで管理しなければならない（SHALL）。

#### Scenario: Charge のメタデータ取得
- **WHEN** スキルID `blade-charge` のメタデータを参照する
- **THEN** targeting が `'direction'` で、cooldown, distance, damage, duration が定義されている

### Requirement: Charge ダッシュ移動
サーバーは Charge 発動時、ヒーローをターゲット方向に向かって `distance` 分だけ `duration` 秒かけて直線移動させなければならない（SHALL）。ダッシュ中もヒーローの位置は毎 tick 更新されなければならない（SHALL）。ダッシュ中のヒーローの facing はダッシュ方向に固定されなければならない（SHALL）。

#### Scenario: Charge による直線ダッシュ
- **WHEN** BLADE が位置 (100, 200) で右方向 (1, 0) に Charge を発動する（distance = 300, duration = 0.3）
- **THEN** 0.3 秒かけて (400, 200) まで直線移動する

#### Scenario: ダッシュ中の位置同期
- **WHEN** Charge ダッシュ中に 0.1 秒経過する（distance = 300, duration = 0.3）
- **THEN** ヒーローの位置が移動経路上の 1/3 地点に更新され、クライアントに同期される

### Requirement: Charge 中の移動入力無視
ダッシュ中はプレイヤーの移動入力（WASD）を無視しなければならない（SHALL）。ダッシュ完了後に通常の移動入力処理を再開しなければならない（SHALL）。

#### Scenario: ダッシュ中の WASD 無視
- **WHEN** Charge ダッシュ中にプレイヤーが WASD で移動入力する
- **THEN** 移動入力は無視され、ダッシュ経路通りに移動を続ける

### Requirement: Charge 接触ダメージ
ダッシュ中にヒーローの判定円が敵エンティティ（ヒーロー・ミニオン）の判定円と重なった場合、`damage` 分のダメージを与えなければならない（SHALL）。同一の敵には1回のダッシュで最大1回しかダメージを与えてはならない（SHALL）。タワーにはダメージを与えてはならない（SHALL）。

#### Scenario: ダッシュ中の敵ヒーローへのダメージ
- **WHEN** Charge ダッシュ中に敵ヒーローの判定円と重なる
- **THEN** 敵ヒーローに damage 分のダメージが1回適用される

#### Scenario: 同一敵への重複ダメージ防止
- **WHEN** Charge ダッシュ中に同じ敵ヒーローの判定円と2回重なる
- **THEN** ダメージは最初の1回のみ適用される

#### Scenario: タワーへのダメージなし
- **WHEN** Charge ダッシュ中にタワーの判定円と重なる
- **THEN** タワーにダメージは適用されない

### Requirement: Charge ワールド境界制限
ダッシュ移動先がワールド境界を超える場合、境界位置でダッシュを停止しなければならない（SHALL）。

#### Scenario: ワールド端でのダッシュ停止
- **WHEN** ワールド右端付近で右方向に Charge を発動し、移動先がワールド外になる
- **THEN** ワールド右端でダッシュが停止する
