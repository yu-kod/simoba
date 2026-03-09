## ADDED Requirements

### Requirement: 直進（linear）プロジェクタイルモード
`ProjectileSchema` に飛行モードを示す `mode` フィールド（`'homing' | 'linear'`、デフォルト `'homing'`）を追加しなければならない（SHALL）。`mode: 'linear'` のプロジェクタイルは `dirX`, `dirY` 方向に毎フレーム `speed * deltaTime` 分だけ直進しなければならない（SHALL）。`targetId` による追尾は行わない。

#### Scenario: linear モードのプロジェクタイルが直進する
- **WHEN** mode='linear', dirX=1, dirY=0, speed=800 のプロジェクタイルが deltaTime=0.016 で更新される
- **THEN** x が 12.8px 増加し、y は変化しない

#### Scenario: homing モードは従来通り動作する
- **WHEN** mode='homing' のプロジェクタイルが更新される
- **THEN** targetId の現在位置に向かって追尾移動する（既存動作と同一）

### Requirement: ProjectileSchema の拡張フィールド
`ProjectileSchema` に以下のフィールドを追加しなければならない（SHALL）：`mode: string`（'homing' | 'linear'）、`dirX: float32`（直進方向X）、`dirY: float32`（直進方向Y）、`maxRange: float32`（最大飛行距離、0=無制限）、`pierceRemaining: int16`（残り貫通回数）。

#### Scenario: linear プロジェクタイルのフィールド
- **WHEN** Pierce Shot でプロジェクタイルが生成される
- **THEN** mode='linear', dirX/dirY に正規化方向ベクトル, maxRange=600, pierceRemaining=3 がセットされる

#### Scenario: homing プロジェクタイルのデフォルト値
- **WHEN** 通常攻撃でプロジェクタイルが生成される
- **THEN** mode='homing', dirX=0, dirY=0, maxRange=0, pierceRemaining=0 のデフォルト値を持つ

### Requirement: 射程による自動除去
`mode: 'linear'` のプロジェクタイルは累計移動距離を追跡し、`maxRange` を超えた時点で除去しなければならない（SHALL）。累計移動距離はサーバーサイドで管理し、Schema には含めない。

#### Scenario: 最大射程で除去される
- **WHEN** maxRange=600 の linear プロジェクタイルが合計 600px 以上移動した
- **THEN** プロジェクタイルが MapSchema から除去される

### Requirement: 貫通ヒット判定
`pierceRemaining > 0` のプロジェクタイルは、敵エンティティ（ヒーロー・タワー・ミニオン）との衝突時にダメージを与えた後も飛行を継続しなければならない（SHALL）。同じエンティティへの二重ヒットを防止するため、ヒット済みエンティティIDをサーバーサイドで追跡しなければならない（SHALL）。`pierceRemaining` をヒットごとに減算し、0 になった時点でプロジェクタイルを除去しなければならない（SHALL）。

#### Scenario: 貫通してダメージを与え続ける
- **WHEN** pierceRemaining=3 のプロジェクタイルが敵Aにヒットする
- **THEN** 敵Aにダメージが適用され、pierceRemaining が 2 に減算され、プロジェクタイルは飛行を継続する

#### Scenario: 貫通回数上限で除去される
- **WHEN** pierceRemaining=1 のプロジェクタイルが敵にヒットする
- **THEN** ダメージ適用後、pierceRemaining が 0 になりプロジェクタイルが除去される

#### Scenario: ヒット済みエンティティをスキップする
- **WHEN** プロジェクタイルが既にヒットしたエンティティの判定範囲内を通過する
- **THEN** 追加ダメージは発生せず、pierceRemaining は変化しない

### Requirement: linear プロジェクタイルの全敵衝突判定
`mode: 'linear'` のプロジェクタイルは `targetId` ではなく、飛行経路上のすべての敵チームエンティティに対して衝突判定を行わなければならない（SHALL）。味方エンティティには衝突しない（SHALL）。

#### Scenario: 経路上の敵すべてに判定される
- **WHEN** linear プロジェクタイルが飛行中に、経路上に敵ヒーロー2体と味方ヒーロー1体がいる
- **THEN** 敵ヒーロー2体に対して衝突判定が行われ、味方ヒーローはスキップされる
