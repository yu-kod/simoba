## Context

現在のシーン遷移は `BootScene → GameScene` の直接遷移で、GameScene の `initGameMode()` 内で `OnlineGameMode` をハードコードで生成している。オンライン対戦を行うには 2 人が同時にアクセスする必要があるが、待機画面がないためタイミングを合わせられない。

既存のネットワーク基盤:
- `NetworkClient`: Colyseus サーバーへの接続管理（`joinOrCreate('game')`）
- `OnlineGameMode` / `OfflineGameMode`: `GameMode` インタフェースの実装
- `GameRoom`（サーバー）: `maxClients = 2`、join 時にチーム自動割り当て
- `NetworkBridge`: GameMode のイベントを EntityManager/CombatManager に接続

## Goals / Non-Goals

**Goals:**
- 2人のプレイヤーが揃うまで待機できるロビー画面を提供する
- オンライン/オフラインのモード選択を UI で行えるようにする
- 既存の GameScene / GameMode インタフェースへの変更を最小限にする

**Non-Goals:**
- ヒーロー選択（デフォルト BLADE のまま）
- ルーム一覧表示やプライベートルーム
- マッチメイキングアルゴリズム
- 試合結果画面

## Decisions

### 1. LobbyScene を Phaser Scene として実装する（DOM UI ではなく）

**選択:** Phaser の Text/Graphics で UI を描画する
**理由:** 既存プロジェクトは Canvas のみのジオメトリックスタイル。HTML DOM を導入すると Phaser Scale.FIT との座標系が二重管理になり複雑化する。ボタンは Phaser の `setInteractive()` + pointer イベントで十分実現可能。
**代替案:** HTML オーバーレイ → Scale.FIT との座標管理が煩雑、プロジェクトの方針と合わない

### 2. GameMode の生成を LobbyScene で行い、シーンデータとして GameScene に渡す

**選択:** `this.scene.start('GameScene', { gameMode })` でデータ受け渡し
**理由:** GameScene は GameMode インタフェースにのみ依存しており、Online/Offline のどちらが渡されても同じコードで動作する。GameScene 内の `initGameMode()` を外部からの注入に置き換えるだけで済む。
**代替案:** グローバル状態やレジストリ → 不要な結合が増える

### 3. オンラインモード選択時に LobbyScene 内で Colyseus Room に接続する

**選択:** LobbyScene で `NetworkClient.connect()` を呼び、接続完了後に待機状態に遷移
**理由:** GameScene 開始前に接続を確立しておくことで、ゲーム開始時に即プレイ可能。接続失敗時はロビーでエラー表示でき、GameScene に影響しない。
**代替案:** GameScene 内で接続 → 現状と同じ問題（待機 UI がない）

### 4. サーバー側で `gameStart` メッセージを全クライアントにブロードキャストする

**選択:** `onJoin` で `players.size === maxClients` を検知し、全クライアントに `gameStart` を送信
**理由:** クライアント側で人数を監視するより、サーバーが権威的に「開始」を通知する方が信頼性が高い。将来のカウントダウンやマッチング条件追加にも対応しやすい。
**代替案:** クライアントが `onAdd` の数を監視 → 競合状態のリスク

### 5. LobbyScene の画面状態を enum で管理する

**選択:** `'menu' | 'connecting' | 'waiting' | 'starting' | 'error'` の状態マシン
**理由:** 各状態で表示する UI 要素が異なるため、状態ベースで描画を切り替えるのが明快。Phaser の `update()` ループで現在の状態に応じた描画を行う。

## Risks / Trade-offs

**[Risk] 接続失敗時の UX** → LobbyScene の `error` 状態でエラーメッセージを表示し、メニューに戻るボタンを用意する

**[Risk] ブラウザタブの前後でゲーム開始タイミングがずれる** → サーバーの `gameStart` メッセージで同期。クライアントは受信次第 GameScene に遷移するため、多少の遅延は許容範囲

**[Trade-off] LobbyScene で接続するため、GameScene の `OnlineGameMode.onSceneCreate()` から接続ロジックを分離する必要がある** → `OnlineGameMode` に room を外部から渡せるコンストラクタオプションを追加して対応

**[Trade-off] Phaser Text ベースの UI はスタイリングが制限される** → Phase 1 のテスト用途としては十分。本格的な UI は Phase 3 で対応（Issue #57）
