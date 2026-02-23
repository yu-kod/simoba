## MODIFIED Requirements

### Requirement: ステートスキーマ定義
Colyseus の `@type()` デコレータを使用して、Room 状態スキーマを定義しなければならない（SHALL）。プレイヤー状態は `position`（x, y）、`facing`（ラジアン）、`hp`、`maxHp`、`heroType`、`team`、`serverTime` を含まなければならない（SHALL）。`serverTime` は `float64` 型で、サーバーの `gameUpdate()` 実行時の monotonic timestamp（ミリ秒）を記録しなければならない（SHALL）。

#### Scenario: プレイヤー参加時に初期状態が設定される
- **WHEN** プレイヤーが Room に参加する
- **THEN** プレイヤーのスキーマに初期位置（チームに応じたスポーン位置）、facing 0、最大 HP、デフォルトヒーロータイプ、チーム割り当て、serverTime 0 が設定される

#### Scenario: 状態変更がバイナリ差分で同期される
- **WHEN** プレイヤーの position が変更される
- **THEN** Colyseus の組み込みバイナリ差分同期により、他のクライアントに変更が伝播される

#### Scenario: serverTime がシミュレーションループごとに更新される
- **WHEN** サーバーの `gameUpdate()` が実行される
- **THEN** 全ヒーローの `serverTime` に現在の `Date.now()` が書き込まれる

### Requirement: プレイヤー位置・facing の同期
ローカルプレイヤーの `position` と `facing` をサーバーに送信しなければならない（SHALL）。送信レートはフレームレートより低い固定間隔（20Hz）でなければならない（SHALL）。リモートプレイヤーの状態変更を受信して描画に反映しなければならない（SHALL）。

`handleServerHeroUpdate` はローカル・リモートの区別なく全ヒーローに対して同一の状態適用パスを実行しなければならない（SHALL）。処理は以下の3ステップ構造でなければならない（SHALL）:

1. **ensureEntityExists** — エンティティおよび HeroRenderer が未作成の場合に作成する。ローカルヒーローの初回 ID リマップもこのステップで行う
2. **applyServerState** — サーバーから受信した全フィールド（type, radius, position, facing, hp, maxHp, dead, attackTargetId, respawnTimer）を `updateEntity` で一括適用する。この関数は1箇所のみに存在しなければならない（SHALL）
3. **applyLocalOverrides** — ローカルヒーローの場合のみ: クライアント予測位置による position 上書き、カメラ追従、prediction state リセットを実行する。リモートエンティティの場合: `InterpolationBuffer` にスナップショットを push する

`isLocal` による分岐は Step 3 のみに限定しなければならない（SHALL）。Step 1・Step 2 では local/remote を区別してはならない（SHALL NOT）。

リモートエンティティの描画位置は `InterpolationBuffer` から毎フレーム取得した補間位置を使用しなければならない（SHALL）。`HeroRenderer.sync()` に渡される position はサーバー生値ではなく補間済みの値でなければならない（SHALL）。

#### Scenario: ローカルプレイヤーの位置を送信する
- **WHEN** ローカルプレイヤーが移動する
- **THEN** 50ms 間隔で position と facing がサーバーに送信される

#### Scenario: リモートプレイヤーの位置を受信して描画する
- **WHEN** サーバーからリモートプレイヤーの position/facing 更新を受信する
- **THEN** スナップショットが InterpolationBuffer に push され、毎フレーム補間位置で HeroRenderer が描画される

#### Scenario: リモートプレイヤーが参加したときに描画が開始される
- **WHEN** リモートプレイヤーが Room に参加する
- **THEN** リモートプレイヤー用の HeroRenderer と InterpolationBuffer が生成され、マップ上に表示される

#### Scenario: リモートプレイヤーが退室したときに描画が停止される
- **WHEN** リモートプレイヤーが Room から退室する
- **THEN** リモートプレイヤーの HeroRenderer と InterpolationBuffer が破棄され、マップから消える

#### Scenario: ローカルヒーローとリモートヒーローに同一の状態適用パスが実行される
- **WHEN** サーバーからヒーロー状態更新を受信する
- **THEN** ローカル・リモートに関わらず applyServerState で全フィールドが一括適用される

#### Scenario: 新フィールド追加時に1箇所の変更で全ヒーローに反映される
- **WHEN** サーバースキーマに新しいフィールドが追加される
- **THEN** applyServerState の1箇所にフィールドを追加するだけで、ローカル・リモート両方のヒーローに反映される

#### Scenario: ローカルヒーローの予測位置が applyServerState の後に上書きされる
- **WHEN** クライアント予測が有効なローカルヒーローの状態更新を受信する
- **THEN** まず applyServerState でサーバー位置が適用され、その後 applyLocalOverrides で予測位置に上書きされる

#### Scenario: ローカルヒーローの初回 ID リマップが ensureEntityExists で実行される
- **WHEN** ローカルヒーローの sessionId が EntityManager の localHeroId と異なる状態で初回更新を受信する
- **THEN** ensureEntityExists ステップで remapLocalHeroToSession が実行される

#### Scenario: ServerHeroState に serverTime が含まれる
- **WHEN** クライアントが ServerHeroState を受信する
- **THEN** `serverTime` フィールドにサーバーのタイムスタンプが含まれており、InterpolationBuffer の時間計算に使用される
