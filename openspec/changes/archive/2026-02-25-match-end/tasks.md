## 1. サーバー: 試合フェーズ管理

- [x] 1.1 `GameRoomState` に `matchPhase` (`'waiting' | 'playing' | 'finished'`) と `winnerTeam` (`'' | 'blue' | 'red'`) を `@type` フィールドとして追加（specs: match-end）
- [x] 1.2 `gameStarted: boolean` を廃止し、`matchPhase` に統合。`onJoin` で `matchPhase = 'playing'` に変更（specs: match-end）
- [x] 1.3 `gameUpdate` 冒頭の `if (!this.state.gameStarted)` を `if (this.state.matchPhase !== 'playing')` に変更（specs: match-end）
- [x] 1.4 `onMessage` の入力受付に `matchPhase === 'playing'` ガードを追加（specs: match-end）

## 2. サーバー: 勝敗判定

- [x] 2.1 `GameRoom` に汎用 `endMatch(winnerTeam: string)` メソッドを追加 — `matchPhase = 'finished'`、`winnerTeam` を設定する一元的な終了処理（specs: match-end）
- [x] 2.2 `gameUpdate` の末尾に `checkTowerDestroyed()` を追加 — タワーの `dead` をチェックし、破壊されていれば `endMatch()` を呼ぶ（specs: tower-entity）
- [x] 2.3 勝敗判定のユニットテストを追加（blue タワー破壊 → red 勝利、red タワー破壊 → blue 勝利、両方生存 → playing 継続、endMatch 直接呼び出し）（specs: match-end）

## 3. クライアント: matchPhase 対応

- [x] 3.1 `OnlineGameMode` に `matchPhase` / `winnerTeam` の listen を追加し、コールバックで通知（specs: match-end）
- [x] 3.2 `GameMode` インターフェースに `onMatchEnd(callback: (winnerTeam: string) => void)` を追加（specs: match-end）
- [x] 3.3 `LobbyScene` の `gameStarted` listen を `matchPhase` listen に置き換え（specs: match-end）

## 4. クライアント: VICTORY / DEFEAT オーバーレイ

- [x] 4.1 `GameScene` に `showMatchEndOverlay(winnerTeam: string)` メソッドを追加 — 半透明オーバーレイ + VICTORY/DEFEAT テキスト + 「Back to Lobby」ボタン（specs: match-end-ui）
- [x] 4.2 `onMatchEnd` コールバックから `showMatchEndOverlay` を呼び出す（specs: match-end-ui）
- [x] 4.3 オーバーレイ表示中はゲーム入力（移動・攻撃）を無効化する（specs: match-end-ui）
- [x] 4.4 「Back to Lobby」クリック時に `room.leave()` → `this.scene.start('LobbyScene')` を実行（specs: match-end-ui）

## 5. 統合テスト

- [x] 5.1 サーバー統合テスト: タワー破壊 → matchPhase 変更 → ゲームロジック停止を検証（specs: match-end, lane-creeps）
- [x] 5.2 既存テストの修正: `gameStarted` 参照を `matchPhase` に更新して全テスト PASS を確認（specs: match-end）
