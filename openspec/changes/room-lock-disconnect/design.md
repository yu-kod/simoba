## Context

現在の `GameRoom` はマッチ開始後も新規参加を受け付け、`onLeave` ではヒーローを即削除するだけで勝敗判定を行わない。試合中に切断されると、残されたプレイヤーは不利な状態で戦い続けることになる。

既存の試合終了フロー:
1. `checkTowerDestroyed()` がタワーの `dead` を検知
2. `endMatch(state, winnerTeam)` で `matchPhase = 'finished'`, `winnerTeam` を設定
3. クライアントが `matchPhase` の変更を listen → VICTORY/DEFEAT オーバーレイ表示

このフローを拡張して切断終了にも対応する。

## Goals / Non-Goals

**Goals:**
- マッチ開始後の途中参加をブロック（ルームロック）
- 試合中のプレイヤー切断でマッチ即終了（相手チーム勝利）
- 終了理由をクライアントに伝え、表示メッセージを分岐
- ソロモードでは切断＝ルーム終了のみ（勝敗判定なし）

**Non-Goals:**
- 再接続サポート（短いマッチでは待機コストが高い）
- 切断ペナルティシステム（Phase 1 では不要）
- 2v2 時の 1 人切断後の継続プレイ（即終了とする）

## Decisions

### 1. `matchEndReason` フィールドの追加

`GameRoomState` に `matchEndReason: string` を追加する。

| 値 | 意味 |
|---|---|
| `''` | 試合中（未終了） |
| `'tower_destroyed'` | 通常終了（タワー破壊） |
| `'player_disconnected'` | 切断終了 |

**理由**: 既存の `winnerTeam` だけでは終了原因を区別できない。クライアントは `matchEndReason` を見て表示メッセージを分岐する。

**代替案**: `winnerTeam` に `'disconnect_blue'` のような値を入れる → 既存の勝敗判定ロジックとの互換性が壊れるため却下。

### 2. ルームロックのタイミング

`onJoin` で `matchPhase = 'playing'` に遷移する直前に `this.lock()` を呼ぶ。

**理由**: Colyseus の `lock()` はルームをマッチメイキング対象から外し、新規 `joinOrCreate` をブロックする。マッチ開始と同時にロックするのが自然。

### 3. `onLeave` での切断処理フロー

```
onLeave(client, consented)
  ├─ matchPhase !== 'playing' → ヒーロー削除のみ（待機中の離脱）
  ├─ isSoloMode → ヒーロー削除のみ（ソロモードは勝敗判定不要）
  └─ matchPhase === 'playing' && !isSoloMode
       → 切断者のチームを特定
       → endMatchByDisconnect(state, disconnectedTeam)
       → ヒーロー削除
```

`endMatchByDisconnect` は `ServerMatchSystem.ts` に追加する純粋関数:
- `matchPhase = 'finished'`
- `winnerTeam = 切断者の相手チーム`
- `matchEndReason = 'player_disconnected'`

**理由**: 既存の `endMatch` との責務分離。通常終了と切断終了でセットするフィールドが異なるため、別関数にする。

### 4. クライアント表示の分岐

既存の VICTORY/DEFEAT オーバーレイに `matchEndReason` による分岐を追加:

| matchEndReason | ローカルチーム = winnerTeam | 表示 |
|---|---|---|
| `tower_destroyed` | Yes | VICTORY |
| `tower_destroyed` | No | DEFEAT |
| `player_disconnected` | Yes | VICTORY |
| `player_disconnected` | No | 味方が切断したため終了 |

**理由**: 切断された側の味方は「自分のせいではない敗北」なので、通常の DEFEAT とは異なるメッセージで伝える。

### 5. `consented` パラメータの扱い

Colyseus 0.16 の `onLeave(client, consented)` で `consented = true` は意図的な離脱（`room.leave()`）、`false` は接続断。

試合中はどちらの場合もマッチ終了とする。意図的に抜けても切断しても、残されたプレイヤーの体験は同じため。

## Risks / Trade-offs

- **同時切断**: 両チームが同時に切断した場合、先に `onLeave` が呼ばれた方のチームが敗北になる → Phase 1 では許容。同時切断は極めて稀。
- **マッチ終了直後の切断**: `matchPhase = 'finished'` の後に `onLeave` が来た場合は `endMatch` のべき等性で無視される → 既存の `if (state.matchPhase === 'finished') return` ガードで安全。
- **ソロモードのbot切断**: botは切断しないので考慮不要。プレイヤーの切断はルーム終了のみ。
