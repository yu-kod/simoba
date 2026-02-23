## ADDED Requirements

### Requirement: WASD 8方向移動入力
入力システムは WASD キーの押下状態から正規化済み移動方向ベクトルを算出し `InputState.movement` として提供しなければならない（SHALL）。

#### Scenario: 単一キーで4方向移動
- **WHEN** W キーのみ押下中
- **THEN** `movement` は `{ x: 0, y: -1 }` を返す

#### Scenario: 2キー同時押下で斜め移動（正規化）
- **WHEN** W と D キーを同時に押下中
- **THEN** `movement` は `{ x: 0.707, y: -0.707 }` に近い正規化ベクトルを返す

#### Scenario: キー未押下
- **WHEN** WASD いずれも未押下
- **THEN** `movement` は `{ x: 0, y: 0 }` を返す

#### Scenario: 対向キー同時押下
- **WHEN** W と S を同時に押下中
- **THEN** 対向成分は相殺され `movement.y` は `0` を返す

### Requirement: マウスエイム方向
入力システムはマウスカーソルのスクリーン座標をワールド座標に変換し、ヒーロー位置からの正規化方向ベクトルを `InputState.aimDirection` として提供しなければならない（SHALL）。マウスのワールド座標は `InputState.aimWorldPosition` として提供しなければならない（SHALL）。

#### Scenario: マウスがヒーローの右上にある
- **WHEN** マウスのワールド座標がヒーロー位置の右上にある
- **THEN** `aimDirection` は右上を指す正規化ベクトルを返す

#### Scenario: マウスがヒーローと同一位置
- **WHEN** マウスのワールド座標がヒーロー位置と一致する
- **THEN** `aimDirection` はゼロベクトル `{ x: 0, y: 0 }` を返す

### Requirement: 右クリック通常攻撃
入力システムは右クリックイベントを検出し `InputState.attack` として提供しなければならない（SHALL）。

#### Scenario: 右クリック押下
- **WHEN** マウス右ボタンを押下
- **THEN** `attack` は `true` を返す

#### Scenario: 右クリック未押下
- **WHEN** マウス右ボタンが未押下
- **THEN** `attack` は `false` を返す

### Requirement: スキルターゲティング（Normal Cast）
スキルキー（Q/E/R）押下でターゲティングモードに入り、左クリックで対象位置を確定してスキルを発火しなければならない（SHALL）。右クリックでターゲティングをキャンセルしなければならない（SHALL）。

#### Scenario: Normal Cast でスキル発火
- **WHEN** Cast モードが `normal` でスキルキー Q を押下
- **THEN** `targeting.phase` は `targeting` に遷移し `targeting.skill` は `Q` となる
- **WHEN** 続けて左クリック
- **THEN** `targeting.phase` は `fired` に遷移し `targeting.target` にマウスのワールド座標が設定される

#### Scenario: Normal Cast 中に右クリックでキャンセル
- **WHEN** ターゲティングモード中（`targeting.phase` が `targeting`）に右クリック
- **THEN** `targeting.phase` は `cancelled` に遷移する

#### Scenario: ターゲティング中の移動
- **WHEN** ターゲティングモード中に WASD キーを押下
- **THEN** 移動入力は通常通り処理され、ターゲティング状態は維持される

#### Scenario: 別のスキルキーでターゲティング切り替え
- **WHEN** Q でターゲティングモード中に E を押下
- **THEN** ターゲティングが Q から E に切り替わる（`targeting.skill` が `E` に変更）

### Requirement: スキルターゲティング（Quick Cast）
Quick Cast モードでは、スキルキーを離した瞬間にマウス位置に向けてスキルを発火しなければならない（SHALL）。

#### Scenario: Quick Cast でスキル発火
- **WHEN** Cast モードが `quick` でスキルキー E を押下して離す
- **THEN** キーリリース時に `targeting.phase` は `fired` に遷移し `targeting.target` にマウスのワールド座標が設定される

#### Scenario: Quick Cast 中の右クリックでキャンセル
- **WHEN** Quick Cast モードでスキルキーを押下中に右クリック
- **THEN** `targeting.phase` は `cancelled` に遷移し、キーリリース時にスキルは発火されない

### Requirement: ドッジダッシュ入力
入力システムは Space キーの押下を検出し `InputState.dodge` として提供しなければならない（SHALL）。

#### Scenario: Space 押下
- **WHEN** Space キーを押下
- **THEN** `dodge` は `true` を返す

#### Scenario: Space 未押下
- **WHEN** Space キーが未押下
- **THEN** `dodge` は `false` を返す

### Requirement: InputState の Phaser 非依存性
`InputState` 型および入力状態の変換ロジック（移動方向の正規化、エイム方向の算出）は Phaser に依存してはならない（SHALL NOT）。Phaser 固有の処理はアダプター層に限定しなければならない（SHALL）。

#### Scenario: ドメイン層で InputState を消費
- **WHEN** ゲームロジックが `InputState` を受け取る
- **THEN** Phaser の型やモジュールへの import なしに入力データにアクセスできる

#### Scenario: 単体テストで InputState を構築
- **WHEN** ユニットテストで入力状態を検証する
- **THEN** Phaser モックなしで `InputState` を手動構築してテスト可能
