## Why

現在ゲームを遊ぶにはオンライン対戦（2人揃う必要）しかなく、1人ではプレイできない。ブラウザゲームなのでオフラインプレイのシーンはなく、サーバー上の1人用ルームでBot対戦を提供することで「5分で楽しめる」Phase 1 の目標を達成する。旧 OfflineGameMode は PR #151 で UI 入口を削除済みだが、コード自体は残っており GameScene を複雑にしている。

## What Changes

- LobbyScene に「Solo Play」ボタンを追加し、`{ mode: 'solo', heroType }` でサーバーに接続する
- GameRoom が `mode: 'solo'` を受け取ると `maxClients = 1` に設定し、プレイヤー参加で即 `matchPhase = 'playing'` に遷移する
- サーバーが敵チームに Bot ヒーローを自動追加し、ServerBotSystem がゲームループ内で Bot の入力を生成する
- **BREAKING**: `OfflineGameMode` クラスを削除し、GameScene 内のオフライン専用コードパスを削除する
- **BREAKING**: `GameMode` インターフェースからオフライン専用メソッド（`sendState`, `sendDamage`, `sendProjectileSpawn`）を削除する

## Capabilities

### New Capabilities
- `solo-play-mode`: Solo Play のルーム設定（maxClients=1、即時開始）、Bot ヒーロー追加、ServerBotSystem による Bot AI

### Modified Capabilities
- `lobby-scene`: 「オフラインで遊ぶ」ボタンを「Solo Play」ボタンに置き換え。Solo Play はオンライン接続だが waiting 状態なしで即 GameScene 遷移
- `online-multiplayer`: オフラインフォールバック要件の削除。GameScene の OfflineGameMode フォールバックを削除し、サーバー接続必須に変更

## Impact

- **サーバー**: `GameRoom` に solo モード分岐追加、`ServerBotSystem` 新規作成、`HeroSchema` に `isBot` フラグ追加
- **クライアント**: `OfflineGameMode` 削除、`GameScene` からオフライン専用ロジック削除（`updateOfflineHero`, `updateOfflineCombat` 等）、`GameMode` インターフェース簡素化
- **E2E テスト**: 全テストが `startOfflineGame` を使用しており壊れている。Solo Play ベースで書き直し（#155 で対応）
- **依存**: サーバー起動が必須になるため、開発時は `npm run dev` でサーバー同時起動が前提
