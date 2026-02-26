## Context

現在 `GameRoom.gameUpdate` はタワーが破壊されても試合を継続する。`GameRoomState` にはフェーズ管理がなく、クライアントに試合結果を通知する仕組みもない。タワー破壊 → 勝敗判定 → 結果表示 → ロビーに戻るフローを追加する。

既存のシーン遷移: `BootScene` → `LobbyScene` → `GameScene`。試合終了後は `LobbyScene` に戻す。

## Goals / Non-Goals

**Goals:**
- タワー破壊で試合終了を判定する（サーバー権威）
- 試合終了後に全ゲームロジックを停止する
- VICTORY / DEFEAT オーバーレイを表示する
- オーバーレイからロビー画面に戻れる

**Non-Goals:**
- Sudden Death（時間制限による強制終了）
- マッチタイマー UI
- 試合結果のスコア表示（KDA 等）
- ルームロック・再接続（#148 で対応）
- オフラインモードの勝敗判定（オンラインファースト方針、#143）

## Decisions

### 1. 試合終了の汎用メソッド: `endMatch(winnerTeam)`

**選択**: `GameRoom` に `endMatch(winnerTeam: string)` メソッドを用意する。このメソッドが `matchPhase = 'finished'` と `winnerTeam` の設定を一元的に行う。タワー破壊チェックはこのメソッドの呼び出し元の1つに過ぎない。

**理由**: 将来的に試合終了のトリガーが複数追加される可能性がある（プレイヤー切断/放置による強制終了、Sudden Death、サレンダー等）。終了ロジックを1箇所に集約することで、どのトリガーからも同じ終了フローが走る。

**タワー破壊チェック**: `gameUpdate` の末尾で `checkTowerDestroyed()` を呼び、タワーが破壊されていれば `endMatch()` を呼ぶ。チェックと終了処理を分離する。

### 2. 試合結果の通知方法: Colyseus state sync + メッセージ

**選択**: `GameRoomState` に `matchPhase` (`'waiting' | 'playing' | 'finished'`) と `winnerTeam` (`'' | 'blue' | 'red'`) を `@type` フィールドとして追加。クライアントは state 変更を listen して UI を更新する。

**理由**: 既存の Colyseus state sync パターンと一致。`matchPhase` は全クライアントが同じ値を参照するため、state に含めるのが自然。専用メッセージ (`broadcast`) を使う方法もあるが、切断→再接続時に state から復元できる利点がある。

### 3. 試合終了後の停止: `matchPhase` ガード

**選択**: `gameUpdate` の冒頭で `if (this.state.matchPhase === 'finished') return` を追加。`onMessage` の入力受付も同様にガード。

**理由**: 最もシンプル。全てのゲームロジック（移動、攻撃、ミニオンスポーン、プロジェクタイル）が一括停止する。個別のシステムにフラグを渡す必要がない。

### 4. クライアント UI: Phaser Graphics オーバーレイ

**選択**: `GameScene` 内に Phaser の `Graphics` + `Text` で半透明オーバーレイを描画。「Back to Lobby」テキストボタンで `this.scene.start('LobbyScene')` を呼ぶ。

**理由**: 既存のジオメトリック描画スタイルと一致。React / DOM オーバーレイは Phase 1 では不要な複雑さ。LobbyScene は既に存在するのでシーン遷移先として使える。

**代替案**: 専用の `ResultScene` を作る → 結果表示だけのためにシーンを増やす必要はなく、GameScene 内のオーバーレイで十分。

### 5. `matchPhase` の3状態: `waiting` / `playing` / `finished`

**選択**: 既存の `gameStarted: boolean` を `matchPhase: string` に統合する。`waiting` = プレイヤー待ち、`playing` = 試合中、`finished` = 試合終了。

**理由**: `gameStarted` と `matchPhase` が別々に存在すると状態の整合性が複雑になる。1つの状態フィールドに統合することで状態遷移が明確になる。`gameStarted` は `matchPhase !== 'waiting'` で代替可能。

## Risks / Trade-offs

- **[Risk] `gameStarted` 廃止の影響範囲** → クライアント側で `gameStarted` を参照している箇所を `matchPhase` に置き換える必要あり。`OnlineGameMode` の `listen('gameStarted', ...)` を確認する。影響は限定的（LobbyScene のゲーム開始検知のみ）。

- **[Risk] ルーム未破棄** → 試合終了後もルームが存続する（全プレイヤーが `leave()` するまで）。Phase 1 では問題ないが、将来的にはタイムアウトで自動破棄が必要（#148 と合わせて対応）。

- **[Trade-off] オフラインモード非対応** → オンラインファースト方針（#143）に従い、オフラインモードの勝敗判定は実装しない。オフラインでタワーを壊しても試合は終了しない。
