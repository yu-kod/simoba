## ADDED Requirements

### Requirement: 右クリックによるターゲット指定
右クリック時のワールド座標と敵エンティティの `position` + `radius` を用いてクリックヒットテストを行い、ターゲットを指定しなければならない（SHALL）。複数の敵がクリック位置にヒットした場合、クリック位置に最も近い敵を選択しなければならない（SHALL）。ヒットする敵がいない場合（地面クリック）は `null` を返さなければならない（SHALL）。

#### Scenario: 敵エンティティ上を右クリックする
- **WHEN** 右クリックのワールド座標が敵の `position` から `radius` 以内にある
- **THEN** その敵がターゲットとして返される

#### Scenario: 地面を右クリックする
- **WHEN** 右クリックのワールド座標がどの敵の `radius` 内にもない
- **THEN** ターゲットは `null` を返す

#### Scenario: 複数の敵が重なっている位置を右クリックする
- **WHEN** 右クリックのワールド座標が複数の敵の `radius` 内にある
- **THEN** クリック位置に最も近い敵がターゲットとして返される

### Requirement: 攻撃状態マシン
ヒーローは `attackTargetId: string | null` で現在のターゲットを保持しなければならない（SHALL）。ターゲット指定・距離判定・クールダウンに基づいて以下の状態遷移を行わなければならない（SHALL）。

#### Scenario: 敵を右クリックしてターゲットが attackRange 内
- **WHEN** 敵を右クリックし、ターゲットとの距離が `attackRange` 以内である
- **THEN** `attackTargetId` にターゲットの ID が設定され、攻撃ループが開始される

#### Scenario: 敵を右クリックしてターゲットが attackRange 外
- **WHEN** 敵を右クリックし、ターゲットとの距離が `attackRange` を超えている
- **THEN** `attackTargetId` は `null` のまま、facing のみターゲット方向に更新される。攻撃モーション・ダメージは一切発生しない

#### Scenario: 攻撃ループ中にターゲットが attackRange 外に出る
- **WHEN** 攻撃ループ中にターゲットとの距離が `attackRange` を超える
- **THEN** `attackTargetId` が `null` に戻り、攻撃が即終了する

#### Scenario: 地面を右クリックする
- **WHEN** 地面を右クリックする（ターゲット `null`）
- **THEN** クリック方向に facing が更新され、攻撃は発生しない

### Requirement: 攻撃距離判定
攻撃距離はヒーロー center 間の距離から両者の `radius` を差し引いた値で計算しなければならない（SHALL）。この実効距離が `attackRange` 以下であれば攻撃可能と判定しなければならない（SHALL）。

#### Scenario: 同サイズのヒーロー同士が接近
- **WHEN** BLADE（radius 22）と BOLT（radius 18）が center 間距離 100 で対面し、BLADE の attackRange が 60
- **THEN** 実効距離は 100 - 22 - 18 = 60 であり、attackRange 60 以内なので攻撃可能と判定される

#### Scenario: ターゲットが範囲外
- **WHEN** BLADE（radius 22）と BOLT（radius 18）が center 間距離 120 で対面し、BLADE の attackRange が 60
- **THEN** 実効距離は 120 - 22 - 18 = 80 であり、attackRange 60 を超えるので攻撃不可と判定される

### Requirement: 攻撃クールダウン
`attackSpeed`（attacks/sec）に基づくクールダウンを管理しなければならない（SHALL）。`attackCooldown` は毎フレーム `deltaTime` 分減少し、0 以下で攻撃可能と判定しなければならない（SHALL）。攻撃発動時に `1 / attackSpeed` 秒にリセットしなければならない（SHALL）。

#### Scenario: クールダウンが 0 以下で攻撃可能
- **WHEN** `attackCooldown` が 0 以下でターゲットが `attackRange` 内にいる
- **THEN** 攻撃が発動し、ダメージイベントが発行される

#### Scenario: クールダウン中は攻撃不可
- **WHEN** `attackCooldown` が 0 より大きい
- **THEN** 攻撃は発動せず、ダメージイベントは発行されない

#### Scenario: 攻撃発動後にクールダウンがリセットされる
- **WHEN** attackSpeed が 0.8 (attacks/sec) で攻撃が発動する
- **THEN** `attackCooldown` が `1 / 0.8 = 1.25` 秒にリセットされる

#### Scenario: クールダウンがフレームごとに減少する
- **WHEN** `attackCooldown` が 1.0 で deltaTime が 0.016（約60fps）
- **THEN** `attackCooldown` が 0.984 に更新される

### Requirement: ダメージ適用
ダメージを受けたエンティティの HP を `attackDamage` 分減少させる純粋関数を提供しなければならない（SHALL）。HP は 0 未満にならないよう下限クランプしなければならない（SHALL）。

#### Scenario: 通常ダメージ
- **WHEN** HP 650 のエンティティに 60 ダメージを適用する
- **THEN** HP が 590 に更新される

#### Scenario: HP が 0 以下にならない
- **WHEN** HP 30 のエンティティに 60 ダメージを適用する
- **THEN** HP が 0 に更新される（負の値にならない）

#### Scenario: イミュータブルな更新
- **WHEN** ダメージを適用する
- **THEN** 元のエンティティオブジェクトは変更されず、新しいオブジェクトが返される

### Requirement: 攻撃中の facing 制御
攻撃中（`attackTargetId` が設定済み）はヒーローの facing をターゲット方向に固定しなければならない（SHALL）。移動方向ではなくターゲット方向を優先しなければならない（SHALL）。

#### Scenario: 攻撃中にターゲット方向を向く
- **WHEN** ヒーローが攻撃中で、ターゲットがヒーローの右方向にいる
- **THEN** facing が 0（右方向のラジアン）に更新される

#### Scenario: 攻撃中に移動しても facing はターゲット方向
- **WHEN** ヒーローが攻撃中（`canMoveWhileAttacking === true`）で WASD で上方向に移動している
- **THEN** facing は移動方向ではなくターゲット方向に固定される

### Requirement: 移動中攻撃フラグ
`HeroDefinition` に `canMoveWhileAttacking: boolean` を定義しなければならない（SHALL）。`true` の場合は攻撃中も WASD 移動が可能、`false` の場合は攻撃中に WASD 入力があると移動を優先して攻撃をキャンセルしなければならない（SHALL）。

#### Scenario: canMoveWhileAttacking が true のヒーローが攻撃中に移動する
- **WHEN** BLADE（`canMoveWhileAttacking === true`）が攻撃中に WASD で移動入力がある
- **THEN** 移動が実行され、攻撃ループも継続する

#### Scenario: canMoveWhileAttacking が false のヒーローが攻撃中に移動する
- **WHEN** `canMoveWhileAttacking === false` のヒーローが攻撃中に WASD で移動入力がある
- **THEN** 移動が優先され、`attackTargetId` が `null` に戻り攻撃がキャンセルされる

### Requirement: 攻撃エフェクトの抽象化
攻撃エフェクトは共通インターフェース `AttackEffectRenderer` で抽象化し、差し替え可能でなければならない（SHALL）。エフェクトのパラメータはダメージ判定パラメータとは独立に定義しなければならない（SHALL）。ダメージ判定はエフェクトの有無や状態に一切依存してはならない（SHALL NOT）。

#### Scenario: 攻撃発動時にエフェクトが再生される
- **WHEN** ダメージイベントが発行される
- **THEN** `AttackEffectRenderer.play()` が呼ばれ、視覚エフェクトが再生される

#### Scenario: エフェクトが差し替え可能
- **WHEN** `MeleeSwingRenderer` の代わりに別の `AttackEffectRenderer` 実装を設定する
- **THEN** ダメージ判定ロジックに変更なくエフェクトのみが変わる

#### Scenario: エフェクトなしでもダメージが発生する
- **WHEN** `AttackEffectRenderer` が設定されていない場合
- **THEN** ダメージ判定とダメージ適用は通常通り動作する

### Requirement: 被ダメージエフェクト
ダメージを受けたエンティティにヒットフラッシュを表示しなければならない（SHALL）。

#### Scenario: ダメージ受信時にフラッシュ
- **WHEN** エンティティがダメージを受ける
- **THEN** エンティティの描画が一瞬白くフラッシュし、元の色に戻る
