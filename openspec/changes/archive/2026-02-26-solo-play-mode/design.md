## Context

現在のアーキテクチャには2つのコードパスがある:
- **OnlineGameMode** — サーバー権威。Colyseus Room に接続し、全ロジックがサーバー側で実行される
- **OfflineGameMode** — クライアント権威。全 callback が no-op で、GameScene 内にオフライン専用ロジック（`updateOfflineHero`, `updateOfflineCombat` 等）が散在している

PR #151 で LobbyScene の「Offline Play」ボタンは削除済みだが、`OfflineGameMode` クラスと GameScene 内のオフラインコードは残っている。E2E テスト（9ファイル）は全て `startOfflineGame()` に依存しており壊れている。

## Goals / Non-Goals

**Goals:**
- 1人で即座にゲームを遊べる Solo Play モードを提供する
- 既存の GameRoom ロジックをそのまま再利用する（Bot もサーバー上のヒーロー）
- OfflineGameMode と GameScene のオフライン分岐を完全に削除する
- GameMode インターフェースをサーバー権威モードのみに簡素化する

**Non-Goals:**
- Bot AI の高度な戦略（Phase 1 では「最寄り敵に向かって攻撃」で十分）
- Bot の難易度選択 UI
- 2v2 での Bot 補充（将来の拡張として設計だけ考慮する）
- E2E テストの修正（#155 で別対応）

## Decisions

### 1. Solo モードは同じ GameRoom を使う（専用 Room を作らない）

**選択**: GameRoom の `onCreate` で `options.mode === 'solo'` を判定し、`maxClients = 1` に設定する

**代替案**: `SoloGameRoom extends GameRoom` を作る
→ 棄却: GameRoom のロジック（gameUpdate, 各 System）はそのまま使えるため、継承の複雑さを追加する意味がない。`mode` フラグ1つで分岐できる

### 2. Bot ヒーローはサーバー側で HeroSchema を直接登録する

**選択**: `onJoin` 後に `addBotHero()` を呼び出し、`HeroSchema` を `heroes` MapSchema に追加する。Bot の ID は `bot-<team>-<index>` 形式で、Colyseus の sessionId と衝突しない

**代替案**: Bot 専用の BotSchema を作る
→ 棄却: Bot もヒーローなので同じ HeroSchema を使うべき。クライアントからは Bot か人間か区別する必要がない（同じレンダリング）

### 3. ServerBotSystem は gameUpdate ループ内で InputMessage を生成する

**選択**: 各 tick で Bot ごとに `InputMessage` を生成し、`playerInputs` Map に注入する。既存の `processMovement` と `processHeroCombat` がそのまま処理する

**理由**: Bot の入力を既存の入力パイプラインに流すことで、Bot と人間プレイヤーの処理が完全に同一になる。Bot 専用の移動/攻撃ロジックが不要

**Bot AI の基本行動**:
1. 最寄りの敵エンティティ（ミニオン → タワー → ヒーロー）を探す
2. 射程外なら対象に向かって移動（moveDir を設定）
3. 射程内なら攻撃（attackTargetId を設定）

### 4. GameMode インターフェースからオフライン専用メソッドを削除する

**選択**: `sendLocalState`, `sendDamageEvent`, `sendProjectileSpawn`, `onRemotePlayerUpdate`, `onRemotePlayerJoin`, `onRemotePlayerLeave`, `onRemoteDamage`, `onRemoteProjectileSpawn` を削除する。これらは OfflineGameMode の client-authoritative コールバックであり、サーバー権威モードでは `onServerHeroUpdate` 等が代替する

**影響**: `NetworkBridge` の Legacy callback セクションも削除。GameScene のオフライン分岐（`updateOfflineHero`, `updateOfflineCombat`, offline broadcast 等）も削除

### 5. LobbyScene の Solo Play は「接続 → 即 GameScene」フロー

**選択**: Solo Play ボタンクリック → `NetworkClient.connect('game', { mode: 'solo', heroType })` → サーバーが `onJoin` で即 `matchPhase = 'playing'` → クライアントが `matchPhase` 変化を検知 → GameScene 遷移。既存の Online Battle フローと同じだが、waiting 状態をスキップする

### 6. GameRoomState に `mode` フィールドを追加しない

**選択**: `mode` は `onCreate` の options でのみ使用し、state に含めない。クライアントは mode を知る必要がない（Bot も通常のヒーローとして描画される）

## Risks / Trade-offs

**[Risk] Bot AI が弱すぎてつまらない**
→ Phase 1 では「最寄り敵に向かって攻撃」で十分。AI 改善は後続 Issue で段階的に行う

**[Risk] Solo Play でサーバー接続が必須になる**
→ 開発時は `npm run dev` で自動起動。本番はインフラが常時稼働。サーバーダウン時はエラー表示

**[Risk] GameMode インターフェース変更が広範囲に影響する**
→ OfflineGameMode の参照箇所をリストアップ済み（GameScene, NetworkBridge, テスト）。段階的に削除する

**[Trade-off] Bot の ID 体系**
→ `bot-red-0` のような固定 ID を使う。将来 2v2 で Bot 補充する場合も同じ体系で拡張可能
