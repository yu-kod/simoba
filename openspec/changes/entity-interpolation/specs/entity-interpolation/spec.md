## ADDED Requirements

### Requirement: InterpolationBuffer によるリモートエンティティ補間
`InterpolationBuffer` クラスは、リモートエンティティのサーバースナップショットを `{ prev, target }` ペアでバッファリングし、時間ベースの線形補間（lerp）で中間位置を算出しなければならない（SHALL）。補間は固定遅延 `INTERPOLATION_DELAY`（デフォルト 100ms）を導入し、`prev.serverTime` から `target.serverTime` の間を `0.0〜1.0` の progress で lerp しなければならない（SHALL）。

#### Scenario: 最初のスナップショット受信時は即座に位置を設定する
- **WHEN** リモートエンティティの最初のサーバースナップショットが到着する
- **THEN** `prev` と `target` が同一スナップショットに設定され、補間 progress は 1.0（target 位置そのまま）になる

#### Scenario: 2つ目のスナップショット受信時に補間が開始される
- **WHEN** 2つ目のサーバースナップショットが到着する
- **THEN** `prev` が旧 target に、`target` が新スナップショットに更新され、progress が 0.0 にリセットされる

#### Scenario: フレーム更新で補間位置が計算される
- **WHEN** `getInterpolatedPosition(currentTime)` が呼ばれる
- **THEN** `progress = (currentTime - renderTime) / (target.serverTime - prev.serverTime)` で算出され、`lerp(prev.x, target.x, progress)` と `lerp(prev.y, target.y, progress)` が返される

#### Scenario: progress が 1.0 を超えた場合は target 位置でクランプされる
- **WHEN** 次のスナップショットが遅れて progress が 1.0 を超える
- **THEN** 補間位置は `target` の位置にクランプされ、外挿（extrapolation）は行わない

### Requirement: InterpolationBuffer の facing 補間
`InterpolationBuffer` は position だけでなく `facing`（ラジアン）も補間しなければならない（SHALL）。facing の補間は角度の最短経路で lerp しなければならない（SHALL）。

#### Scenario: facing が 0 から π に変化した場合
- **WHEN** prev.facing = 0、target.facing = π で progress = 0.5
- **THEN** 補間結果は π/2（最短経路で半回転）

#### Scenario: facing が -π 付近から π 付近に変化した場合（ラップアラウンド）
- **WHEN** prev.facing = -0.9π、target.facing = 0.9π で progress = 0.5
- **THEN** 補間結果は ±π 付近（-π 経由の最短経路）であり、0 を経由しない

### Requirement: InterpolationBuffer の時刻関数注入
`InterpolationBuffer` のコンストラクタは、オプションで時刻取得関数（`() => number`）を受け取れなければならない（SHALL）。デフォルトは `performance.now()` とする。テスト時にモック可能にするためである。

#### Scenario: カスタム時刻関数を注入する
- **WHEN** `new InterpolationBuffer({ now: () => mockTime })` で生成する
- **THEN** `getInterpolatedPosition()` の内部時刻計算にモック関数が使用される

### Requirement: Prediction Smoothing
`MovementPredictor` は `reconcile()` 結果と現在の予測位置の差が `SNAP_THRESHOLD`（デフォルト 200px）未満の場合、指数ブレンド（`smoothingFactor`/フレーム）で段階的に補正しなければならない（SHALL）。差が `SNAP_THRESHOLD` 以上の場合は即座にスナップしなければならない（SHALL）。

#### Scenario: 小さいズレ（閾値未満）は段階的に補正される
- **WHEN** reconcile 結果と予測位置の差が 50px（SNAP_THRESHOLD 未満）
- **THEN** 1フレーム後の位置は `current + (reconciled - current) * smoothingFactor` になる

#### Scenario: 大きいズレ（閾値以上）は即座にスナップする
- **WHEN** reconcile 結果と予測位置の差が 300px（SNAP_THRESHOLD 以上）
- **THEN** 位置は即座に reconcile 結果にスナップされる

#### Scenario: テレポート/リスポーン時はスナップする
- **WHEN** ヒーローが死亡→リスポーンでサーバー位置が大きく変わる
- **THEN** ズレが SNAP_THRESHOLD を超えるため即座にスナップされる

### Requirement: オフラインモードでの補間無効化
`InterpolationBuffer` および Prediction Smoothing はオンラインモード（`isServerAuthoritative === true`）でのみ動作しなければならない（SHALL）。オフラインモードでは従来通り直接 position が適用されなければならない（SHALL）。

#### Scenario: オフラインモードではリモート補間が動作しない
- **WHEN** オフラインモードでゲームが動作している
- **THEN** `InterpolationBuffer` は生成されず、エンティティ位置はフレームごとに直接適用される

#### Scenario: オンラインモードではリモート補間が動作する
- **WHEN** オンラインモードでリモートエンティティの状態更新を受信する
- **THEN** `InterpolationBuffer` に snapshot が push され、毎フレーム補間位置が計算される

### Requirement: 補間レートの異常値クランプ
スナップショット間隔（`target.serverTime - prev.serverTime`）が異常に短い（< 10ms）または長い（> 200ms）場合、補間計算はクランプされた値を使用しなければならない（SHALL）。

#### Scenario: スナップショット間隔が極端に短い
- **WHEN** `target.serverTime - prev.serverTime` が 5ms
- **THEN** 補間計算では最小値 10ms が使用される

#### Scenario: スナップショット間隔が極端に長い
- **WHEN** `target.serverTime - prev.serverTime` が 500ms
- **THEN** 補間計算では最大値 200ms が使用される
