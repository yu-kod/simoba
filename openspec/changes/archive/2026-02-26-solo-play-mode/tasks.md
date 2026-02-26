## 1. GameMode インターフェース簡素化 & オフラインコード削除

- [x] 1.1 `GameMode` インターフェースからオフライン専用メソッドを削除する（`sendLocalState`, `sendDamageEvent`, `sendProjectileSpawn`, `onRemotePlayerUpdate`, `onRemotePlayerJoin`, `onRemotePlayerLeave`, `onRemoteDamage`, `onRemoteProjectileSpawn`）[specs/online-multiplayer]
- [x] 1.2 `OfflineGameMode` クラスを削除する [specs/online-multiplayer]
- [x] 1.3 `OnlineGameMode` から不要になったメソッド実装を削除し、`GameMode` に合わせる [specs/online-multiplayer]
- [x] 1.4 `GameScene` からオフライン専用コードパスを削除する（`updateOfflineHero`, `updateOfflineCombat`, offline broadcast 等） [specs/online-multiplayer]
- [x] 1.5 `NetworkBridge` の Legacy callback セクションを削除する [specs/online-multiplayer]
- [x] 1.6 `localSessionId` の型を `string | null` から `string` に変更する（オフラインモード廃止のため null 不要） [specs/online-multiplayer]

## 2. Solo モードのサーバー実装

- [x] 2.1 `GameRoom.onCreate` で `options.mode === 'solo'` 時に `maxClients = 1` を設定する [specs/solo-play-mode]
- [x] 2.2 `GameRoom.onJoin` で solo モード時に即座に `matchPhase = 'playing'` に遷移しタワーを配置する [specs/solo-play-mode]
- [x] 2.3 `addBotHero()` を実装する — 敵チームに Bot ヒーローを `HeroSchema` で追加し、ID は `bot-<team>-<index>` 形式 [specs/solo-play-mode]
- [x] 2.4 solo モード `onJoin` 後に `addBotHero()` を呼び出して敵チームに Bot を1体追加する [specs/solo-play-mode]

## 3. ServerBotSystem 実装

- [x] 3.1 `ServerBotSystem` を新規作成し、Bot ヒーローの一覧を取得する仕組みを作る [specs/solo-play-mode]
- [x] 3.2 Bot AI のターゲット選択ロジックを実装する（最寄りの敵エンティティを探す） [specs/solo-play-mode]
- [x] 3.3 Bot の `InputMessage` 生成ロジックを実装する（射程外: moveDir 設定、射程内: attackTargetId 設定） [specs/solo-play-mode]
- [x] 3.4 死亡中の Bot は入力を生成しないガードを追加する [specs/solo-play-mode]
- [x] 3.5 `GameRoom.gameUpdate` ループに `ServerBotSystem` を組み込む [specs/solo-play-mode]

## 4. LobbyScene の Solo Play ボタン

- [x] 4.1 LobbyScene に「Solo Play」ボタンを追加する [specs/lobby-scene]
- [x] 4.2 Solo Play ボタンクリック時に `{ mode: 'solo', heroType }` でサーバーに接続する [specs/lobby-scene]
- [x] 4.3 接続失敗時のエラーメッセージ表示とメニュー復帰を実装する [specs/lobby-scene]

## 5. ユニットテスト

- [x] 5.1 `ServerBotSystem` のユニットテストを作成する（ターゲット選択、InputMessage 生成、死亡時スキップ） [specs/solo-play-mode]
- [x] 5.2 `GameRoom` の solo モード分岐のユニットテストを作成する（maxClients 設定、即時開始、Bot 追加） [specs/solo-play-mode]
- [x] 5.3 `GameMode` インターフェース変更に伴う既存テストの修正 [specs/online-multiplayer]
