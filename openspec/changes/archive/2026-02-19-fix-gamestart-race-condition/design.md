## Context

現在の「ゲーム開始通知」はサーバーが `broadcast('gameStart')` メッセージを `onJoin` 内で即時送信する方式。Colyseus の `joinOrCreate()` が解決した後にクライアントが `room.onMessage('gameStart', ...)` を登録するため、2人目のプレイヤーはメッセージを受け取れない。

以前は `onStateChange` で players 数を監視する方式だったが、lobby PR レビュー時に「明示的なメッセージの方がシンプル」として `onMessage` に変更されたことでデグレした。

## Goals / Non-Goals

**Goals:**
- 2人目のプレイヤーが確実にゲーム開始を検知できるようにする
- リスナー登録タイミングに依存しない、構造的にレースコンディションが起きない設計にする
- 既存のオフラインモードに影響を与えない

**Non-Goals:**
- マッチメイキングや Room 管理の変更
- 再接続・リジョイン機能
- 3人以上の対応

## Decisions

### Decision 1: state フラグ方式を採用（メッセージ方式を廃止）

**選択**: `GameRoomState` スキーマに `gameStarted: boolean` フラグを追加し、state 同期で通知する

**理由**: Colyseus の state 同期は `joinOrCreate()` 解決後に必ずクライアントに届く。schema のバイナリ差分同期はメッセージと異なり、接続確立後の全 state が保証される。これにより、リスナー登録タイミングのレースコンディションが**構造的に不可能**になる。

**却下した代替案**:
- **サーバー側遅延 (`setTimeout`)**: タイミング依存で脆弱。ネットワーク遅延が大きい場合に再発する
- **クライアント側で `joinOrCreate` 前にリスナー登録**: Colyseus の API 上不可能（Room オブジェクトが `joinOrCreate` の戻り値）
- **`onMessage` + 再送リクエスト**: 複雑度が増す上、再送タイミングにも同様のレースがある

### Decision 2: `onStateChange` で `gameStarted` を監視

**選択**: `LobbyScene` で `room.onStateChange` を使い `gameStarted === true` を検知する

**理由**:
- `onStateChange` は state が変更されるたびに発火し、初回の state sync も含む
- `joinOrCreate` 解決後に即座に登録すれば、既に `gameStarted === true` の場合も次の state patch で検知可能
- 既存の `OnlineGameMode.onSceneCreate()` で同様のパターンが使われており、実績がある

### Decision 3: デグレ防止としてサーバーテストを強化

**選択**: サーバーユニットテストで「broadcast は呼ばれない、state.gameStarted が true になる」ことを明示的に検証する

**理由**: 前回のデグレは PR レビューで方式を変更した際に発生した。`broadcast('gameStart')` が呼ばれないことをテストで保証することで、将来のリファクタリングで同じ問題が再発するのを防ぐ。

## Risks / Trade-offs

**[Risk] `onStateChange` が `gameStarted` 変更を含む patch を受信するまでの遅延** → Colyseus の state patch は次のサーバーフレーム（デフォルト ~50ms）で送信されるため、体感上の遅延は無視できる。現行の `broadcast` も同程度の遅延がある。

**[Risk] `gameStarted` フラグのリセット漏れ** → 現行の Room ライフサイクルでは Room が `onCreate` で毎回新規作成されるため、リセット不要。将来 Room 再利用を導入する場合は `onDispose` でのリセットが必要。

**[Trade-off] スキーマサイズの微増** → `boolean` 1フィールド（1バイト）の追加。影響は無視できる。
