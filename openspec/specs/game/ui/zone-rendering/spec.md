# Specification

## Purpose
ゾーンレンダリングシステム仕様 — サーバーのゾーン状態をクライアントで同期・描画するためのビジュアルレジストリとレンダリング

## Requirements

### Requirement: ゾーンビジュアル定義レジストリ
システムは skillId からビジュアル定義（色、アルファ、ボーダースタイル）へのマッピングを提供する `ZONE_VISUALS` レジストリを提供しなければならない（SHALL）。新しいゾーンスキルはレンダラーコードを変更せずにこのレジストリにエントリを追加することで対応する。

#### Scenario: Slow Field のビジュアルルックアップ
- **WHEN** skillId `aura-slow-field` のゾーンがレンダリングされる
- **THEN** レンダラーは `aura-slow-field` に登録されたビジュアル定義（紫系）を使用する

#### Scenario: Bolt Trap のビジュアルルックアップ
- **WHEN** skillId `bolt-trap` のゾーンがレンダリングされる
- **THEN** レンダラーは `bolt-trap` に登録されたビジュアル定義（黄系）を使用する

#### Scenario: 不明な skillId のフォールバック
- **WHEN** ゾーンがレジストリに見つからない skillId を持つ
- **THEN** レンダラーはクラッシュせずにデフォルトのフォールバックビジュアル（灰色）を使用する

### Requirement: ゾーン状態同期
システムは `GameRoomState.zones` の Colyseus onAdd/onRemove コールバックを介してサーバーからクライアントへゾーン状態を同期しなければならない（SHALL）。

#### Scenario: サーバーでゾーンが生成される
- **WHEN** サーバーが `GameRoomState.zones` にゾーンを追加する
- **THEN** クライアントはゾーン状態を受信し、同フレームまたは次フレームでレンダリングを開始する

#### Scenario: サーバーでゾーンが削除される
- **WHEN** サーバーが `GameRoomState.zones` からゾーンを削除する
- **THEN** クライアントは即座にゾーンのレンダリングを停止する

### Requirement: ゾーン円レンダリング
システムは各アクティブゾーンをゾーンの (x, y) 位置にゾーンの半径で半透明の塗りつぶし円としてレンダリングしなければならない（SHALL）。塗りつぶしの色とアルファはビジュアルレジストリを介してゾーンの skillId により決定される。

#### Scenario: 永続ゾーンのレンダリング
- **WHEN** slow-field ゾーン（半径 200）が位置 (300, 100) に存在する
- **THEN** レンダラーは (300, 100) に半径 200 で slow-field の登録済み色とアルファを使用して塗りつぶし円を描画する

#### Scenario: Trap ゾーンのレンダリング
- **WHEN** bolt-trap ゾーン（半径 80）が位置 (400, 200) に存在する
- **THEN** レンダラーは (400, 200) に半径 80 で trap の登録済み色とアルファを使用して塗りつぶし円を描画する

### Requirement: ゾーンレンダリング深度
システムはゾーンをヒーローと弾丸の下、地面レイヤーの上にレンダリングしなければならない（SHALL）。ゲームプレイ上重要なエンティティをゾーンが遮らないようにする。

#### Scenario: ゾーン深度の順序
- **WHEN** ゾーンとヒーローが同じ位置で重なる
- **THEN** ヒーローがゾーンの上にレンダリングされる

### Requirement: GameMode ゾーンコールバックインターフェース
`GameMode` インターフェースは `onServerZoneAdd` と `onServerZoneRemove` コールバックを公開しなければならない（SHALL）。`GameScene` がゾーンのライフサイクルイベントに対応できるようにするため。

#### Scenario: GameScene がゾーンイベントを購読する
- **WHEN** GameScene が `gameMode.onServerZoneAdd(callback)` を呼ぶ
- **THEN** ゾーンが追加されるたびに `ServerZoneState` オブジェクトでコールバックが呼び出される

#### Scenario: GameScene が破棄時に購読を解除する
- **WHEN** ゲームモードが破棄される
- **THEN** すべてのゾーンリスナーがクリーンアップされる
