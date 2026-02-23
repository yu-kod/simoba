### Requirement: InterpolationBuffer によるエンティティ補間
`InterpolationBuffer` クラスは、サーバースナップショットをリングバッファ（最大 10 件）に蓄積し、遅延レンダリング時刻（`now() - INTERPOLATION_DELAY`）における位置を線形補間（lerp）で算出しなければならない（SHALL）。`INTERPOLATION_DELAY` はデフォルト 100ms とする。時刻はクライアントローカル時刻（`performance.now()`）を使用しなければならない（SHALL）。

#### Scenario: スナップショット未受信時は null を返す
- **WHEN** スナップショットが1件も push されていない
- **THEN** `getInterpolatedPosition()` は `null` を返す

#### Scenario: スナップショット1件のみの場合はその位置を返す
- **WHEN** スナップショットが1件のみ push されている
- **THEN** そのスナップショットの位置と facing がそのまま返される

#### Scenario: 2件以上のスナップショット間を補間する
- **WHEN** 複数のスナップショットがバッファにあり、レンダリング時刻がその間にある
- **THEN** 前後のスナップショットのローカル到着時刻を基に `t = (renderTime - a.localTime) / (b.localTime - a.localTime)` で算出し、`lerp(a, b, t)` で位置を返す

#### Scenario: レンダリング時刻が最新スナップショットより後の場合はクランプされる
- **WHEN** レンダリング時刻がバッファ内の最新スナップショットの到着時刻を超えている
- **THEN** 補間位置は最新スナップショットの位置にクランプされ、外挿（extrapolation）は行わない

#### Scenario: レンダリング時刻が最古のスナップショットより前の場合はクランプされる
- **WHEN** レンダリング時刻がバッファ内の最古のスナップショットの到着時刻より前
- **THEN** 補間位置は最古のスナップショットの位置にクランプされる

#### Scenario: スナップショット到着をまたいで連続的な動きが維持される
- **WHEN** 新しいスナップショットが到着する前後
- **THEN** レンダリング位置に不連続なジャンプは発生しない

### Requirement: InterpolationBuffer の facing 補間
`InterpolationBuffer` は position だけでなく `facing`（ラジアン）も補間しなければならない（SHALL）。facing の補間は角度の最短経路で lerp しなければならない（SHALL）。

#### Scenario: facing が 0 から π に変化した場合
- **WHEN** 前のスナップショットの facing = 0、後のスナップショットの facing = π で t = 0.5
- **THEN** 補間結果は π/2（最短経路で半回転）

#### Scenario: facing が -π 付近から π 付近に変化した場合（ラップアラウンド）
- **WHEN** 前のスナップショットの facing = -0.9π、後のスナップショットの facing = 0.9π で t = 0.5
- **THEN** 補間結果は ±π 付近（-π 経由の最短経路）であり、0 を経由しない

### Requirement: InterpolationBuffer の時刻関数注入
`InterpolationBuffer` のコンストラクタは、オプションで時刻取得関数（`() => number`）を受け取れなければならない（SHALL）。デフォルトは `performance.now()` とする。テスト時にモック可能にするためである。

#### Scenario: カスタム時刻関数を注入する
- **WHEN** `new InterpolationBuffer({ now: () => mockTime })` で生成する
- **THEN** `getInterpolatedPosition()` の内部時刻計算にモック関数が使用される

### Requirement: オフラインモードでの補間無効化
`InterpolationBuffer` はオンラインモード（`isServerAuthoritative === true`）でのみ動作しなければならない（SHALL）。オフラインモードでは従来通り直接 position が適用されなければならない（SHALL）。

#### Scenario: オフラインモードではリモート補間が動作しない
- **WHEN** オフラインモードでゲームが動作している
- **THEN** `InterpolationBuffer` は生成されず、エンティティ位置はフレームごとに直接適用される

#### Scenario: オンラインモードではリモート補間が動作する
- **WHEN** オンラインモードでリモートエンティティの状態更新を受信する
- **THEN** `InterpolationBuffer` に snapshot が push され、毎フレーム補間位置が計算される

### Requirement: ローカルヒーローの facing はクライアント即時反映
オンラインモードでローカルヒーローの position は InterpolationBuffer から補間されなければならない（SHALL）が、facing はクライアントが計算した値をそのまま使用しなければならない（SHALL）。これにより入力遅延のない即座の方向転換を実現する。

#### Scenario: ローカルヒーローの facing が即座に反映される
- **WHEN** ローカルプレイヤーがマウスを動かして aim 方向を変える
- **THEN** ローカルヒーローの facing はサーバーの往復遅延なく即座に更新される

### Requirement: Colyseus コールバックの queueMicrotask バッチング
Colyseus の per-property listen コールバックは `queueMicrotask` を使用してバッチングしなければならない（SHALL）。同一パッチ内の複数プロパティ変更を1回の通知にまとめることで、不要な処理を削減する。

#### Scenario: ヒーローの複数プロパティ変更が1回の通知にバッチされる
- **WHEN** 1つの Colyseus パッチで x, y, facing, hp が更新される
- **THEN** `notifyServerHeroUpdate` は1回だけ呼ばれる（4回ではなく）

#### Scenario: 弾の位置変更もバッチされる
- **WHEN** 1つの Colyseus パッチで複数の弾の位置が更新される
- **THEN** `notifyProjectilesChanged` は1回だけ呼ばれる

### Requirement: 弾（Projectile）の補間描画
弾もヒーローと同様に `InterpolationBuffer` を使用して補間描画しなければならない（SHALL）。各弾に個別の InterpolationBuffer を持ち、毎フレーム補間位置で描画する。弾が破棄された場合はバッファも削除される。

#### Scenario: 弾がスムーズに描画される
- **WHEN** サーバーから弾の位置更新が 20Hz で送られる
- **THEN** クライアントでは 60fps の補間描画でスムーズに弾が移動する

#### Scenario: 弾が破棄されたらバッファも削除される
- **WHEN** サーバーの projectile リストから弾が消える
- **THEN** 対応する InterpolationBuffer も削除される
